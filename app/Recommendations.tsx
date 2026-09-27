"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SparkleIcon } from "./icons";

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

// Same thresholds as documented in README.md. The tone picks the colour.
function label(score: number): { text: string; tone: "good" | "mixed" | "low" } {
  if (score >= 0.6) return { text: "Bona opció", tone: "good" };
  if (score >= 0.35) return { text: "Resultats mixtos", tone: "mixed" };
  return { text: "Poc probable", tone: "low" };
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
    <section className="card">
      <div className="section-title">
        <h2>
          <SparkleIcon /> Millors opcions ara
        </h2>
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
        {items?.map((r, i) => {
          const l = label(r.score);
          return (
            <li key={`${r.latitude},${r.longitude}`}>
              <a href={mapsUrl(r.latitude, r.longitude)} target="_blank" rel="noopener noreferrer">
                <span className={`num ${l.tone}`}>{i + 1}</span>
                <span className="rec-body">
                  <strong>{l.text}</strong>
                  <span className="stats">
                    {plural(r.successes, "encert", "encerts")} · {plural(r.failures, "fallada", "fallades")}
                  </span>
                  <span className="why">{explanation(r)}</span>
                  <span className="maps">Obre a Google Maps</span>
                </span>
                <span className={`badge ${l.tone}`}>{Math.round(r.score * 100)}%</span>
                <span className="chevron" aria-hidden="true">›</span>
              </a>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
