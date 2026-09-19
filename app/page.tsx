"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchMyRole } from "@/lib/auth/permissions";
import { getHomePathForRole } from "@/lib/auth/routes";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [error, setError] = useState("");

  const redirectAfterAuth = async () => {
    try {
      const role = await fetchMyRole(supabase);
      const path = getHomePathForRole(role);
      window.location.href = path;
    } catch {
      window.location.href = "/dashboard";
    }
  };

  const handleGithubLogin = async () => {
    setError("");
    setGithubLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    setGithubLoading(false);

    if (error) {
      setError("La connexion GitHub n'a pas pu être démarrée.");
    }
  };

  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Veuillez renseigner votre email et votre mot de passe.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setError("Email ou mot de passe incorrect.");
      return;
    }

    await redirectAfterAuth();
  };

  return (
    <main className="min-h-screen bg-[#F7F8FC] flex items-center justify-center p-6">
      <div className="w-full max-w-5xl min-h-[620px] bg-white rounded-3xl shadow-xl overflow-hidden flex">

        <div className="hidden md:flex md:w-1/2 bg-[#6C2BD9] text-white p-12 flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-2xl">
                🎓
              </div>

              <div>
                <h1 className="text-2xl font-bold">EduSoft CG</h1>
                <p className="text-sm text-white/70">
                  Smart School Management
                </p>
              </div>
            </div>

            <div className="mt-24">
              <p className="text-sm uppercase tracking-[0.2em] text-white/60">
                Bienvenue
              </p>

              <h2 className="mt-4 text-4xl font-bold leading-tight">
                Gérez votre établissement
                <br />
                plus intelligemment.
              </h2>

              <p className="mt-6 max-w-md text-white/75 leading-7">
                Une plateforme moderne pour gérer les élèves, les enseignants,
                les finances, la pédagogie et l'administration de votre école.
                Chaque rôle dispose de son propre espace de travail.
              </p>
            </div>
          </div>

          <p className="text-sm text-white/50">
            © 2026 EduSoft CG
          </p>
        </div>

        <div className="w-full md:w-1/2 p-8 sm:p-12 lg:p-16 flex items-center">
          <div className="w-full max-w-md mx-auto">

            <div className="mb-10">
              <h2 className="text-3xl font-bold text-gray-900">
                Connexion
              </h2>

              <p className="mt-2 text-gray-500">
                Connectez-vous à votre espace EduSoft CG
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="directeur@ecole.cg"
                className="w-full h-14 px-4 rounded-xl border border-gray-200 bg-gray-50 outline-none transition focus:border-[#6C2BD9] focus:ring-4 focus:ring-[#6C2BD9]/10"
              />
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Mot de passe
                </label>

                <button
                  type="button"
                  className="text-sm font-medium text-[#6C2BD9] hover:text-[#5920B8]"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-14 px-4 pr-14 rounded-xl border border-gray-200 bg-gray-50 outline-none transition focus:border-[#6C2BD9] focus:ring-4 focus:ring-[#6C2BD9]/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex items-center gap-2 mb-8">
              <input
                type="checkbox"
                className="w-4 h-4 accent-[#6C2BD9]"
              />

              <span className="text-sm text-gray-600">
                Se souvenir de moi
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading || githubLoading}
              className="w-full h-14 rounded-xl bg-[#6C2BD9] text-white font-semibold text-base shadow-lg shadow-[#6C2BD9]/20 hover:bg-[#5920B8] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-[0.2em] text-gray-400">
                <span className="bg-white px-3">ou</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGithubLogin}
              disabled={loading || githubLoading}
              className="w-full h-14 rounded-xl border border-gray-200 bg-white text-gray-800 font-semibold text-base hover:bg-gray-50 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <span className="text-lg">🐙</span>
              {githubLoading ? "Redirection GitHub..." : "Se connecter avec GitHub"}
            </button>

            <p className="text-center text-sm text-gray-400 mt-8">
              Accès sécurisé · EduSoft CG
            </p>

          </div>
        </div>

      </div>
    </main>
  );
}
