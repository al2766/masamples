import { NextRequest, NextResponse } from 'next/server';

// Connects to RapidAPI fragrance endpoint when FRAGRANCE_API_KEY is configured.
// Sign up at https://rapidapi.com and search for "Fragrantica" or "perfume database".
// Set FRAGRANCE_API_KEY in .env.local.

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

  const apiKey = process.env.FRAGRANCE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'FRAGRANCE_API_KEY not configured' }, { status: 503 });
  }

  try {
    // Replace this URL with the actual RapidAPI fragrance endpoint you subscribe to.
    // Example endpoint structure shown below:
    const res = await fetch(
      `https://fragrantica-api.p.rapidapi.com/search?q=${encodeURIComponent(q)}&limit=5`,
      {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'fragrantica-api.p.rapidapi.com',
        },
      }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Fragrance API error:', err);
    return NextResponse.json({ error: 'Failed to fetch fragrance data' }, { status: 500 });
  }
}
