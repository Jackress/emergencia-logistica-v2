import { useState } from "react";
import { C, CIUDADES } from "../lib/constants.js";
import { publicarOferta } from "../hooks/useData.js";
import { Btn, Card, Input, Textarea, Alert } from "../components/UI.jsx";

const TIPOS = [
  { value: "BUSCO_MAQUINARIA", label: "🚛 Busco Maquinaria / Camiones" },
  { value: "BUSCO_OBREROS",    label: "👷 Busco Obreros / Personal" },
  { value: "OFREZCO_TRABAJO",  label: "💼 Ofrezco Trabajo / Empleo" },
];

export default function PublicarScreen({ onPublicado }) {
  const [tipo,     setTipo]     = useState("BUSCO_OBREROS");
  const [desc,     setDesc]     = useState("");
  const [pago,     setPago]     = useState("");
  const [ciudad,   setCiudad]   = useState("");
  const [urgente,  setUrgente]  = useState(false);
  const [personas, setPersonas] = useState("");
  const [status,   setStatus]   = useState(null); // null | "ok" | "error"
  const [msg,      setMsg]      = useState("");
  const [busy,     setBusy]     = useState(false);

  async function publicar() {
    if (!desc.trim() || !pago.trim() || !ciudad.trim()) {
      setStatus("error"); setMsg("Completa todos los campos obligatorios."); return;
    }
    setBusy(true); setStatus(null);
    try {
      await publicarOferta({
        tipoSolicitud: tipo,
        descripcion: desc,
        pagoOfrecido: pago,
        ciudadEstado: ciudad,
        urgente,
        personasRequeridas: personas || undefined,
      });
      setStatus("ok");
      setMsg("¡Publicado exitosamente! Ya es visible para todos.");
      setTimeout(() => onPublicado(), 2200);
    } catch (e) {
      setStatus("error"); setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (status === "ok") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "65vh", gap: 14, padding: 20 }}>
        <div style={{ fontSize: 70 }}>✅</div>
        <div style={{ fontWeight: 900, fontSize: 21, color: C.verde }}>¡Publicado!</div>
        <div style={{ fontSize: 14, color: C.gris, textAlign: "center" }}>Tu anuncio ya es visible en la plataforma.</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 4 }}>➕ Nueva Publicación</div>
      <div style={{ fontSize: 13, color: C.gris, marginBottom: 18 }}>
        Visible en segundos · Contacto directo por WhatsApp
      </div>

      {status === "error" && <Alert type="error" message={msg} />}

      <Card>
        <Input
          label="¿Qué necesitas publicar?"
          value={tipo} onChange={setTipo}
          options={TIPOS}
          required
        />

        <Textarea
          label="Descripción detallada"
          value={desc} onChange={setDesc}
          placeholder="Describe exactamente qué necesitas, cuánto tiempo, condiciones de trabajo..."
          required rows={4}
        />

        <Input
          label="Pago ofrecido"
          value={pago} onChange={setPago}
          placeholder='Ej: "$20 el día" o "A convenir"'
          required
        />

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.gris }}>
            Ciudad y Estado <span style={{ color: C.rojo }}>*</span>
          </label>
          <input
            value={ciudad}
            onChange={e => setCiudad(e.target.value)}
            list="ciudades-pub"
            placeholder="Valencia, Carabobo"
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 9,
              border: `1.5px solid ${C.grisBorde}`, fontSize: 14,
              outline: "none", background: "#fafafa", marginTop: 4,
              boxSizing: "border-box",
            }}
          />
          <datalist id="ciudades-pub">
            {CIUDADES.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>

        {tipo === "BUSCO_OBREROS" && (
          <Input
            label="Personas requeridas"
            value={personas} onChange={setPersonas}
            type="number" placeholder="Ej: 4" min="1"
          />
        )}

        {/* Urgente toggle */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 14px", borderRadius: 10,
          background: urgente ? `${C.rojo}12` : C.bg,
          border: `1.5px solid ${urgente ? C.rojo : C.grisBorde}`,
          marginBottom: 18, cursor: "pointer", transition: "all 0.2s",
        }} onClick={() => setUrgente(u => !u)}>
          <div style={{
            width: 42, height: 24, borderRadius: 12, position: "relative",
            background: urgente ? C.rojo : C.gris, transition: "background 0.2s",
          }}>
            <div style={{
              position: "absolute", top: 3, left: urgente ? 21 : 3,
              width: 18, height: 18, borderRadius: "50%", background: "#fff",
              transition: "left 0.2s",
            }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>🔴 Marcar como URGENTE</div>
            <div style={{ fontSize: 11, color: C.gris }}>Aparece destacado al inicio de las listas</div>
          </div>
        </div>

        <Btn onClick={publicar} disabled={busy} style={{ width: "100%", justifyContent: "center" }}>
          {busy ? "Publicando..." : "Publicar ahora →"}
        </Btn>
      </Card>
    </div>
  );
}
