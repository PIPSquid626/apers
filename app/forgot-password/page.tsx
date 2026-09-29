"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="reset-card">
        <h1 className="auth-title">Reset your password</h1>

        {sent ? (
          <p className="auth-text">
            If an account exists for <strong>{email}</strong>, a reset link has been sent. Check your
            inbox (and your spam folder, just in case).
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form-plain">
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              required
            />
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" disabled={loading} className="auth-btn">
              {loading ? "Sending..." : "Send reset link"}
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