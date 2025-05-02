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
  const [response, setResponse] = useState<any[]>([]); // Array to store the conversation
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, query }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setResponse((prevResponse) => [
        ...prevResponse,
        { role: 'user', content: query },
        { role: 'assistant', content: data.answer, thinking: data.thinking },
      ]);
      setQuery('');
    } catch (error) {
      setResponse((prevResponse) => [
        ...prevResponse,
        { role: 'user', content: query },
        { role: 'assistant', content: `Error: ${error}`, thinking: 'Error' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">AI Chatbot with Perplexity</h1>
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
      <div className="space-y-4">
        {response.map((message, idx) => (
          <div key={idx} className={`message ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`p-2 rounded-md ${message.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <strong>{message.role === 'user' ? 'You' : 'AI'}:</strong> {message.content}
            </div>
            {message.thinking && (
              <div className="italic text-sm text-muted-foreground">
                Thinking: {message.thinking}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex space-x-4">
        <Textarea
          placeholder="Ask a question..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-grow"
        />
        <Button onClick={handleSubmit} disabled={loading || !query}>
          {loading ? <LoaderCircle className="animate-spin" /> : 'Send'}
        </Button>
      </div>
    </main>
  );
}
