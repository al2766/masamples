import { NextRequest, NextResponse } from 'next/server';

interface PerfumeResult {
  id: string;
  name: string;
  brand: string;
  image: string;
}

// Scrapes Fragrantica search results server-side (no API key required).
// Returns up to 8 perfume suggestions matching the query.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  if (!q || q.length < 2) return NextResponse.json([]);

  try {
    const res = await fetch(
      `https://www.fragrantica.com/search/?query=${encodeURIComponent(q)}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) return NextResponse.json([]);

    const html = await res.text();
    const results: PerfumeResult[] = [];
    const seen = new Set<string>();

    // Fragrantica perfume page URLs follow: /perfume/{BrandSlug}/{NameSlug}-{id}.html
    // The ID is the unique numeric identifier — we use it to build the thumbnail URL too.
    const linkRegex = /href="\/perfume\/([^/]+)\/([^"]+)-(\d+)\.html"/g;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      if (results.length >= 8) break;
      const [, brandSlug, nameSlug, id] = match;
      if (seen.has(id)) continue;
      seen.add(id);

      const brand = brandSlug.replace(/-/g, ' ');
      const name = nameSlug.replace(/-/g, ' ');
      // Fragrantica hosts thumbnails at a predictable URL based on the numeric ID
      const image = `https://fimgs.net/mdimg/perfume/375x500.${id}.jpg`;

      results.push({ id, name, brand, image });
    }

    return NextResponse.json(results);
  } catch {
    // Fragrantica unreachable or blocked — return empty so user can fill manually
    return NextResponse.json([]);
  }
}
