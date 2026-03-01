import { NextRequest, NextResponse } from 'next/server';

// Fragrantica is protected by Cloudflare's JS challenge for direct server fetches.
// We route through allorigins.win which proxies the request from servers that
// Cloudflare treats as browser traffic, bypassing the challenge.
async function scrapeUrl(url: string): Promise<string | null> {
  try {
    const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxy, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    const html = await res.text();
    // Detect if we got a Cloudflare challenge page instead of real content
    if (html.includes('Just a moment') || html.includes('cf-browser-verification') || html.length < 2000) {
      return null;
    }
    return html;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  if (!q || q.length < 2) return NextResponse.json([]);

  const html = await scrapeUrl(
    `https://www.fragrantica.com/search/?query=${encodeURIComponent(q)}`
  );

  if (!html) return NextResponse.json([]);

  const results: { id: string; name: string; brand: string; image: string; url: string }[] = [];
  const seen = new Set<string>();

  // Fragrantica perfume URLs: /perfume/{BrandSlug}/{NameSlug}-{id}.html
  // The numeric id maps directly to the thumbnail on fimgs.net
  const linkRe = /href="(\/perfume\/([^/]+)\/([^"]+?)-(\d+)\.html)"/g;
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    if (results.length >= 8) break;
    const [, path, brandSlug, nameSlug, id] = m;
    if (seen.has(id)) continue;
    seen.add(id);
    results.push({
      id,
      name: nameSlug.replace(/-/g, ' '),
      brand: brandSlug.replace(/-/g, ' '),
      image: `https://fimgs.net/mdimg/perfume/375x500.${id}.jpg`,
      url: path,
    });
  }

  return NextResponse.json(results);
}
