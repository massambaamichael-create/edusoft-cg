"use client";

import { useEffect, useState } from "react";
import { CreditCard, ReceiptText, WalletCards, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/auth";

export default function FinanceHomePage() {
  const { profile, school, role } = useCurrentUser();
  const [payments, setPayments] = useState(0);
  const [receipts, setReceipts] = useState(0);
  const [fees, setFees] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
    void loadFinance();
  }, []);

  async function loadFinance() {
    setLoading(true);
    const [{ count: paymentCount }, { count: receiptCount }, { count: feeCount }] =
      await Promise.all([
        supabase.from("payments").select("*", { count: "exact", head: true }),
        supabase.from("payment_receipts").select("*", { count: "exact", head: true }),
        supabase.from("school_fees").select("*", { count: "exact", head: true }),
      ]);

    setPayments(paymentCount ?? 0);
    setReceipts(receiptCount ?? 0);
    setFees(feeCount ?? 0);
    setLoading(false);
  }

  const firstName = profile?.first_name || "Collègue";

  return (
    <main className="min-h-full bg-[#F7F8FC] p-6 lg:p-8">
      <header className="mb-8">
        <p className="text-sm font-semibold text-emerald-700">Pilotage financier</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
          Bonjour, {firstName}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {school?.name || "EduSoft CG"} · {role}
        </p>
      </header>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={CreditCard} label="Paiements enregistrés" value={payments} loading={loading} />
        <Metric icon={ReceiptText} label="Reçus générés" value={receipts} loading={loading} />
        <Metric icon={WalletCards} label="Lignes de frais" value={fees} loading={loading} />
        <Metric icon={TrendingUp} label="Suivi" value={payments > 0 ? "Actif" : "À démarrer"} />
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <WalletCards className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Centre financier</h2>
            <p className="mt-1 text-sm text-slate-500">
              Les données affichées proviennent de l’établissement et restent soumises aux permissions Finance.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Info title="Encaissements" text="Paiements enregistrés et traçables." />
          <Info title="Reçus" text="Justificatifs associés aux opérations." />
          <Info title="Frais" text="Éléments de facturation de l’établissement." />
        </div>
      </section>
    </main>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: typeof CreditCard;
  label: string;
  value: number | string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-xs font-medium text-slate-400">EduSoft</span>
      </div>
      <p className="mt-5 text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-950">{loading ? "…" : value}</p>
    </div>
  );
}

function Info({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
    </div>
  );
}
