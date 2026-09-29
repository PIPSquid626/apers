import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// This uses the SECRET key — this file only ever runs on the server, never in the browser
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const { email, password, fullName, identifier, department } = await request.json();

  // Step 1: create the login
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Step 2: create the matching profile row
  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    id: authData.user.id,
    full_name: fullName,
    role: "student",
    identifier,
    department,
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, studentId: authData.user.id });
}