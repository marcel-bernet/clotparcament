"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

// Login in two steps:
// 1. The user types their email → Supabase emails them a link AND a 6-digit code.
// 2. They either tap the link, or type the code here.
// New accounts are only allowed for emails an admin has invited
// (enforced in the database: supabase/002_…sql, trigger only_invited_users).
export default function Login() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function sendEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location.origin + window.location.pathname,
      },
    });
    setBusy(false);
    if (error) {
      if (error.status === 429) {
        setMessage("Massa intents. Espera uns minuts i torna-ho a provar.");
      } else if (error.message.includes("Database error")) {
        // The database refused to create the account: email not invited.
        setMessage("Aquest correu no està convidat. Demana una invitació a l'administrador del grup.");
      } else {
        setMessage("No s'ha pogut enviar el correu. Comprova l'adreça i la connexió.");
      }
      return;
    }
    setSent(true);
  }

  async function checkCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    if (error) setMessage("El codi no és correcte o ha caducat.");
  }

  return (
    <main>
      <h1>Clotparcament</h1>
      {!sent ? (
        <form onSubmit={sendEmail}>
          <label htmlFor="email">El teu correu electrònic</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="primary" disabled={busy}>
            {busy ? "Enviant…" : "Envia'm l'accés"}
          </button>
        </form>
      ) : (
        <form onSubmit={checkCode}>
          <p>
            T'hem enviat un correu a <strong>{email}</strong>. Toca el botó del correu, o escriu
            aquí el codi:
          </p>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={10}
            placeholder="Codi"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button className="primary" disabled={busy}>
            {busy ? "Comprovant…" : "Entra"}
          </button>
          <button type="button" className="link" onClick={() => { setSent(false); setCode(""); }}>
            Canvia el correu
          </button>
        </form>
      )}
      {message && <p className="error">{message}</p>}
    </main>
  );
}
