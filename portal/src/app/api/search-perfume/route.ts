import { NextRequest, NextResponse } from 'next/server';

// Fragrantica's Algolia search credentials — these are public (embedded in
// their frontend JS and visible in network requests). The API key includes
// a validUntil restriction; when it stops working, open fragrantica.com,
// inspect the network tab, find the POST to algolia.net and copy the new
// x-algolia-api-key value from the request URL.
const ALGOLIA_APP_ID = 'FGVI612DFZ';
const ALGOLIA_API_KEY =
  'NjdkNmM0ZTBjNzJjNzZjZGQ2MTczOGI1NGRlMDMyODgxNjQ3OTQxZGRhYzYwZDhkMzllNDJiY2M3OTQ1MDYzNHZhbGlkVW50aWw9MTc3NDEyNDQyMw==';

function toCategory(spol: string): 'mens' | 'womens' | 'unisex' {
  if (spol === 'male') return 'mens';
  if (spol === 'female') return 'womens';
  return 'unisex';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  // Build the Algolia params string (same format Fragrantica's frontend uses)
  const algoliaParams = new URLSearchParams({
    query: q,
    hitsPerPage: '12',
    page: '0',
    attributesToRetrieve: JSON.stringify([
      'naslov',       // perfume name
      'dizajner',     // brand
      'url.EN',       // fragrantica page URL
      'thumbnail',    // image
      'spol',         // gender: male / female / unisex
      'godina',       // year
    ]),
  }).toString();

  try {
    const endpoint = `https://${ALGOLIA_APP_ID.toLowerCase()}-dsn.algolia.net/1/indexes/*/queries` +
      `?x-algolia-application-id=${ALGOLIA_APP_ID}` +
      `&x-algolia-api-key=${encodeURIComponent(ALGOLIA_API_KEY)}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{ indexName: 'fragrantica_perfumes', params: algoliaParams }],
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return NextResponse.json([]);

    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hits: any[] = data?.results?.[0]?.hits ?? [];

    return NextResponse.json(
      hits.map((hit) => {
        // url field comes back as { EN: ["https://www.fragrantica.com/perfume/..."] }
        const urlArr: string[] | undefined =
          hit?.url?.EN ?? hit?.['url.EN'];

        return {
          id:       String(hit.objectID ?? ''),
          name:     String(hit.naslov   ?? ''),
          brand:    String(hit.dizajner ?? ''),
          image:    String(hit.thumbnail ?? ''),
          url:      urlArr?.[0] ?? undefined,
          category: toCategory(String(hit.spol ?? '')),
        };
      })
    );
  } catch {
    return NextResponse.json([]);
  }
}
