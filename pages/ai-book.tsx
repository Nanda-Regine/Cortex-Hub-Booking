// pages/ai-book.tsx
import type { GetServerSideProps } from 'next';
import { useState } from 'react';

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} }; // Forces SSR so Next won’t try to static-export
};

export default function AIbookPage() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch('/api/ai-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const j = await r.json();
      setResult(j);
    } catch {
      setErr('Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-3">
      <h1 className="text-xl font-semibold">AI Booking Helper</h1>

      <textarea
        className="w-full border rounded p-2"
        rows={5}
        placeholder="Describe your booking…"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <button
        className="inline-flex items-center px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        onClick={run}
        disabled={loading || !prompt.trim()}
      >
        {loading ? 'Thinking…' : 'Generate Booking JSON'}
      </button>

      {err && <div className="text-red-600 text-sm">{err}</div>}

      {result && (
        <pre className="bg-slate-100 p-3 rounded overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
