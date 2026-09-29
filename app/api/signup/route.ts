import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// This uses the SECRET key — this file only ever runs on the server, never in the browser
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const { email, password, fullName, identifier, department } = await request.json();

  if (!email || !password || !fullName || !identifier) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  // Step 1: create the login
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Step 2: create the matching profile row.
  // role is hardcoded to "student" on purpose — this is the PUBLIC signup route, so it
  // must never be possible for a client to submit role: "lecturer" or role: "admin"
  // and have it accepted. Those accounts stay admin-created (see /api/create-student
  // for the admin-only version of this).
  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    id: authData.user.id,
    full_name: fullName,
    role: "student",
    identifier,
    department: department || "Undeclared",
  });

  if (profileError) {
    // Roll back the auth user so we don't leave an orphaned login with no profile
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, studentId: authData.user.id });
}
