"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SignUpPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      window.location.href = "/dashboard";
      return;
    }

    setCheckEmail(true);
    setLoading(false);
  }

  if (checkEmail) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="bg-card border border-warm rounded p-8 shadow-card">
          <p className="text-2xl mb-3">📬</p>
          <h2 className="text-sand-200 font-semibold mb-2">Confirm your email</h2>
          <p className="text-sand-500 text-sm">
            We sent a confirmation link to{" "}
            <strong className="text-sand-200">{email}</strong>.
            Click it to activate your account.
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
        <h1 className="text-sand-200 font-semibold text-xl mb-1">Create account</h1>
        <p className="text-sand-500 text-sm mb-6">
          Start your Study OS in under a minute.
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

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Input
            label="Confirm password"
            type="password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" size="md" loading={loading} className="w-full mt-1">
            Create account
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-warm text-center">
          <Link
            href="/login"
            className="text-sand-500 text-sm hover:text-sand-200 transition-colors"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
