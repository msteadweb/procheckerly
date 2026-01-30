"use server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function getSupabase() {
  const cookieStore = await cookies();
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
          } catch {}
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {}
        },
      },
    },
  );
}

export async function getRemoteLoot() {
  try {
    const supabase = await getSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: profileData } = await supabase
      .from("profiles")
      .select("tenant_id")
      .single();

    const tenantId = user.user_metadata?.tenant_id || profileData?.tenant_id;
    if (!tenantId) return [];

    const REMOTE_API = process.env.NEXT_PUBLIC_REMOTE_API;
    const res = await fetch(`${REMOTE_API}?tenant=${tenantId}`, {
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data = await res.json();
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.error("Action Error:", error);
    return [];
  }
}

export async function purgeRemoteLoot() {
  try {
    const supabase = await getSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false };

    const { data: profileData } = await supabase
      .from("profiles")
      .select("tenant_id")
      .single();

    const tenantId = user.user_metadata?.tenant_id || profileData?.tenant_id;
    if (!tenantId) return { success: false };

    const REMOTE_API = process.env.NEXT_PUBLIC_REMOTE_API;

    // Sends DELETE to proxy with the specific tenant ID
    const res = await fetch(`${REMOTE_API}?tenant=${tenantId}`, {
      method: "DELETE",
      cache: "no-store",
    });

    if (!res.ok) throw new Error("Wipe failed");

    return { success: true };
  } catch (error) {
    console.error("Purge Action Error:", error);
    return { success: false };
  }
}

export async function logout() {
  const supabase = await getSupabase();
  await supabase.auth.signOut();
  redirect("/login");
}
