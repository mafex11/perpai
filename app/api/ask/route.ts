import { NextRequest, NextResponse } from 'next/server';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

// Initialize an in-memory conversation context
let conversationHistory: { role: string; content: string }[] = [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { model, query } = body;

    // Add user query to conversation history
    conversationHistory.push({ role: 'user', content: query });

    // Prepare the messages for the Perplexity API
    const messages = [...conversationHistory];

    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ thinking: 'Error', answer: `Perplexity API error ${res.statusText}`, code: null }, { status: 500 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    const codeMatch = content.match(/```[a-z]*\n([\s\S]*?)```/);
    const code = codeMatch ? codeMatch[1] : null;
    const answer = content.replace(/```[a-z]*\n([\s\S]*?)```/, '').trim();

    // Add AI response to the conversation history
    conversationHistory.push({ role: 'assistant', content: answer });

    let thinking = 'Processed via Perplexity';
    if (model === 'sonar-reasoning-pro') {
      const match = content.match(/<think>([\s\S]*?)<\/think>/);
      if (match) {
        thinking = match[1].trim();
      }
    }

    return NextResponse.json({ thinking, answer, code });
  } catch (err) {
    return NextResponse.json({ thinking: 'Error', answer: String(err), code: null }, { status: 500 });
  }
}
