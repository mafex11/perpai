// app/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { LoaderCircle } from 'lucide-react';

const MODELS = [
  'sonar',
  'sonar-pro',
  'sonar-reasoning',
  'sonar-reasoning-pro',
  'sonar-deep-research',
];

export default function Home() {
  const [model, setModel] = useState('sonar');
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('model', model);
      formData.append('query', query);
      if (image) formData.append('image', image);

      const res = await fetch('/api/ask', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ thinking: 'Error', answer: String(error), code: null });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Perplexity AI Client</h1>
      <Select onValueChange={setModel} value={model}>
        <SelectTrigger>
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent>
          {MODELS.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Textarea
        placeholder="Ask a question..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <Input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files?.[0] ?? null)}
      />
      <Button onClick={handleSubmit} disabled={loading || !query}>
        {loading ? <LoaderCircle className="animate-spin" /> : 'Submit'}
      </Button>
      {response && (
        <Card>
          <CardContent className="p-4 space-y-2 whitespace-pre-wrap">
            <div><strong>Thought:</strong> {response.thinking}</div>
            <div><strong>Answer:</strong> {response.answer}</div>
            {response.code && (
              <pre className="bg-gray-100 p-2 rounded-md overflow-x-auto">
                <code>{response.code}</code>
              </pre>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
