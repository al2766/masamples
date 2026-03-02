import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export const maxDuration = 45;

// Shared cheerio parser — works on both direct HTML and Jina.ai rendered HTML
function parseHtml(html: string) {
  const $ = cheerio.load(html);

  const description =
    $('#perfume-description-content p').first().text().trim().substring(0, 600) || undefined;

  const image =
    $('img[itemprop="image"]').attr('src') ??
    $('meta[property="og:image"]').attr('content');

  function notesForTier(tier: string): string[] {
    return $(`pyramid-level-new[notes="${tier}"] .pyramid-note-label`)
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean);
  }

  const top    = notesForTier('top');
  const middle = notesForTier('middle');
  const base   = notesForTier('base');
  const notes  = (top.length || middle.length || base.length)
    ? { top, middle, base }
    : undefined;

  return { description, notes, image };
}

// Regex parser for Jina.ai plain-text / markdown output
function parseText(text: string) {
  const split = (raw: string) =>
    raw.split(/,| and /).map((s) => s.replace(/[;|].*/g, '').trim()).filter(Boolean);

  // "Top notes are X, Y and Z"
  const topM  = text.match(/[Tt]op notes?\s+(?:is|are)\s+([^;.\n]+)/i);
  const midM  = text.match(/(?:[Mm]iddle|[Hh]eart) notes?\s+(?:is|are)\s+([^;.\n]+)/i);
  const baseM = text.match(/[Bb]ase notes?\s+(?:is|are)\s+([^;.\n]+)/i);

  // Markdown bold headers: "**Top Notes**: X, Y"
  const topM2  = text.match(/\*\*Top Notes?\*\*\s*[:\-]\s*([^\n]+)/i);
  const midM2  = text.match(/\*\*(?:Middle|Heart) Notes?\*\*\s*[:\-]\s*([^\n]+)/i);
  const baseM2 = text.match(/\*\*Base Notes?\*\*\s*[:\-]\s*([^\n]+)/i);

  const topRaw    = topM?.[1]  ?? topM2?.[1]  ?? '';
  const middleRaw = midM?.[1]  ?? midM2?.[1]  ?? '';
  const baseRaw   = baseM?.[1] ?? baseM2?.[1] ?? '';

  const notes = (topRaw || middleRaw || baseRaw)
    ? { top: split(topRaw), middle: split(middleRaw), base: split(baseRaw) }
    : undefined;

  // First sentence that mentions fragrance / perfume / scent
  const descM = text.match(/[A-Z][^.!?]*(?:fragrance|perfume|scent)[^.!?]*[.!?]/i);
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

  // ── 1. Direct axios + cheerio ─────────────────────────────────────────────
  // Works when Cloudflare doesn't block (e.g. Vercel's IPs aren't flagged yet)
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

    const { description, notes, image } = parseHtml(response.data);
    if (description || notes) return NextResponse.json({ description, notes, image });
  } catch { /* Cloudflare blocked or timed out — fall through */ }

  // ── 2. Jina.ai HTML render + cheerio ─────────────────────────────────────
  // Jina uses a headless browser so it bypasses Cloudflare and executes JS,
  // including Angular custom elements like <pyramid-level-new>. Requesting
  // HTML format lets us reuse the same cheerio selectors from step 1.
  try {
    const res = await axios.get(`https://r.jina.ai/${targetUrl}`, {
      headers: {
        Accept: 'text/html',
        'X-Return-Format': 'html',
      },
      timeout: 25000,
    });

    const { description, notes, image } = parseHtml(res.data);
    if (description || notes) return NextResponse.json({ description, notes, image });
  } catch { /* ignore */ }

  // ── 3. Jina.ai markdown text + regex ─────────────────────────────────────
  // Last resort: if the HTML selectors couldn't find the data (e.g. Jina
  // stripped the custom elements), try regex on the plain-text markdown.
  try {
    const res = await axios.get(`https://r.jina.ai/${targetUrl}`, {
      headers: { Accept: 'text/plain', 'X-Return-Format': 'text' },
      timeout: 20000,
    });

    const { description, notes } = parseText(res.data);
    if (description || notes) return NextResponse.json({ description, notes });
  } catch { /* ignore */ }

  return NextResponse.json({ error: 'Could not fetch perfume page' }, { status: 502 });
}
