import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export const maxDuration = 45;

// Splits comma / "and" / · separated note strings into an array
function split(raw: string): string[] {
  return raw
    .split(/[,·]|\band\b/)
    .map((s) => s.replace(/[;|(].*/g, '').trim())
    .filter((s) => s.length > 1 && s.length < 40);
}

// Extracts top/middle/base notes from any text (meta description, plain text, markdown)
function extractNotes(text: string) {
  const topM  = text.match(/[Tt]op\s+[Nn]otes?\s+(?:are|is|:)\s*([^;.\n]+)/i)
             ?? text.match(/\*\*Top\s+Notes?\*\*[:\s]+([^\n]+)/i);
  const midM  = text.match(/(?:[Mm]iddle|[Hh]eart)\s+[Nn]otes?\s+(?:are|is|:)\s*([^;.\n]+)/i)
             ?? text.match(/\*\*(?:Middle|Heart)\s+Notes?\*\*[:\s]+([^\n]+)/i);
  const baseM = text.match(/[Bb]ase\s+[Nn]otes?\s+(?:are|is|:)\s*([^;.\n]+)/i)
             ?? text.match(/\*\*Base\s+Notes?\*\*[:\s]+([^\n]+)/i);

  if (!topM && !midM && !baseM) return undefined;
  return {
    top:    topM  ? split(topM[1])  : [],
    middle: midM  ? split(midM[1])  : [],
    base:   baseM ? split(baseM[1]) : [],
  };
}

// Parse HTML with cheerio — works on both direct Fragrantica HTML and Jina.ai rendered HTML
function parseHtml(html: string) {
  const $ = cheerio.load(html);

  // Description: dedicated content block, then meta tags as fallback
  const description =
    $('#perfume-description-content p').first().text().trim().substring(0, 600)
    || $('meta[name="description"]').attr('content')?.substring(0, 600)
    || $('meta[property="og:description"]').attr('content')?.substring(0, 600)
    || undefined;

  // Image
  const image =
    $('img[itemprop="image"]').attr('src') ??
    $('meta[property="og:image"]').attr('content');

  // Notes from pyramid custom elements (works on direct HTML)
  function notesForTier(tier: string): string[] {
    return $(`pyramid-level-new[notes="${tier}"] .pyramid-note-label`)
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean);
  }

  let top    = notesForTier('top');
  let middle = notesForTier('middle');
  let base   = notesForTier('base');

  // If pyramid elements empty, try parsing notes out of the meta description text
  // Fragrantica's meta description usually contains the full notes sentence:
  // "Sauvage is a fragrance... Top notes are Bergamot; middle notes are..."
  if (!top.length && !middle.length && !base.length) {
    const metaText =
      $('meta[name="description"]').attr('content') ??
      $('meta[property="og:description"]').attr('content') ??
      '';
    const notes = extractNotes(metaText);
    if (notes) ({ top, middle, base } = notes);
  }

  const notes = (top.length || middle.length || base.length)
    ? { top, middle, base }
    : undefined;

  return { description: description || undefined, notes, image };
}

// Parse plain text / markdown (Jina.ai text output)
function parseText(text: string) {
  const notes = extractNotes(text);
  const descM = text.match(/[A-Z][^.!?]*(?:fragrance|perfume|scent|cologne)[^.!?]*[.!?]/i);
  const description = descM ? descM[0].trim().substring(0, 600) : undefined;
  return { description, notes };
}

// GET /api/perfume-details?url=https://www.fragrantica.com/perfume/Dior/Sauvage-31861.html
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl || !targetUrl.startsWith('https://www.fragrantica.com/perfume/')) {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  const debug: string[] = [];

  // ── 1. Direct axios + cheerio ─────────────────────────────────────────────
  try {
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 8000,
    });
    debug.push(`direct: OK ${response.status}, ${response.data.length} bytes`);
    const { description, notes, image } = parseHtml(response.data);
    debug.push(`direct: desc=${description ? 'yes' : 'no'}, notes=${JSON.stringify(notes)}`);
    if (description || notes) return NextResponse.json({ description, notes, image });
    debug.push('direct: parsed but found nothing');
  } catch (e: unknown) {
    const err = e as { response?: { status: number }; message?: string };
    debug.push(`direct: error ${err?.response?.status ?? err?.message}`);
  }

  // ── 2. Jina.ai HTML render + cheerio ─────────────────────────────────────
  // Jina uses headless Chromium so it bypasses Cloudflare and executes JS.
  // Requesting HTML lets us reuse the same cheerio selectors + meta tag parsing.
  try {
    const res = await axios.get(`https://r.jina.ai/${targetUrl}`, {
      headers: { Accept: 'text/html', 'X-Return-Format': 'html' },
      timeout: 25000,
    });
    debug.push(`jina-html: OK ${res.status}, ${res.data.length} bytes`);
    const { description, notes, image } = parseHtml(res.data);
    debug.push(`jina-html: desc=${description ? 'yes' : 'no'}, notes=${JSON.stringify(notes)}`);
    if (description || notes) return NextResponse.json({ description, notes, image });
    debug.push('jina-html: parsed but found nothing');
  } catch (e: unknown) {
    const err = e as { response?: { status: number }; message?: string };
    debug.push(`jina-html: error ${err?.response?.status ?? err?.message}`);
  }

  // ── 3. Jina.ai markdown text + regex ─────────────────────────────────────
  try {
    const res = await axios.get(`https://r.jina.ai/${targetUrl}`, {
      headers: { Accept: 'text/plain', 'X-Return-Format': 'text' },
      timeout: 20000,
    });
    debug.push(`jina-text: OK ${res.status}, ${res.data.length} bytes`);
    const { description, notes } = parseText(res.data);
    debug.push(`jina-text: desc=${description ? 'yes' : 'no'}, notes=${JSON.stringify(notes)}`);
    if (description || notes) return NextResponse.json({ description, notes });
    debug.push('jina-text: parsed but found nothing');
  } catch (e: unknown) {
    const err = e as { response?: { status: number }; message?: string };
    debug.push(`jina-text: error ${err?.response?.status ?? err?.message}`);
  }

  return NextResponse.json({ error: 'Could not fetch perfume page', debug }, { status: 502 });
}
