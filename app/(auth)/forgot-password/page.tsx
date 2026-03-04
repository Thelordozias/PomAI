"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="bg-card border border-warm rounded p-8 shadow-card">
          <p className="text-2xl mb-3">📬</p>
          <h2 className="text-sand-200 font-semibold mb-2">Check your email</h2>
          <p className="text-sand-500 text-sm">
            We sent a reset link to{" "}
            <strong className="text-sand-200">{email}</strong>. Click it to
            choose a new password.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-block text-ember-500 text-sm hover:text-ember-400 transition-colors"
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-card border border-warm rounded shadow-card p-8">
        <h1 className="text-sand-200 font-semibold text-xl mb-1">
          Reset password
        </h1>
        <p className="text-sand-500 text-sm mb-6">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded px-3 py-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            className="w-full mt-1"
          >
            Send reset link
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-warm text-center">
          <Link
            href="/login"
            className="text-sand-500 text-sm hover:text-sand-200 transition-colors"
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
