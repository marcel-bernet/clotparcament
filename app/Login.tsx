"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Login = one button: "Entra amb Google".
// Google proves who the person is. The database decides whether they may join:
// only emails an admin has invited can create an account
// (trigger only_invited_users in supabase/002_…sql).
export default function Login() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  // After Google, Supabase sends the user back here. If the account was refused
  // (email not invited), the reason is in the URL: show it in Catalan, then clean the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search + "&" + window.location.hash.slice(1));
    const description = params.get("error_description");
    if (!description) return;
    setMessage(
      description.includes("Database error")
        ? "Aquest compte de Google no està convidat. Demana a l'administrador que afegeixi el teu correu."
        : "No s'ha pogut entrar. Torna-ho a provar."
    );
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  async function signInWithGoogle() {
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + window.location.pathname,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      setBusy(false);
      setMessage("No s'ha pogut connectar amb Google. Comprova la connexió i torna-ho a provar.");
    }
    // On success the browser leaves for Google, so there is nothing else to do here.
  }

  return (
    <main>
      <h1>Clotparcament</h1>
      <p className="muted">On aparcar al Clot. Només per a membres convidats.</p>
      <button className="primary google" disabled={busy} onClick={signInWithGoogle}>
        {busy ? "Obrint Google…" : "Entra amb Google"}
      </button>
      {message && <p className="error">{message}</p>}
    </main>
  );
}
