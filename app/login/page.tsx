"use client";
import { createBrowserClient } from "@supabase/ssr";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      alert(error.message.toUpperCase());
      setLoading(false);
    } else {
      router.push("/admin");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center font-mono p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-white text-xl font-bold tracking-tighter uppercase">
            Procheckerly <span className="text-zinc-700">/ Auth</span>
          </h1>
          <p className="text-[10px] text-blue-900 font-bold uppercase tracking-[0.3em] mt-2">
            Access Restricted
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="ADMIN_EMAIL"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent border border-zinc-900 p-4 text-white focus:outline-none focus:border-blue-900 transition-all text-sm"
          />
          <input
            type="password"
            placeholder="ACCESS_KEY"
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent border border-zinc-900 p-4 text-white focus:outline-none focus:border-blue-900 transition-all text-sm"
          />
          <button
            disabled={loading}
            className="w-full bg-white text-black font-bold p-4 hover:bg-zinc-200 transition-all uppercase text-xs tracking-widest disabled:opacity-50">
            {loading ? "Verifying..." : "Verify Identity"}
          </button>
        </form>

        <div className="text-center">
          <Link
            href="/register"
            className="text-zinc-600 hover:text-zinc-400 text-[10px] uppercase font-bold tracking-widest">
            Enroll New Node
          </Link>
        </div>
      </div>
    </div>
  );
}
