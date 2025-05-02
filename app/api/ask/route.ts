// app/api/ask/route.ts
import { NextRequest, NextResponse } from 'next/server';
import formidable from 'formidable';
import { readFile } from 'fs/promises';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

async function parseForm(req: NextRequest): Promise<{ model: string; query: string; image?: Buffer }> {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: false });
    form.parse(req as any, async (err, fields, files) => {
      if (err) return reject(err);
      const model = fields.model?.[0] || 'sonar';
      const query = fields.query?.[0] || '';
      let imageBuffer: Buffer | undefined = undefined;
      if (files.image) {
        const imageFile = files.image[0];
        imageBuffer = await readFile(imageFile.filepath);
      }
      resolve({ model, query, image: imageBuffer });
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const { model, query, image } = await parseForm(req);

    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: query,
          },
        ],
        ...(image && { image }),
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

    return NextResponse.json({ thinking: 'Processed via Perplexity', answer, code });
  } catch (err) {
    return NextResponse.json({ thinking: 'Error', answer: String(err), code: null }, { status: 500 });
  }
} 