"use client";

import { useEffect, useState } from "react";
import { UserCircle2, Save, IdCard, Building2, Mail } from "lucide-react";
import { useStudentDataContext } from "@/lib/student-data-context";

export default function StudentProfilePage() {
  const { name, email, identifier, department, updateFullName, loading } = useStudentDataContext();
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setFullName(name);
  }, [name]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const error = await updateFullName(fullName);
    setSaving(false);
    setMessage(error ? "Couldn't save changes. Try again." : "Saved.");
  }

  if (loading) return <p className="text-sm text-ink/60">Loading…</p>;

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold text-ink">Profile</h1>
      <p className="mt-1 text-sm text-ink/60">Your bio-data on record.</p>

      <div className="mt-6 max-w-xl rounded-2xl border border-hairline bg-white p-6">
        <div className="mb-5 flex items-center gap-2">
          <UserCircle2 size={18} className="text-ink" />
          <h2 className="font-serif text-lg font-semibold text-ink">Bio-data</h2>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs text-ink/50">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-hairline bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ink"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs text-ink/50">
                <IdCard size={13} /> Matric / Identifier
              </label>
              <input
                type="text"
                value={identifier}
                disabled
                className="w-full rounded-lg border border-hairline bg-hairline/20 px-3 py-2 text-sm text-ink/70"
              />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs text-ink/50">
                <Building2 size={13} /> Department
              </label>
              <input
                type="text"
                value={department || "—"}
                disabled
                className="w-full rounded-lg border border-hairline bg-hairline/20 px-3 py-2 text-sm text-ink/70"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs text-ink/50">
              <Mail size={13} /> Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full rounded-lg border border-hairline bg-hairline/20 px-3 py-2 text-sm text-ink/70"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex w-fit items-center gap-2 rounded-lg bg-ink px-5 py-2 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? "Saving…" : "Save changes"}
          </button>
          {message && <p className="text-xs text-ink/60">{message}</p>}
        </form>
        <p className="mt-4 text-xs text-ink/40">
          Matric number, department, and email are set by the institution and can't be edited here.
        </p>
      </div>
    </div>
  );
}