import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const MOOD_LIST = ['grinding', 'frustrated', 'chill', 'focused', 'tired', 'motivated', 'productive'];
const TAG_LIST = ['#study', '#gym', '#coding', '#work', '#art', '#music', '#gaming', '#nocturnal', '#grind', '#reading', '#cooking', '#fitness', '#sleep', '#earlybird', '#introverted', '#extroverted', '#traveler', '#selfcare', '#sports', '#content', '#poetry', '#drawing', '#photography', '#writing', '#anime', '#foodie', '#linux', '#student', '#college', '#highschool', '#parenting', '#nightowl'];

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY not set' }, { status: 500 });
  }

  const { content } = await req.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: 'No content provided' }, { status: 400 });
  }

  const prompt = `You are analyzing a personal journal entry. Based on the text, return ONLY a JSON object with:
- "mood": one word from this list (pick the best match): ${MOOD_LIST.join(', ')}
- "tags": array of 2-4 tags from this list (pick the most relevant): ${TAG_LIST.join(', ')}
- "summary": one short sentence (max 12 words) capturing the emotional core of the entry

Journal entry:
"${content.slice(0, 800)}"

Respond with ONLY valid JSON. No explanation, no markdown, no code blocks.
Example: {"mood":"focused","tags":["#coding","#work"],"summary":"Deep work session with clear progress made."}`;

  try {
    const groqRes = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      return NextResponse.json({ error: 'Groq error', detail: err }, { status: 502 });
    }

    const data = await groqRes.json();
    const raw = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(raw);

    // Sanitise — only allow values from our lists
    const mood = MOOD_LIST.includes(parsed.mood) ? parsed.mood : '';
    const tags = (parsed.tags || []).filter((t: string) => TAG_LIST.includes(t)).slice(0, 4);
    const summary = typeof parsed.summary === 'string' ? parsed.summary.slice(0, 100) : '';

    return NextResponse.json({ mood, tags, summary });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
  }
}
