"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { CarIcon, SearchIcon } from "./icons";

type Result = "success" | "fail";
type Status =
  | { kind: "idle" }
  | { kind: "busy"; text: string }
  | { kind: "saved"; result: Result; eventId: string; accuracy: number }
  | { kind: "error"; text: string };

// Ask the browser for the current GPS position (as a Promise).
function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("no-geolocation"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 30000,
    });
  });
}

// Catalan message for each geolocation error code.
function locationErrorText(err: unknown): string {
  const code = (err as GeolocationPositionError)?.code;
  if (code === 1) {
    return "No tenim permís per saber on ets. Activa la ubicació per a aquest web a la configuració del navegador i torna-ho a provar.";
  }
  if (code === 2) {
    return "No s'ha pogut obtenir la ubicació GPS. Comprova que la ubicació del mòbil està activada.";
  }
  if (code === 3) {
    return "La ubicació ha trigat massa. Torna-ho a provar.";
  }
  return "Aquest navegador no pot obtenir la ubicació.";
}

export default function ParkingButtons({ groupId, onSaved }: { groupId: string; onSaved: () => void }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const busy = status.kind === "busy";

  async function record(result: Result) {
    setStatus({ kind: "busy", text: "Buscant la teva ubicació…" });

    let position: GeolocationPosition;
    try {
      position = await getPosition();
    } catch (err) {
      setStatus({ kind: "error", text: locationErrorText(err) });
      return;
    }

    setStatus({ kind: "busy", text: "Desant…" });
    // user_id and occurred_at are filled in by the database (see supabase/001_schema.sql).
    const { data, error } = await supabase
      .from("parking_events")
      .insert({
        group_id: groupId,
        result,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      })
      .select("id")
      .single();

    if (error || !data) {
      setStatus({ kind: "error", text: "No s'ha pogut desar. Comprova la connexió a internet i torna-ho a provar." });
      return;
    }
    setStatus({ kind: "saved", result, eventId: data.id, accuracy: Math.round(position.coords.accuracy) });
    onSaved();
  }

  async function undo(eventId: string) {
    setStatus({ kind: "busy", text: "Desfent…" });
    const { error, count } = await supabase
      .from("parking_events")
      .delete({ count: "exact" })
      .eq("id", eventId);
    if (error || count === 0) {
      setStatus({ kind: "error", text: "No s'ha pogut desfer (només es pot fer durant els primers 15 minuts)." });
      return;
    }
    setStatus({ kind: "idle" });
    onSaved();
  }

  return (
    <section className="actions">
      <button className="pill big success" disabled={busy} onClick={() => record("success")}>
        <CarIcon />
        He aparcat aquí
      </button>
      <button className="pill big fail" disabled={busy} onClick={() => record("fail")}>
        <SearchIcon />
        No hi ha lloc
      </button>

      <div className="status" aria-live="polite">
        {status.kind === "busy" && <p className="muted">{status.text}</p>}
        {status.kind === "error" && <p className="error">{status.text}</p>}
        {status.kind === "saved" && (
          <p className="ok">
            ✅ {status.result === "success" ? "Aparcament desat." : "Cerca sense lloc desada."}{" "}
            {status.accuracy > 100 && (
              <span className="muted">(Ubicació poc precisa: ±{status.accuracy} m.) </span>
            )}
            <button className="link inline" onClick={() => undo(status.eventId)}>
              Desfés
            </button>
          </p>
        )}
      </div>
    </section>
  );
}
