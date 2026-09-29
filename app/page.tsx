"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import "./auth.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<"student" | "staff">("student");

  // Sign in state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Sign up state (students only — see /api/signup)
  const [suFullName, setSuFullName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suIdentifier, setSuIdentifier] = useState("");
  const [suDepartment, setSuDepartment] = useState("");
  const [suError, setSuError] = useState("");
  const [suLoading, setSuLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setLoading(false);
      setError(authError.message);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const actualRole = profile?.role; // "admin" | "lecturer" | "student" | undefined
    const isStaffAccount = actualRole === "admin" || actualRole === "lecturer";
    const isStudentAccount = actualRole === "student";

    if (role === "student" && isStaffAccount) {
      await supabase.auth.signOut();
      setLoading(false);
      setError("This is a staff account. Switch to the Staff tab to sign in.");
      return;
    }

    if (role === "staff" && isStudentAccount) {
      await supabase.auth.signOut();
      setLoading(false);
      setError("This is a student account. Switch to the Student tab to sign in.");
      return;
    }

    setLoading(false);

    if (actualRole === "admin") router.push("/admin");
    else if (actualRole === "lecturer") router.push("/lecturer");
    else router.push("/student");
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setSuError("");
    setSuLoading(true);

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: suEmail,
        password: suPassword,
        fullName: suFullName,
        identifier: suIdentifier,
        department: suDepartment,
      }),
    });

    const result = await res.json();

    if (result.error) {
      setSuLoading(false);
      setSuError(result.error);
      return;
    }

    // Account created — sign the student straight in so it feels instant
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: suEmail,
      password: suPassword,
    });

    setSuLoading(false);

    if (signInError) {
      setSuError("Account created — please sign in below.");
      setMode("signin");
      return;
    }

    router.push("/student");
  }

  const isSignin = mode === "signin";
  const isSignup = mode === "signup";

  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-4 py-10">
      <div
        className={`ac-card ${isSignup ? "ac-mode-signup" : "ac-mode-signin"}`}
        role="group"
        aria-label="Sign in and sign up card"
      >
        <div className="ac-panel ac-panel-cyan" aria-hidden="true"></div>
        <div className="ac-panel ac-panel-dark" aria-hidden="true"></div>

        {/* ---- Promo copy (teal side) ---- */}
        <section
          className={`ac-promo ac-promo-signin ac-layer ${isSignin ? "ac-active" : ""}`}
          aria-hidden={!isSignin}
        >
          <h2 className="ac-promo-title">Hello, Student!</h2>
          <p className="ac-promo-text">
            New here? Create a student account to track your results and GPA.
          </p>
          <button type="button" className="ac-promo-btn" onClick={() => setMode("signup")}>
            Sign Up
          </button>
        </section>

        <section
          className={`ac-promo ac-promo-signup ac-layer ${isSignup ? "ac-active" : ""}`}
          aria-hidden={!isSignup}
        >
          <h2 className="ac-promo-title">Welcome Back!</h2>
          <p className="ac-promo-text">
            Already have an account? Sign in to pick up right where you left off.
          </p>
          <button type="button" className="ac-promo-btn" onClick={() => setMode("signin")}>
            Sign In
          </button>
        </section>

        {/* ---- Sign in form (dark side) ---- */}
        <section
          className={`ac-form-zone ac-zone-signin ac-layer ${isSignin ? "ac-active" : ""}`}
          aria-hidden={!isSignin}
        >
          <form onSubmit={handleLogin} className="ac-form">
            <h1 className="ac-form-title">{role === "student" ? "Student Sign In" : "Staff Sign In"}</h1>

            <div className="ac-role-toggle">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={role === "student" ? "ac-role-btn ac-active" : "ac-role-btn"}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole("staff")}
                className={role === "staff" ? "ac-role-btn ac-active" : "ac-role-btn"}
              >
                Staff
              </button>
            </div>

            <input
              type="email"
              placeholder={role === "student" ? "Student email" : "Staff email"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="ac-input"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="ac-input"
              required
            />

            <a href="/forgot-password" className="ac-link-small">
              Forgot your password?
            </a>

            {error && <p className="ac-error">{error}</p>}

            <button type="submit" disabled={loading} className="ac-submit-btn">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </section>

        {/* ---- Sign up form (dark side) ---- */}
        <section
          className={`ac-form-zone ac-zone-signup ac-layer ${isSignup ? "ac-active" : ""}`}
          aria-hidden={!isSignup}
        >
          <form onSubmit={handleSignup} className="ac-form">
            <h1 className="ac-form-title">Create Student Account</h1>

            <input
              type="text"
              placeholder="Full name"
              value={suFullName}
              onChange={(e) => setSuFullName(e.target.value)}
              className="ac-input"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={suEmail}
              onChange={(e) => setSuEmail(e.target.value)}
              className="ac-input"
              required
            />
            <input
              type="text"
              placeholder="Matric Number"
              value={suIdentifier}
              onChange={(e) => setSuIdentifier(e.target.value)}
              className="ac-input"
              required
            />
            <input
              type="text"
              placeholder="Department"
              value={suDepartment}
              onChange={(e) => setSuDepartment(e.target.value)}
              className="ac-input"
            />
            <input
              type="password"
              placeholder="Password"
              value={suPassword}
              onChange={(e) => setSuPassword(e.target.value)}
              className="ac-input"
              required
            />

            {suError && <p className="ac-error">{suError}</p>}

            <button type="submit" disabled={suLoading} className="ac-submit-btn">
              {suLoading ? "Creating account..." : "Sign Up"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}