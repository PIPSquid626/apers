"use client";

import { useState } from "react";
import { useAdminData } from "@/lib/useAdminData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const inputClass =
  "rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-3 py-2 text-sm text-[var(--admin-text)] placeholder:text-[var(--admin-muted)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/20";
const buttonClass =
  "rounded-full bg-[var(--admin-accent)] px-5 py-2 text-xs font-bold uppercase tracking-wide text-[var(--admin-accent-contrast)] transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0";
const labelClass = "text-xs text-[var(--admin-muted)]";

export default function StudentsPage() {
  const { students, loading, refresh } = useAdminData();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [department, setDepartment] = useState("Computer Science");
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState("");

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormMessage("");

    const res = await fetch("/api/create-student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, fullName, identifier, department }),
    });

    const result = await res.json();
    setSubmitting(false);

    if (result.error) {
      setFormMessage(`Error: ${result.error}`);
      return;
    }

    setFormMessage(`Success! ${fullName} was added.`);
    setEmail("");
    setPassword("");
    setFullName("");
    setIdentifier("");
    refresh();
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold text-[var(--admin-text)]">Students</h1>
      <p className="mt-1 text-sm text-[var(--admin-muted)]">Add new students and view everyone currently enrolled.</p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Add Student</CardTitle>
          <CardDescription>Creates a login account with role = student</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddStudent} className="flex max-w-md flex-col gap-3">
            <label className={labelClass}>Full name</label>
            <input className={inputClass} type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            <label className={labelClass}>Email</label>
            <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <label className={labelClass}>Password</label>
            <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <label className={labelClass}>Identifier (e.g. CSC/20/005)</label>
            <input className={inputClass} type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
            <label className={labelClass}>Department</label>
            <input className={inputClass} type="text" value={department} onChange={(e) => setDepartment(e.target.value)} />
            <button className={buttonClass} type="submit" disabled={submitting}>
              {submitting ? "Adding..." : "Add Student"}
            </button>
            {formMessage && <p className="text-xs text-[var(--admin-muted)]">{formMessage}</p>}
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>All Students</CardTitle>
          <CardDescription>{loading ? "Loading…" : `${students.length} student(s)`}</CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">No students yet.</p>
          ) : (
            <div className="flex flex-col divide-y divide-[var(--admin-border)]">
              {students.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-[var(--admin-text)]">
                    {s.full_name}
                    <span className="ml-2 text-[var(--admin-muted)]">{s.identifier}</span>
                  </span>
                  <span className="text-[var(--admin-muted)]">{s.department}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}