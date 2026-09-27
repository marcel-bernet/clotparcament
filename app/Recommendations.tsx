"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// One row returned by the SQL function recommend_parking (supabase/002_…sql).
type Recommendation = {
  latitude: number;
  longitude: number;
  successes: number;
  failures: number;
  similar_successes: number;
  similar_failures: number;
  score: number;
};

// Plain outbound Google Maps link. No API key needed.
function mapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

// Same thresholds as documented in README.md.
function label(score: number): string {
  if (score >= 0.6) return "Bona opció";
  if (score >= 0.35) return "Resultats mixtos";
  return "Poc probable";
}

// Weekday or weekend "right now", using the same 04:00 day boundary as the SQL.
function isWeekendNow(): boolean {
  const shifted = new Date(Date.now() - 4 * 60 * 60 * 1000);
  const day = shifted.getDay(); // 0 = Sunday, 6 = Saturday
  return day === 0 || day === 6;
}

function explanation(r: Recommendation): string {
  const when = isWeekendNow() ? "en cap de setmana" : "en dies laborables";
  if (r.similar_successes > 0) {
    let text = `${plural(r.similar_successes, "aparcament", "aparcaments")} del grup ${when} a una hora semblant`;
    if (r.similar_failures > 0) {
      text += `, ${plural(r.similar_failures, "cerca", "cerques")} sense lloc`;
    }
    return text + ".";
  }
  return "Cap aparcament a una hora semblant; es basa en l'historial general.";
}

export default function Recommendations({ groupId, refreshKey }: { groupId: string; refreshKey: number }) {
  const [items, setItems] = useState<Recommendation[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    const { data, error } = await supabase.rpc("recommend_parking", { p_group_id: groupId });
    if (error) {
      setError(true);
      return;
    }
    setItems(data as Recommendation[]);
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return (
    <section>
      <div className="section-title">
        <h2>On aparcar ara</h2>
        <button className="link" onClick={load}>Actualitza</button>
      </div>

      {error && <p className="error">No s'han pogut carregar les recomanacions. Comprova la connexió.</p>}
      {!error && items === null && <p className="muted">Carregant…</p>}
      {!error && items?.length === 0 && (
        <p className="muted">
          Encara no hi ha prou dades. Cada vegada que aparqueu o no trobeu lloc, premeu un botó i les
          recomanacions milloraran.
        </p>
      )}

      <ol className="recs">
        {items?.map((r, i) => (
          <li key={`${r.latitude},${r.longitude}`}>
            <a href={mapsUrl(r.latitude, r.longitude)} target="_blank" rel="noopener noreferrer">
              <strong>
                {i + 1}. {label(r.score)}
              </strong>
              <span>{explanation(r)}</span>
              <span className="muted">
                En total: {plural(r.successes, "aparcament", "aparcaments")},{" "}
                {plural(r.failures, "cerca", "cerques")} sense lloc.
              </span>
              <span className="maps">Obre a Google Maps ›</span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
