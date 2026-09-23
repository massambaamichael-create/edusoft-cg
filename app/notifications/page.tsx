"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Inbox,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/auth";

type NotificationRow = {
  id: string;
  title: string | null;
  message: string | null;
  is_read: boolean | null;
  created_at: string | null;
};

export default function NotificationsPage() {
  const { profile, school, role, loading: identityLoading } = useCurrentUser();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: notificationError } = await supabase
      .from("notifications")
      .select("id,title,message,is_read,created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (notificationError) {
      setError(notificationError.message);
      setItems([]);
    } else {
      setItems((data ?? []) as NotificationRow[]);
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    if (!identityLoading) void load();
  }, [identityLoading, load]);

  const unread = useMemo(
    () => items.filter((item) => !item.is_read).length,
    [items]
  );

  const markRead = async (id: string) => {
    setBusyId(id);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", profile?.id ?? "");

    if (updateError) {
      setError(updateError.message);
    } else {
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, is_read: true } : item
        )
      );
    }
    setBusyId(null);
  };

  const markAllRead = async () => {
    if (!profile || unread === 0) return;
    setBusyId("all");
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", profile.id)
      .eq("is_read", false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setItems((current) => current.map((item) => ({ ...item, is_read: true })));
    }
    setBusyId(null);
  };

  if (identityLoading || !profile) {
    return (
      <main className="min-h-screen bg-[#F6F7FB] p-6">
        <div className="mx-auto max-w-5xl rounded-[26px] bg-white p-8 text-center shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <p className="text-sm text-slate-400">Chargement de votre espace…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F6F7FB] p-5 lg:p-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              EduSoft CG · Communication
            </p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)]">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-950">
                  Notifications
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Vos informations et alertes personnelles, dans un seul espace.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={markAllRead}
            disabled={busyId === "all" || unread === 0}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CheckCheck className="h-4 w-4" />
            Tout marquer comme lu
          </button>
        </header>

        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-semibold text-slate-400">Notifications</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{items.length}</p>
          </div>
          <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-semibold text-slate-400">Non lues</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{unread}</p>
          </div>
          <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-semibold text-slate-400">Compte</p>
            <p className="mt-2 truncate text-sm font-black text-slate-950">{role}</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          {loading ? (
            <div className="p-12 text-center text-sm text-slate-400">
              Chargement des notifications…
            </div>
          ) : items.length === 0 ? (
            <div className="p-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Inbox className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-base font-bold text-slate-800">
                Aucune notification
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Les prochains messages importants apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((item) => {
                const isUnread = !item.is_read;
                return (
                  <article
                    key={item.id}
                    className={`flex gap-4 px-5 py-5 transition lg:px-6 ${
                      isUnread ? "bg-slate-50/80" : "bg-white"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        isUnread
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {isUnread ? (
                        <Sparkles className="h-4 w-4" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <h2 className="text-sm font-bold text-slate-900">
                          {item.title || "Notification EduSoft"}
                        </h2>
                        <time className="text-[11px] text-slate-400">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleString("fr-FR")
                            : "Date inconnue"}
                        </time>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-500">
                        {item.message || "Aucun détail supplémentaire."}
                      </p>
                      {isUnread && (
                        <button
                          type="button"
                          onClick={() => markRead(item.id)}
                          disabled={busyId === item.id}
                          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" />
                          {busyId === item.id ? "Enregistrement…" : "Marquer comme lu"}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <div className="mt-5 flex items-center gap-2 px-1 text-xs text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>
            {school?.name ?? "Établissement"} · Les notifications affichées sont
            limitées à votre compte.
          </span>
        </div>
      </div>
    </main>
  );
}
