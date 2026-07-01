import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto text-center space-y-4 py-16">
      <h2 className="text-3xl font-bold">404 — Not found</h2>
      <p className="text-slate-600">That page doesn't exist or has been moved.</p>
      <Link href="/" className="text-brand-600 hover:underline">Go home</Link>
    </div>
  );
}