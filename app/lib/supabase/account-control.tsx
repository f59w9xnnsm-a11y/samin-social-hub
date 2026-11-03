"use client";

import { useEffect, useState } from "react";
import { createClient } from "./client";
import { supabaseConfigured } from "./config";

export default function AccountControl() {
  const [email, setEmail] = useState("");
  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);
  if (!supabaseConfigured || !email) return null;
  return <button className="account-control" onClick={async () => { await createClient().auth.signOut(); window.location.assign("/login"); }} title={email} aria-label={`Abmelden: ${email}`}>Abmelden</button>;
}
