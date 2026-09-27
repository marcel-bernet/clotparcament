"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { isConfigured, supabase } from "@/lib/supabase";
import Login from "./Login";
import ParkingButtons from "./ParkingButtons";
import Recommendations from "./Recommendations";
import Invites from "./Invites";
import Header from "./Header";
import { ClotScene } from "./icons";

type Membership = { group_id: string; role: "member" | "admin" } | null;

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<Membership | "loading">("loading");
  // Increased after every saved event, so the recommendations reload.
  const [refreshKey, setRefreshKey] = useState(0);
  const [peopleOpen, setPeopleOpen] = useState(false);

  // Keep track of whether the user is logged in (also picks up the Google login when returning to the app).
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Logged in → is this user an active member of a group?
  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;
    setMembership("loading");
    supabase
      .from("group_members")
      .select("group_id, role")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setMembership(data as Membership));
  }, [userId]);

  if (!isConfigured) {
    return <main><p className="error">Falta la configuració de Supabase.</p></main>;
  }
  if (loading) {
    return <main><p className="muted">Carregant…</p></main>;
  }
  if (!session) {
    return <Login />;
  }

  const isAdmin = membership !== "loading" && membership?.role === "admin";

  return (
    <main>
      <Header onPeople={isAdmin ? () => setPeopleOpen((o) => !o) : undefined} peopleOpen={peopleOpen} />

      {membership === "loading" && <p className="muted">Carregant…</p>}

      {membership === null && (
        <p className="error">
          Has entrat com a {session.user.email}, però no formes part del grup.
          Demana una invitació a l'administrador.
        </p>
      )}

      {membership && membership !== "loading" && (
        <>
          {isAdmin && peopleOpen && <Invites groupId={membership.group_id} />}
          <section className="hero">
            <h1>Entre tots trobem més llocs</h1>
            <p>Comparteix on aparques o on no has trobat lloc, i ajuda la resta del veïnat.</p>
            <ClotScene />
          </section>
          <ParkingButtons groupId={membership.group_id} onSaved={() => setRefreshKey((k) => k + 1)} />
          <Recommendations groupId={membership.group_id} refreshKey={refreshKey} />
        </>
      )}

      <footer>
        <span className="muted">{session.user.email}</span>
        <button className="link" onClick={() => supabase.auth.signOut()}>
          Surt
        </button>
      </footer>
    </main>
  );
}
