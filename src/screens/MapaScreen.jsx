import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CATEGORIAS, CIUDADES, CIUDAD_COORDS, C } from "../lib/constants.js";
import { useAlertas, reportarAlerta } from "../hooks/useData.js";
import { Badge, Btn, Spinner, Alert } from "../components/UI.jsx";

// ─── FIX: Leaflet pierde los íconos por defecto en Vite ──────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── SUBCOMPONENTE: GPS ──────────────────────────────────────
function LocationMarker() {
  const map = useMap();
  useEffect(() => {
    map.on("locationfound", (e) => {
      map.flyTo(e.latlng, 16);
    });
  }, [map]);
  return null;
}

// ─── ÍCONO SVG POR CATEGORÍA ──────────────────────────────────
function crearIcono(categoria) {
  const cat = CATEGORIAS[categoria] || { emoji: "📍", color: "#757575" };
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="42" viewBox="0 0 36 42">
      <filter id="shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
      </filter>
      <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 24 18 24S36 31.5 36 18C36 8.06 27.94 0 18 0z"
            fill="${cat.color}" filter="url(#shadow)"/>
      <circle cx="18" cy="17" r="12" fill="white" opacity="0.92"/>
      <text x="18" y="22" text-anchor="middle" font-size="14">${cat.emoji}</text>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize:   [36, 42],
    iconAnchor: [18, 42],
    popupAnchor:[0, -44],
  });
}

function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 13, { duration: 1.2 });
  }, [center, map]);
  return null;
}

function ClickCapturar({ activo, onClic }) {
  const map = useMap();
  useEffect(() => {
    if (!activo) return;
    const handler = (e) => onClic(e.latlng);
    map.on("click", handler);
    map.getContainer().style.cursor = "crosshair";
    return () => {
      map.off("click", handler);
      map.getContainer().style.cursor = "";
    };
  }, [activo, map, onClic]);
  return null;
}

function PanelReportar({ latlng, onCerrar, onExito }) {
  const [categoria, setCategoria] = useState("INCENDIO");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function enviar() {
    if (!titulo.trim() || !ciudad.trim()) { setError("Título y ciudad son obligatorios."); return; }
    setBusy(true); setError("");
    try {
      await reportarAlerta({ lat: latlng.lat, lng: latlng.lng, categoria, titulo, descripcion, ciudadEstado: ciudad });
      onExito();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  const fieldStyle = { width: "100%", padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${C.grisBorde}`, fontSize: 13, outline: "none", boxSizing: "border-box", marginTop: 3, background: "#fafafa" };

  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#fff", borderRadius: "18px 18px 0 0", padding: "20px 18px 28px", zIndex: 1100, boxShadow: "0 -6px 30px rgba(0,0,0,0.15)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ fontWeight:900, fontSize:17 }}>📍 Nueva Alerta</div>
        <button onClick={onCerrar} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:C.gris }}>×</button>
      </div>
      <div style={{ fontSize:12, color:C.gris, marginBottom:12 }}>📌 Coords: {latlng.lat.toFixed(5)}, {latlng.lng.toFixed(5)}</div>
      {error && <Alert type="error" message={error} />}
      <div style={{ marginBottom:10 }}><label style={{ fontSize:12, fontWeight:600, color:C.gris }}>Título *</label><input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ej: Incendio en galpón" style={fieldStyle} /></div>
      <div style={{ marginBottom:10 }}><label style={{ fontSize:12, fontWeight:600, color:C.gris }}>Descripción</label><textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2} style={{ ...fieldStyle, resize:"none" }} /></div>
      <div style={{ marginBottom:16 }}><label style={{ fontSize:12, fontWeight:600, color:C.gris }}>Ciudad *</label><input value={ciudad} onChange={e => setCiudad(e.target.value)} list="ciudades-mapa" style={fieldStyle} /></div>
      <Btn onClick={enviar} disabled={busy} style={{ width:"100%", justifyContent:"center" }}>{busy ? "Publicando..." : "Publicar alerta →"}</Btn>
    </div>
  );
}

function Leyenda({ filtroActivo, onToggle }) {
  const [expandido, setExpandido] = useState(false);
  return (
    <div style={{ position:"absolute", bottom:90, right:10, zIndex:1000, background:"#fff", borderRadius:12, boxShadow:"0 2px 12px rgba(0,0,0,0.15)", overflow:"hidden", minWidth:46 }}>
      <button onClick={() => setExpandido(e => !e)} style={{ width:"100%", padding:"10px 12px", border:"none", cursor:"pointer", background:"none", fontWeight:700, fontSize:12 }}>🗂️</button>
      {expandido && (
        <div style={{ padding:"4px 10px 10px" }}>
          {Object.entries(CATEGORIAS).map(([key, cat]) => (
            <button key={key} onClick={() => onToggle(key)} style={{ display:"flex", alignItems:"center", gap:7, width:"100%", padding:"5px 0", border:"none", cursor:"pointer", background:"none" }}>
              <div style={{ width:12, height:12, borderRadius:"50%", background:cat.color }}/>
              <span style={{ fontSize:11 }}>{cat.emoji} {cat.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
