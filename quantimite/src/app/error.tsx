"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="max-w-lg mx-auto text-center space-y-4 py-16">
      <h2 className="text-2xl font-bold">Something went wrong</h2>
      <p className="text-slate-600">{error.message || "An unexpected error occurred."}</p>
      <button onClick={reset} className="px-4 py-2 rounded bg-brand-600 text-white">
        Try again
      </button>
    </div>
  );
}