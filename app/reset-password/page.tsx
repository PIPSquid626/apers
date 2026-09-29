"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false); // true once Supabase confirms the reset link is valid
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // The emailed link signs the user in temporarily; Supabase reads the token from the URL.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
        setChecked(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      setChecked(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setDone(true);
    await supabase.auth.signOut();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="reset-card">
        <h1 className="auth-title">Choose a new password</h1>

        {done ? (
          <p className="auth-text">Your password has been updated. You can now sign in with it.</p>
        ) : !checked ? (
          <p className="auth-text">Checking your reset link...</p>
        ) : !ready ? (
          <p className="auth-text">
            This reset link is invalid or has expired. Please request a new one from the{" "}
            <a href="/forgot-password" className="auth-link-small">
              forgot password page
            </a>
            .
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form-plain">
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              required
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="auth-input"
              required
            />
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" disabled={loading} className="auth-btn">
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        )}

        <a href="/" className="auth-link-small">
          Back to sign in
        </a>
      </div>
    </main>
  );
}