import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export const maxDuration = 45;

// Same credentials used by search-perfume — public, embedded in Fragrantica's frontend
const ALGOLIA_APP_ID = 'FGVI612DFZ';
const ALGOLIA_API_KEY =
  'NjdkNmM0ZTBjNzJjNzZjZGQ2MTczOGI1NGRlMDMyODgxNjQ3OTQxZGRhYzYwZDhkMzllNDJiY2M3OTQ1MDYzNHZhbGlkVW50aWw9MTc3NDEyNDQyMw==';

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

// Parse HTML with cheerio
function parseHtml(html: string) {
  const $ = cheerio.load(html);

  const description =
    $('#perfume-description-content p').first().text().trim().substring(0, 600)
    || $('meta[name="description"]').attr('content')?.substring(0, 600)
    || $('meta[property="og:description"]').attr('content')?.substring(0, 600)
    || undefined;

  const image =
    $('img[itemprop="image"]').attr('src') ??
    $('meta[property="og:image"]').attr('content');

  function notesForTier(tier: string): string[] {
    return $(`pyramid-level-new[notes="${tier}"] .pyramid-note-label`)
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean);
  }

  let top    = notesForTier('top');
  let middle = notesForTier('middle');
  let base   = notesForTier('base');

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

  // Main accords — find the h6 "main accords" section and collect all truncate spans
  const accords: string[] = [];
  $('h6').each((_, el) => {
    if ($(el).text().trim().toLowerCase() === 'main accords') {
      $(el).closest('div').find('span.truncate').each((__, span) => {
        const t = $(span).text().trim();
        if (t) accords.push(t);
      });
    }
  });

  return { description: description || undefined, notes, image, accords: accords.length ? accords : undefined };
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

  // ── 0. Algolia object fetch ────────────────────────────────────────────────
  // The perfume ID is embedded in the URL: "Sauvage-31861.html" → objectID 31861
  // Fetching the full Algolia object avoids any HTTP scraping of fragrantica.com.
  const idMatch = targetUrl.match(/-(\d+)\.html$/);
  if (idMatch) {
    try {
      const objectID = idMatch[1];
      const algoliaUrl =
        `https://${ALGOLIA_APP_ID.toLowerCase()}-dsn.algolia.net/1/indexes/fragrantica_perfumes/${objectID}` +
        `?x-algolia-application-id=${ALGOLIA_APP_ID}` +
        `&x-algolia-api-key=${encodeURIComponent(ALGOLIA_API_KEY)}`;

      const res = await fetch(algoliaUrl, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: Record<string, any> = await res.json();
        debug.push(`algolia: OK, keys=${Object.keys(obj).join(',')}`);

        // Fragrantica field names are in Croatian/Serbian
        // opis = description, vrh_note = top notes, srce_note = middle/heart, baza_note = base
        const rawDesc: string =
          obj.opis ?? obj.description ?? obj.desc ?? obj.text ?? '';
        const description = rawDesc ? rawDesc.substring(0, 600) : undefined;

        // Notes may be arrays of strings or a combined string
        function toArr(val: unknown): string[] {
          if (!val) return [];
          if (Array.isArray(val)) return (val as string[]).map(String).filter(Boolean);
          return split(String(val));
        }

        let top    = toArr(obj.vrh_note    ?? obj.top_notes    ?? obj.notes_top);
        let middle = toArr(obj.srce_note   ?? obj.middle_notes ?? obj.notes_middle ?? obj.heart_notes);
        let base   = toArr(obj.baza_note   ?? obj.base_notes   ?? obj.notes_base);

        // If still empty, try a combined notes / meta description string
        if (!top.length && !middle.length && !base.length) {
          const combined = String(obj.notes ?? obj.meta_description ?? obj.opis ?? '');
          if (combined) {
            const parsed = extractNotes(combined);
            if (parsed) ({ top, middle, base } = parsed);
          }
        }

        const notes = (top.length || middle.length || base.length)
          ? { top, middle, base }
          : undefined;

        // Main accords — akordi is the Croatian/Serbian field name
        const accords: string[] = toArr(obj.akordi ?? obj.accords ?? obj.main_accords);

        debug.push(`algolia: desc=${description ? 'yes' : 'no'}, notes=${JSON.stringify(notes)}, accords=${JSON.stringify(accords)}`);

        if (description || notes || accords.length) {
          return NextResponse.json({ description, notes, accords: accords.length ? accords : undefined, image: obj.thumbnail ?? undefined });
        }
        debug.push('algolia: object found but no desc/notes/accords fields — see keys above');
      } else {
        debug.push(`algolia: HTTP ${res.status}`);
      }
    } catch (e: unknown) {
      const err = e as { message?: string };
      debug.push(`algolia: error ${err?.message}`);
    }
  }

  // ── 1. Direct axios + cheerio ─────────────────────────────────────────────
  try {
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'PostmanRuntime/7.51.1',
        Accept: '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
      },
      timeout: 8000,
    });
    debug.push(`direct: OK ${response.status}, ${response.data.length} bytes`);
    const { description, notes, image, accords } = parseHtml(response.data);
    debug.push(`direct: desc=${description ? 'yes' : 'no'}, notes=${JSON.stringify(notes)}, accords=${JSON.stringify(accords)}`);
    if (description || notes || accords?.length) return NextResponse.json({ description, notes, image, accords });
    debug.push('direct: parsed but found nothing');
  } catch (e: unknown) {
    const err = e as { response?: { status: number }; message?: string };
    debug.push(`direct: error ${err?.response?.status ?? err?.message}`);
  }

  // ── 2. Jina.ai HTML render + cheerio ─────────────────────────────────────
  try {
    const res = await axios.get(`https://r.jina.ai/${targetUrl}`, {
      headers: { Accept: 'text/html', 'X-Return-Format': 'html' },
      timeout: 25000,
    });
    debug.push(`jina-html: OK ${res.status}, ${res.data.length} bytes`);
    const { description, notes, image, accords } = parseHtml(res.data);
    debug.push(`jina-html: desc=${description ? 'yes' : 'no'}, notes=${JSON.stringify(notes)}, accords=${JSON.stringify(accords)}`);
    if (description || notes || accords?.length) return NextResponse.json({ description, notes, image, accords });
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
