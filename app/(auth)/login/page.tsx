"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Mode = "password" | "magic";

export default function LoginPage() {
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "password") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        // Middleware will redirect to /dashboard on next navigation
        window.location.href = "/dashboard";
      }
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setMagicSent(true);
      }
    }

    setLoading(false);
  }

  async function handleSignUp(e: React.MouseEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Enter an email and password first.");
      return;
    }
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
    } else {
      setMagicSent(true); // reuse "check email" screen
    }
    setLoading(false);
  }

  if (magicSent) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="bg-card border border-warm rounded p-8 shadow-card">
          <p className="text-2xl mb-3">📬</p>
          <h2 className="text-sand-200 font-semibold mb-2">Check your email</h2>
          <p className="text-sand-500 text-sm">
            We sent a link to <strong className="text-sand-200">{email}</strong>.
            Click it to sign in.
          </p>
          <button
            onClick={() => { setMagicSent(false); setError(null); }}
            className="mt-5 text-ember-500 text-sm hover:text-ember-400 transition-colors"
          >
            ← Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-card border border-warm rounded shadow-card p-8">
        <h1 className="text-sand-200 font-semibold text-xl mb-1">
          {mode === "password" ? "Sign in" : "Magic link"}
        </h1>
        <p className="text-sand-500 text-sm mb-6">
          {mode === "password"
            ? "Continue to your Study OS."
            : "We'll email you a sign-in link — no password needed."}
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

          {mode === "password" && (
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          )}

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" size="md" loading={loading} className="w-full mt-1">
            {mode === "password" ? "Sign in" : "Send magic link"}
          </Button>

          {mode === "password" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={handleSignUp}
              disabled={loading}
            >
              Create account
            </Button>
          )}
        </form>

        {/* Toggle between modes */}
        <div className="mt-6 pt-5 border-t border-warm text-center">
          {mode === "password" ? (
            <button
              onClick={() => { setMode("magic"); setError(null); }}
              className="text-sand-500 text-sm hover:text-sand-200 transition-colors"
            >
              Sign in with magic link instead
            </button>
          ) : (
            <button
              onClick={() => { setMode("password"); setError(null); }}
              className="text-sand-500 text-sm hover:text-sand-200 transition-colors"
            >
              Sign in with password instead
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
