"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ChangePasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/");
        return;
      }

      setLoading(false);
    };

    void checkSession();
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== confirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setSaving(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setSaving(false);
      router.replace("/");
      return;
    }

    const response = await fetch("/api/auth/complete-first-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ password }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success) {
      setSaving(false);
      setError(
        result?.error || "Impossible de mettre à jour le mot de passe."
      );
      return;
    }

    const next = searchParams.get("next") || "/dashboard";
    router.replace(next);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F8FC] flex items-center justify-center p-6">
        <div className="text-sm text-slate-500">Vérification de la session…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F8FC] flex items-center justify-center p-6">
      <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl sm:p-10">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Identity & Access
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">
            Sécurisez votre compte
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Votre accès utilise un mot de passe temporaire. Choisissez un mot de
            passe personnel avant de continuer vers votre espace EduSoft CG.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-14 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5"
              placeholder="Au moins 8 caractères"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="h-14 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5"
              placeholder="Retapez votre mot de passe"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="h-14 w-full rounded-xl bg-slate-900 font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Enregistrement…" : "Continuer vers mon espace"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Accès sécurisé · EduSoft CG
        </p>
      </section>
    </main>
  );
}
