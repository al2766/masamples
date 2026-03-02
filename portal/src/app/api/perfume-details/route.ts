import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export const maxDuration = 30;

// GET /api/perfume-details?url=https://www.fragrantica.com/perfume/Dior/Sauvage-31861.html
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl || !targetUrl.startsWith('https://www.fragrantica.com/perfume/')) {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  // Axios GET with a real browser User-Agent
  try {
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    // Description
    const description = $('#perfume-description-content p').first().text().trim().substring(0, 600) || undefined;

    // Image
    const image =
      $('img[itemprop="image"]').attr('src') ??
      $('meta[property="og:image"]').attr('content');

    // Notes from pyramid
    function notesForTier(tier: string): string[] {
      return $(`pyramid-level-new[notes="${tier}"] .pyramid-note-label`)
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(Boolean);
    }

    const top = notesForTier('top');
    const middle = notesForTier('middle');
    const base = notesForTier('base');
    const notes = (top.length || middle.length || base.length)
      ? { top, middle, base }
      : undefined;

    if (description || notes) {
      return NextResponse.json({ description, notes, image });
    }
  } catch { /* blocked or timed out — fall through to Jina */ }

  // Jina.ai fallback: headless browser that bypasses Cloudflare
  try {
    const res = await axios.get(`https://r.jina.ai/${targetUrl}`, {
      headers: { Accept: 'text/plain', 'X-Return-Format': 'text' },
      timeout: 20000,
    });

    const text: string = res.data;
    if (text.length > 500) {
      const descM = text.match(
        /[A-Z]\w[^\n]*?is (?:a|an) [^\n]+fragrance[\s\S]*?base notes? (?:are|is) [^.]+\./i
      );
      const description = descM
        ? descM[0].replace(/\s+/g, ' ').trim().substring(0, 600)
        : undefined;

      const split = (raw: string) =>
        raw.split(/,| and /).map((s) => s.replace(/;.*$/, '').trim()).filter(Boolean);
      const topM  = text.match(/[Tt]op notes?\s+(?:is|are)\s+([^;.]+)/i);
      const midM  = text.match(/(?:[Mm]iddle|[Hh]eart) notes?\s+(?:is|are)\s+([^;.]+)/i);
      const baseM = text.match(/[Bb]ase notes?\s+(?:is|are)\s+([^;.]+)/i);
      const notes = (topM || midM || baseM)
        ? { top: topM ? split(topM[1]) : [], middle: midM ? split(midM[1]) : [], base: baseM ? split(baseM[1]) : [] }
        : undefined;

      if (description || notes) return NextResponse.json({ description, notes });
    }
  } catch { /* ignore */ }

  return NextResponse.json({ error: 'Could not fetch perfume page' }, { status: 502 });
}
