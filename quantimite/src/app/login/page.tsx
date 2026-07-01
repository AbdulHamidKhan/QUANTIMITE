import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-2xl font-bold mb-6">Log in</h1>
      <Suspense fallback={<p className="text-sm text-slate-500">Loading...</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}