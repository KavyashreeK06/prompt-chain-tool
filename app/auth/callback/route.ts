import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && user) {
      const { data: profile } = await supabase.from("profiles").select("is_superadmin, is_matrix_admin").eq("id", user.id).single();
      if (profile?.is_superadmin || profile?.is_matrix_admin) {
        return NextResponse.redirect(`${origin}/`);
      } else {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=unauthorized`);
      }
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
