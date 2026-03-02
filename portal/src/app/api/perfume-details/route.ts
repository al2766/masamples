import { NextRequest, NextResponse } from 'next/server';
import { parse as parseHtml5 } from 'node-html-parser';

export const maxDuration = 30;

interface PerfumeDetails {
  description?: string;
  notes?: { top: string[]; middle: string[]; base: string[] };
  scentProfiles?: string[];
  image?: string;
}

function parseHtml(html: string): PerfumeDetails {
  const root = parseHtml5(html);
  const d: PerfumeDetails = {};

  // Description: #perfume-description-content p:first-child
  const descP = root.querySelector('#perfume-description-content p');
  if (descP) d.description = descP.text.trim().substring(0, 600) || undefined;

  // Fallback: og:description
  if (!d.description) {
    d.description = root
      .querySelector('meta[property="og:description"]')
      ?.getAttribute('content')
      ?.trim();
  }

  // Image
  d.image =
    root.querySelector('img[itemprop="image"]')?.getAttribute('src') ??
    root.querySelector('meta[property="og:image"]')?.getAttribute('content');

  // Notes: pyramid-level-new[notes="top/middle/base"] .pyramid-note-label
  function notesForTier(tier: string): string[] {
    const level = root.querySelector(`pyramid-level-new[notes="${tier}"]`);
    if (!level) return [];
    return level
      .querySelectorAll('.pyramid-note-label')
      .map((el) => el.text.trim())
      .filter(Boolean);
  }

  const top = notesForTier('top');
  const middle = notesForTier('middle');
  const base = notesForTier('base');
  if (top.length || middle.length || base.length) {
    d.notes = { top, middle, base };
  }

  return d;
}

// GET /api/perfume-details?url=/perfume/Dior/Sauvage-31861.html
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('url');

  if (!path || !path.startsWith('/perfume/')) {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  const targetUrl = `https://www.fragrantica.com${path}`;

  // Simple fetch — same as what Postman does
  try {
    const res = await fetch(targetUrl, { signal: AbortSignal.timeout(10000) });
    if (res.ok) {
      const html = await res.text();
      const data = parseHtml(html);
      if (data.description || data.notes) {
        return NextResponse.json(data);
      }
    }
  } catch { /* blocked or timed out — fall through to Jina */ }

  // Jina.ai fallback: headless browser that bypasses Cloudflare
  try {
    const res = await fetch(`https://r.jina.ai/${targetUrl}`, {
      headers: { Accept: 'text/plain', 'X-Return-Format': 'text' },
      signal: AbortSignal.timeout(20000),
    });
    if (res.ok) {
      const text = await res.text();
      if (text.length > 500) {
        // Extract description sentence and notes from plain text
        const descM = text.match(
          /[A-Z]\w[^\n]*?is (?:a|an) [^\n]+fragrance[\s\S]*?base notes? (?:are|is) [^.]+\./i
        );
        const description = descM
          ? descM[0].replace(/\s+/g, ' ').trim().substring(0, 600)
          : undefined;

        const split = (raw: string) =>
          raw.split(/,| and /).map((s) => s.replace(/;.*$/, '').trim()).filter(Boolean);
        const topM    = text.match(/[Tt]op notes?\s+(?:is|are)\s+([^;.]+)/i);
        const midM    = text.match(/(?:[Mm]iddle|[Hh]eart) notes?\s+(?:is|are)\s+([^;.]+)/i);
        const baseM   = text.match(/[Bb]ase notes?\s+(?:is|are)\s+([^;.]+)/i);
        const notes = (topM || midM || baseM)
          ? { top: topM ? split(topM[1]) : [], middle: midM ? split(midM[1]) : [], base: baseM ? split(baseM[1]) : [] }
          : undefined;

        if (description || notes) return NextResponse.json({ description, notes });
      }
    }
  } catch { /* ignore */ }

  return NextResponse.json({ error: 'Could not fetch perfume page' }, { status: 502 });
}
