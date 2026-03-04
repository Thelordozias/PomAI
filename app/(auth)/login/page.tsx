"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useTranslation } from "@/components/providers/LanguageProvider";

type Mode = "password" | "magic";

function LoginForm() {
  const t = useTranslation();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const next = searchParams.get("next") ?? "/dashboard";
  const safeNext = next.startsWith("/") ? next : "/dashboard";

  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    if (!urlError) return null;
    if (urlError === "auth_callback_failed") return t.auth.errorExpired;
    return t.auth.errorGeneric;
  });
  const [magicSent, setMagicSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "password") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        window.location.href = safeNext;
      }
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`,
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

  if (magicSent) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="bg-card border border-warm rounded p-8 shadow-card">
          <p className="text-2xl mb-3">📬</p>
          <h2 className="text-sand-200 font-semibold mb-2">{t.auth.checkEmail}</h2>
          <p className="text-sand-500 text-sm">{t.auth.checkEmailText(email)}</p>
          <button
            onClick={() => { setMagicSent(false); setError(null); }}
            className="mt-5 text-ember-500 text-sm hover:text-ember-400 transition-colors"
          >
            {t.auth.useDifferentEmail}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-card border border-warm rounded shadow-card p-8">
        <h1 className="text-sand-200 font-semibold text-xl mb-1">
          {mode === "password" ? t.auth.signIn : t.auth.magicLink}
        </h1>
        <p className="text-sand-500 text-sm mb-6">
          {mode === "password" ? t.auth.signInSubtitle : t.auth.magicLinkSubtitle}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label={t.auth.email}
            type="email"
            placeholder={t.auth.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />

          {mode === "password" && (
            <>
              <Input
                label={t.auth.password}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="flex justify-end -mt-2">
                <Link
                  href="/forgot-password"
                  className="text-sand-500 text-xs hover:text-ember-400 transition-colors"
                >
                  {t.auth.forgotPassword}
                </Link>
              </div>
            </>
          )}

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" size="md" loading={loading} className="w-full mt-1">
            {mode === "password" ? t.auth.signIn : t.auth.sendMagicLink}
          </Button>

          {mode === "password" && (
            <Link
              href="/signup"
              className="text-center text-sand-500 text-sm hover:text-sand-200 transition-colors"
            >
              {t.auth.noAccount}
            </Link>
          )}
        </form>

        <div className="mt-6 pt-5 border-t border-warm text-center">
          {mode === "password" ? (
            <button
              onClick={() => { setMode("magic"); setError(null); }}
              className="text-sand-500 text-sm hover:text-sand-200 transition-colors"
            >
              {t.auth.switchToMagic}
            </button>
          ) : (
            <button
              onClick={() => { setMode("password"); setError(null); }}
              className="text-sand-500 text-sm hover:text-sand-200 transition-colors"
            >
              {t.auth.switchToPassword}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-sm h-64 bg-card border border-warm rounded animate-pulse" />}>
      <LoginForm />
    </Suspense>
  );
}
