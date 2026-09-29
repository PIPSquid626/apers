"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { UserCircle2, KeyRound, Palette, Sun, Moon, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/lib/theme-context";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const inputClass =
  "rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-3 py-2 text-sm text-[var(--admin-text)] placeholder:text-[var(--admin-muted)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/20 disabled:opacity-60";
const buttonClass =
  "flex items-center gap-2 self-start rounded-full bg-[var(--admin-accent)] px-5 py-2 text-xs font-bold uppercase tracking-wide text-[var(--admin-accent-contrast)] transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0";
const labelClass = "text-xs text-[var(--admin-muted)]";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  // Account
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountMessage, setAccountMessage] = useState("");

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      setUserId(auth.user.id);
      setEmail(auth.user.email ?? "");
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", auth.user.id).single();
      setFullName(profile?.full_name ?? "");
    })();
  }, []);

  async function handleSaveAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSavingAccount(true);
    setAccountMessage("");
    const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", userId);
    setSavingAccount(false);
    setAccountMessage(error ? "Couldn't save changes. Try again." : "Saved.");
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation don't match.");
      return;
    }

    setSavingPassword(true);

    // Re-verify identity with the current password before allowing the change.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (signInError) {
      setSavingPassword(false);
      setPasswordError("Current password is incorrect.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (updateError) {
      setPasswordError("Couldn't update password. Try again.");
      return;
    }

    setPasswordMessage("Password updated.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold text-[var(--admin-text)]">Settings</h1>
      <p className="mt-1 text-sm text-[var(--admin-muted)]">Account and system settings.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCircle2 size={18} className="text-[var(--admin-accent)]" />
              <CardTitle>Account</CardTitle>
            </div>
            <CardDescription>Your profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveAccount} className="flex flex-col gap-3">
              <label className={labelClass}>Full name</label>
              <input
                className={inputClass}
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <label className={labelClass}>Email</label>
              <input className={inputClass} type="email" value={email} disabled />
              <label className={labelClass}>Role</label>
              <input className={inputClass} type="text" value="Administrator" disabled />
              <button className={buttonClass} type="submit" disabled={savingAccount}>
                <Save size={14} />
                {savingAccount ? "Saving…" : "Save changes"}
              </button>
              {accountMessage && <p className="text-xs text-[var(--admin-muted)]">{accountMessage}</p>}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound size={18} className="text-[var(--admin-accent)]" />
              <CardTitle>Change Password</CardTitle>
            </div>
            <CardDescription>You'll need your current password to confirm the change</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
              <label className={labelClass}>Current password</label>
              <input
                className={inputClass}
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <label className={labelClass}>New password</label>
              <input
                className={inputClass}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <label className={labelClass}>Confirm new password</label>
              <input
                className={inputClass}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button className={buttonClass} type="submit" disabled={savingPassword}>
                <KeyRound size={14} />
                {savingPassword ? "Updating…" : "Update password"}
              </button>
              {passwordError && <p className="text-xs text-poor">{passwordError}</p>}
              {passwordMessage && <p className="text-xs text-[var(--admin-muted)]">{passwordMessage}</p>}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette size={18} className="text-[var(--admin-accent)]" />
              <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>Switch between light and dark mode for the admin portal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border p-4" style={{ borderColor: "var(--admin-border)" }}>
              <div className="flex items-center gap-2 text-sm text-[var(--admin-text)]">
                {theme === "light" ? <Sun size={16} /> : <Moon size={16} />}
                Currently in {theme === "light" ? "light" : "dark"} mode
              </div>
              <button
                onClick={toggleTheme}
                className="rounded-full border px-4 py-1.5 text-xs font-semibold"
                style={{ borderColor: "var(--admin-accent)", color: "var(--admin-accent)" }}
              >
                Switch to {theme === "light" ? "dark" : "light"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}