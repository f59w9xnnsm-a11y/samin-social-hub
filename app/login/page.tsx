"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/app/lib/supabase/client";
import { supabaseConfigured } from "@/app/lib/supabase/config";
import "./login.css";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("confirmation") === "failed") setMessage("Der Bestätigungslink war ungültig oder ist abgelaufen. Bitte melde dich erneut an oder fordere einen neuen Link an.");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const supabase = createClient();
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const next = new URLSearchParams(window.location.search).get("next") || "/";
        window.location.assign(next.startsWith("/") && !next.startsWith("//") ? next : "/");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback`, data: { workspace_name: "Samin Studio" } },
        });
        if (error) throw error;
        if (data.session) window.location.assign("/");
        else setMessage("Fast geschafft: Bitte bestätige deine E-Mail. Danach kannst du dich anmelden.");
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Das hat gerade nicht geklappt. Bitte versuche es erneut."); }
    finally { setBusy(false); }
  }

  return <main className="login-screen"><Link href="/" className="login-brand"><span>S</span><span><b>SAMIN</b><small>SOCIAL HUB</small></span></Link><section className="login-card"><span className="login-kicker">DEIN SOCIAL WORKSPACE</span><h1>{supabaseConfigured ? mode === "login" ? "Willkommen zurück" : "Workspace erstellen" : "Zentrale Ablage vorbereiten"}</h1><p>{supabaseConfigured ? mode === "login" ? "Melde dich an, um deine Inhalte geräteübergreifend zu verwalten." : "Mit deinem Konto erhältst du einen privaten Workspace für deine Inhalte." : "Die Anmeldung wird aktiv, sobald das Supabase-Projekt eingerichtet ist."}</p>
    {!supabaseConfigured ? <div className="setup-note"><b>Einrichtung steht noch aus</b><ol><li>Supabase-Projekt erstellen.</li><li>Die SQL-Migration aus <code>supabase/migrations</code> im SQL Editor ausführen.</li><li>Projekt-URL und Publishable Key in `.env.local` eintragen.</li><li>Die App mit `npm.cmd install` neu installieren und starten.</li></ol><small>Keine Schlüssel hier im Chat teilen. Der Service-Role-Key wird in der App nicht verwendet.</small></div> : <>
      <div className="login-tabs"><button className={mode === "login" ? "selected" : ""} onClick={() => { setMode("login"); setMessage(""); }}>Anmelden</button><button className={mode === "signup" ? "selected" : ""} onClick={() => { setMode("signup"); setMessage(""); }}>Konto erstellen</button></div>
      <form onSubmit={submit} className="login-form"><label>E-Mail-Adresse<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Passwort<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /><small>Mindestens 8 Zeichen</small></label><button type="submit" disabled={busy}>{busy ? "Einen Moment …" : mode === "login" ? "Anmelden" : "Konto erstellen"}</button></form>
      {message && <div className="login-message" role="status">{message}</div>}
      <small className="login-privacy">Deine Inhalte werden nach Anmeldung in deinem geschützten Workspace gespeichert.</small>
    </>}
    </section><footer className="login-footer">SAMIN SOCIAL HUB · PRIVATE WORKSPACE</footer></main>;
}
