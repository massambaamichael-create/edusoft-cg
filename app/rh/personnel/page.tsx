"use client";

import { useEffect, useState } from "react";
import { UsersRound, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/auth";

type Row = {
  id: string;
  user_id: string | null;
  employee_number: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
};

export default function PersonnelPage() {
  const { hasAnyPermission } = useCurrentUser();
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    setMessage("");
    const { data, error } = await supabase
      .from("teachers")
      .select("id,user_id,employee_number")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const teacherRows = (data ?? []) as Omit<Row, "first_name" | "last_name" | "email" | "phone">[];
    const userIds = teacherRows.map((x) => x.user_id).filter(Boolean) as string[];
    const users = userIds.length
      ? await supabase.from("users").select("id,first_name,last_name,email,phone").in("id", userIds)
      : { data: [], error: null };

    if (users.error) setMessage(users.error.message);

    const lookup: Record<string, Row> = {};
    (users.data ?? []).forEach((u) => {
      lookup[u.id] = { id: u.id, user_id: u.id, employee_number: null, first_name: u.first_name, last_name: u.last_name, email: u.email, phone: u.phone };
    });

    setRows(teacherRows.map((t) => ({
      ...t,
      first_name: t.user_id ? lookup[t.user_id]?.first_name : null,
      last_name: t.user_id ? lookup[t.user_id]?.last_name : null,
      email: t.user_id ? lookup[t.user_id]?.email : null,
      phone: t.user_id ? lookup[t.user_id]?.phone : null,
    })));
    setLoading(false);
  }

  const filtered = rows.filter((r) => {
    const haystack = [r.first_name, r.last_name, r.employee_number, r.email].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  if (!hasAnyPermission("hr.read", "hr.manage")) {
    return <main className="min-h-full bg-[#F7F8FC] p-8"><div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Accès RH non autorisé.</div></main>;
  }

  return (
    <main className="min-h-full bg-[#F7F8FC] p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-sm font-semibold text-slate-600">Ressources humaines</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Personnel enseignant</h1>
          <p className="mt-2 text-sm text-slate-500">Référentiel du personnel issu des comptes et fiches existants.</p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><UsersRound className="h-5 w-5" /></div>
              <div><p className="font-bold text-slate-900">{rows.length} enseignant{rows.length > 1 ? "s" : ""}</p><p className="text-xs text-slate-500">Sans recréer les informations d’identité.</p></div>
            </div>
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-slate-400" />
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? <div className="p-10 text-center text-sm text-slate-500">Chargement…</div> :
           message ? <div className="p-10 text-center text-sm text-red-600">{message}</div> :
           !filtered.length ? <div className="p-10 text-center text-sm text-slate-500">Aucun personnel correspondant.</div> :
           <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left">
            <thead className="bg-slate-50"><tr className="border-b border-slate-200">
              {["Personnel","Matricule","E-mail","Téléphone"].map((h)=><th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>)}
            </tr></thead>
            <tbody>{filtered.map((r)=><tr key={r.id} className="border-b border-slate-100 last:border-0">
              <td className="px-5 py-4"><p className="font-semibold text-slate-900">{[r.last_name,r.first_name].filter(Boolean).join(" ") || "Personnel sans compte lié"}</p></td>
              <td className="px-5 py-4 text-sm text-slate-600">{r.employee_number || "—"}</td>
              <td className="px-5 py-4 text-sm text-slate-600">{r.email || "—"}</td>
              <td className="px-5 py-4 text-sm text-slate-600">{r.phone || "—"}</td>
            </tr>)}</tbody>
           </table></div>}
        </section>
      </div>
    </main>
  );
}
