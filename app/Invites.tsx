"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Invite = { email: string; created_at: string };

// Admin only. The database enforces this too (RLS on group_invites).
export default function Invites({ groupId }: { groupId: string }) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [justInvited, setJustInvited] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("group_invites")
      .select("email, created_at")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });
    setInvites(data ?? []);
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    setBusy(true);
    setMessage("");
    const { error } = await supabase.from("group_invites").insert({ group_id: groupId, email: clean });
    setBusy(false);
    if (error) {
      setMessage(error.code === "23505" ? "Aquest correu ja està convidat." : "No s'ha pogut afegir. Revisa el correu.");
      return;
    }
    setEmail("");
    setJustInvited(clean);
    load();
  }

  async function remove(target: string) {
    if (!window.confirm(`Segur que vols treure ${target} del grup?`)) return;
    const { error } = await supabase.from("group_invites").delete().eq("group_id", groupId).eq("email", target);
    if (error) {
      setMessage("No s'ha pogut treure.");
      return;
    }
    if (justInvited === target) setJustInvited("");
    load();
  }

  // Prefilled WhatsApp message with the app link. The admin picks the contact in WhatsApp.
  function whatsappUrl(target: string): string {
    const appUrl = window.location.origin + window.location.pathname;
    const text = `Hola! T'he convidat a Clotparcament 🚗\nObre ${appUrl} i entra amb el correu ${target}.`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  return (
    <details className="admin">
      <summary>Gestiona el grup</summary>

      <form onSubmit={invite}>
        <label htmlFor="invite-email">Convida algú (correu electrònic)</label>
        <input
          id="invite-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="primary" disabled={busy}>
          {busy ? "Afegint…" : "Convida"}
        </button>
      </form>

      {message && <p className="error">{message}</p>}

      {justInvited && (
        <p className="ok">
          ✅ {justInvited} ja pot entrar.{" "}
          <a href={whatsappUrl(justInvited)} target="_blank" rel="noopener noreferrer">
            Envia-li l'enllaç per WhatsApp ›
          </a>
        </p>
      )}

      <h3>Convidats</h3>
      {invites.length === 0 && <p className="muted">Encara no has convidat ningú.</p>}
      <ul className="invites">
        {invites.map((inv) => (
          <li key={inv.email}>
            <span>{inv.email}</span>
            <button className="link inline" onClick={() => remove(inv.email)}>
              Treu
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
