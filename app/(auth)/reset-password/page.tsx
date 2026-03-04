"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ResetPasswordPage() {
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setDone(true);
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="bg-card border border-warm rounded p-8 shadow-card">
          <p className="text-2xl mb-3">✅</p>
          <h2 className="text-sand-200 font-semibold mb-2">Password updated!</h2>
          <p className="text-sand-500 text-sm">
            Redirecting you to your dashboard…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-card border border-warm rounded shadow-card p-8">
        <h1 className="text-sand-200 font-semibold text-xl mb-1">
          New password
        </h1>
        <p className="text-sand-500 text-sm mb-6">
          Choose a strong password for your account.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="New password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
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

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            className="w-full mt-1"
          >
            Update password
          </Button>
        </form>
      </div>
    </div>
  );
}
