"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Sidebar from "@/components/admin/Sidebar";
import { ThemeProvider, useTheme } from "@/lib/theme-context";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    loadAdminName();
  }, []);

  async function loadAdminName() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", auth.user.id).single();
    setAdminName(profile?.full_name ?? "");
  }

  return (
    <div data-theme={theme} className="flex h-screen bg-[var(--admin-bg)] transition-colors">
      <Sidebar adminName={adminName} theme={theme} onToggleTheme={toggleTheme} />
      <main className="flex-1 overflow-y-auto px-5 py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </ThemeProvider>
  );
}