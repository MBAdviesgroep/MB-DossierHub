"use client";

import { useMemo, useState } from "react";
import {
  BRANDS,
  BASIS_VELDEN,
  documentenVoorBrand,
  veldZichtbaar,
  signaleringen,
} from "../lib/config";

const STAPPEN = ["Bedrijf", "Document", "Bedrijfsgegevens", "Intake", "Controle & genereren"];

const box = {
  background: "#fff",
  borderRadius: 12,
  padding: 24,
  boxShadow: "0 1px 3px rgba(0,0,0,.08)",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontSize: 15,
  boxSizing: "border-box",
  background: "#fff",
};

function Veld({ veld, waarde, onChange }) {
  const label = (
    <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
      {veld.label} {veld.verplicht && <span style={{ color: "#dc2626" }}>*</span>}
    </label>
  );
  if (veld.type === "select")
    return (
      <div>
        {label}
        <select style={inputStyle} value={waarde ?? ""} onChange={(e) => onChange(e.target.value)}>
          <option value="">— kies —</option>
          {veld.opties.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
    );
  if (veld.type === "boolean")
    return (
      <div>
        {label}
        <div style={{ display: "flex", gap: 16 }}>
          {["Ja", "Nee"].map((o) => (
            <label key={o} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15 }}>
              <input
                type="radio"
                checked={waarde === (o === "Ja")}
                onChange={() => onChange(o === "Ja")}
              />
              {o}
            </label>
          ))}
        </div>
      </div>
    );
  if (veld.type === "textarea")
    return (
      <div>
        {label}
        <textarea rows={4} style={inputStyle} value={waarde ?? ""} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  return (
    <div>
      {label}
      <input
        type={veld.type === "date" ? "date" : veld.type === "number" || veld.type === "currency" ? "number" : "text"}
        style={inputStyle}
        value={waarde ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default function Home() {
  const [stap, setStap] = useState(0);
  const [brandId, setBrandId] = useState(null);
  const [docId, setDocId] = useState(null);
  const [waarden, setWaarden] = useState({});
  const [kvkStatus, setKvkStatus] = useState(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);

  async function conceptSchrijven() {
    setAiStatus("bezig");
    try {
      const { inhoud, ...rest } = waarden;
      const r = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steekwoorden: inhoud, context: rest }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Schrijven mislukt");
      setWaarden((w) => ({ ...w, inhoud: data.tekst }));
      setAiStatus("ok");
    } catch (e) {
      setAiStatus("fout: " + e.message);
    }
  }

  const brand = BRANDS.find((b) => b.id === brandId);
  const documenten = brandId ? documentenVoorBrand(brandId) : [];
  const doc = documenten.find((d) => d.id === docId);

  const zet = (id, v) => setWaarden((w) => ({ ...w, [id]: v }));

  const zichtbareDocVelden = useMemo(
    () => (doc ? doc.velden.filter((v) => veldZichtbaar(v, waarden)) : []),
    [doc, waarden]
  );

  const ontbrekend = useMemo(() => {
    const alle = [...BASIS_VELDEN, ...zichtbareDocVelden].filter((v) => v.verplicht);
    return alle.filter((v) => {
      const w = waarden[v.id];
      return w === undefined || w === null || w === "";
    });
  }, [zichtbareDocVelden, waarden]);

  const meldingen = useMemo(() => signaleringen(waarden), [waarden]);

  async function haalKvkOp() {
    if (!waarden.kvk_nummer) return;
    setKvkStatus("bezig");
    try {
      const r = await fetch(`/api/kvk?nummer=${encodeURIComponent(waarden.kvk_nummer)}`);
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Ophalen mislukt");
      setWaarden((w) => ({
        ...w,
        handelsnaam: data.handelsnaam ?? w.handelsnaam,
        adres: data.adres ?? w.adres,
        postcode: data.postcode ?? w.postcode,
        plaats: data.plaats ?? w.plaats,
        sbi_omschrijving: data.sbi_omschrijving ?? w.sbi_omschrijving,
      }));
      setKvkStatus("ok");
    } catch (e) {
      setKvkStatus("fout: " + e.message);
    }
  }

  async function genereer() {
    setBezig(true);
    setFout(null);
    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, docId, waarden }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || "Genereren mislukt");
      }
      const blob = await r.blob();
      const naam = r.headers.get("X-Bestandsnaam") || "document.docx";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = naam;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setFout(e.message);
    } finally {
      setBezig(false);
    }
  }

  const accent = brand?.kleur ?? "#1d4ed8";

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 16px 64px" }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Dossiergenerator</h1>
      <p style={{ color: "#6b7280", marginTop: 0 }}>
        Rechtsvormwijzigingen & documentgeneratie — concept, altijd menselijke review vereist.
      </p>

      {/* Stappenbalk */}
      <div style={{ display: "flex", gap: 8, margin: "20px 0 24px", flexWrap: "wrap" }}>
        {STAPPEN.map((s, i) => (
          <div
            key={s}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              background: i === stap ? accent : i < stap ? "#d1fae5" : "#e5e7eb",
              color: i === stap ? "#fff" : "#374151",
            }}
          >
            {i + 1}. {s}
          </div>
        ))}
      </div>

      {/* Stap 1: bedrijf */}
      {stap === 0 && (
        <div style={box}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>Vanuit welk bedrijf werk je?</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {BRANDS.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setBrandId(b.id);
                  setDocId(null);
                  setStap(1);
                }}
                style={{
                  textAlign: "left",
                  padding: 18,
                  borderRadius: 10,
                  border: brandId === b.id ? `2px solid ${b.kleur}` : "1px solid #d1d5db",
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                <strong style={{ color: b.kleur }}>{b.naam}</strong>
                <div style={{ fontSize: 13, color: "#6b7280" }}>{b.plaats}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stap 2: document */}
      {stap === 1 && (
        <div style={box}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>Welk document heb je nodig?</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {documenten.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setDocId(d.id);
                  setStap(2);
                }}
                style={{
                  textAlign: "left",
                  padding: 18,
                  borderRadius: 10,
                  border: docId === d.id ? `2px solid ${accent}` : "1px solid #d1d5db",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                <strong>{d.naam}</strong>
                <div style={{ fontSize: 13, color: "#6b7280" }}>{d.omschrijving}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stap 3: bedrijfsgegevens + KvK */}
      {stap === 2 && (
        <div style={box}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>Bedrijfsgegevens</h2>
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <Veld veld={BASIS_VELDEN[0]} waarde={waarden.kvk_nummer} onChange={(v) => zet("kvk_nummer", v)} />
              </div>
              <button
                onClick={haalKvkOp}
                style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: accent, color: "#fff", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                Ophalen bij KvK
              </button>
            </div>
            {kvkStatus && (
              <div style={{ fontSize: 13, color: kvkStatus === "ok" ? "#059669" : kvkStatus === "bezig" ? "#6b7280" : "#dc2626" }}>
                {kvkStatus === "ok" ? "Gegevens opgehaald — controleer en bevestig hieronder." : kvkStatus === "bezig" ? "Bezig met ophalen…" : kvkStatus}
              </div>
            )}
            {BASIS_VELDEN.slice(1).map((v) => (
              <Veld key={v.id} veld={v} waarde={waarden[v.id]} onChange={(x) => zet(v.id, x)} />
            ))}
          </div>
        </div>
      )}

      {/* Stap 4: documentspecifieke intake */}
      {stap === 3 && doc && (
        <div style={box}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>{doc.naam} — intake</h2>
          <div style={{ display: "grid", gap: 16 }}>
            {zichtbareDocVelden.map((v) => (
              <div key={v.id}>
                <Veld veld={v} waarde={waarden[v.id]} onChange={(x) => zet(v.id, x)} />
                {v.id === "inhoud" && (
                  <div style={{ marginTop: 8 }}>
                    <button
                      onClick={conceptSchrijven}
                      disabled={aiStatus === "bezig"}
                      style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${accent}`, background: "#fff", color: accent, fontWeight: 600, cursor: "pointer", fontSize: 14 }}
                    >
                      {aiStatus === "bezig" ? "Bezig met schrijven…" : "✨ Concept laten schrijven (AI)"}
                    </button>
                    <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 10 }}>
                      Typ eerst steekwoorden in het veld; de AI maakt er een nette brieftekst van. Altijd zelf nalezen.
                    </span>
                    {aiStatus && aiStatus.startsWith("fout") && (
                      <div style={{ fontSize: 13, color: "#dc2626", marginTop: 6 }}>{aiStatus}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stap 5: controle & genereren */}
      {stap === 4 && doc && (
        <div style={box}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>Controle & genereren</h2>
          {ontbrekend.length > 0 ? (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 14, marginBottom: 16 }}>
              <strong style={{ color: "#b91c1c" }}>Ontbrekende verplichte velden:</strong>
              <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
                {ontbrekend.map((v) => (
                  <li key={v.id} style={{ fontSize: 14 }}>{v.label}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 14, marginBottom: 16, fontSize: 14, color: "#166534" }}>
              Alle verplichte velden zijn ingevuld.
            </div>
          )}

          {meldingen.length > 0 && (
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: 14, marginBottom: 16 }}>
              <strong style={{ color: "#92400e" }}>Signaleringen voor de behandelaar:</strong>
              <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
                {meldingen.map((m, i) => (
                  <li key={i} style={{ fontSize: 14 }}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse", marginBottom: 20 }}>
            <tbody>
              {[...BASIS_VELDEN, ...zichtbareDocVelden].map((v) => (
                <tr key={v.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "6px 8px", color: "#6b7280", width: "45%" }}>{v.label}</td>
                  <td style={{ padding: "6px 8px", fontWeight: 500 }}>
                    {waarden[v.id] === true ? "Ja" : waarden[v.id] === false ? "Nee" : waarden[v.id] || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {fout && <div style={{ color: "#dc2626", marginBottom: 12, fontSize: 14 }}>Fout: {fout}</div>}

          <button
            onClick={genereer}
            disabled={ontbrekend.length > 0 || bezig}
            style={{
              padding: "12px 24px",
              borderRadius: 8,
              border: "none",
              background: ontbrekend.length > 0 ? "#9ca3af" : accent,
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              cursor: ontbrekend.length > 0 ? "not-allowed" : "pointer",
            }}
          >
            {bezig ? "Bezig met genereren…" : "Genereer concept-document (.docx)"}
          </button>
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 12 }}>
            Het gegenereerde document is een concept en moet altijd inhoudelijk worden
            beoordeeld door de behandelaar voordat het extern wordt gebruikt.
          </p>
        </div>
      )}

      {/* Navigatie */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
        <button
          onClick={() => setStap((s) => Math.max(0, s - 1))}
          disabled={stap === 0}
          style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", cursor: stap === 0 ? "not-allowed" : "pointer" }}
        >
          ← Terug
        </button>
        {stap > 1 && stap < 4 && (
          <button
            onClick={() => setStap((s) => s + 1)}
            style={{ padding: "10px 18px", borderRadius: 8, border: "none", background: accent, color: "#fff", fontWeight: 600, cursor: "pointer" }}
          >
            Volgende →
          </button>
        )}
      </div>
    </main>
  );
}
