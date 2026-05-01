import type React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MainApp from "@/components/MainApp";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, is_superadmin, is_matrix_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_superadmin && !profile?.is_matrix_admin) redirect("/login?error=unauthorized");

  const { data: flavors } = await supabase
    .from("humor_flavors")
    .select("*")
    .order("created_datetime_utc", { ascending: false });

  const { data: images } = await supabase
    .from("images")
    .select("id, url, image_description")
    .eq("is_common_use", true)
    .limit(20);

  return <MainApp profile={profile} initialFlavors={flavors ?? []} testImages={images ?? []} />;
}
