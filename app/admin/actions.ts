"use server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Helper function updated for Next.js 16/15 Async Cookies
async function getSupabase() {
  const cookieStore = await cookies(); // Await the promise here

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // This can be ignored if middleware is handling session refreshes
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // Handle error
          }
        },
      },
    },
  );
}

export async function getRemoteLoot(tenantId: string) {
  const REMOTE_API = process.env.NEXT_PUBLIC_REMOTE_API;
  try {
    const res = await fetch(`${REMOTE_API}?tenant=${tenantId}`, {
      cache: "no-store",
    });
    return res.ok ? await res.json() : [];
  } catch (error) {
    console.error("Fetch failed:", error);
    return [];
  }
}

export async function logout() {
  const supabase = await getSupabase(); // Await the helper
  await supabase.auth.signOut();
  redirect("/login");
}
