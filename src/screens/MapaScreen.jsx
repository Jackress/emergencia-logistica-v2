import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CATEGORIAS, CIUDAD_COORDS, C } from "../lib/constants.js";
import { useAlertas, reportarAlerta } from "../hooks/useData.js";
import { Btn, Alert } from "../components/UI.jsx";

// ─── FIX: Leaflet iconos ──────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const CATEGORIAS_CONFIG = {
  INCENDIO: { emoji: "🔥", color: "#FF4500", label: "Incendio" },
  DERRUMBE: { emoji: "⛰️", color: "#8B4513", label: "Derrumbe" },
  MAQUINARIA: { emoji: "🚜", color: "#FFD700", label: "Maquinaria trabajando" },
  FALTA_MAQUINARIA: { emoji: "⚠️", color: "#B8860B", label: "Falta de maquinaria" },
  INSUMOS: { emoji: "📦", color: "#4682B4", label: "Falta de insumos" },
  ACOPIO: { emoji: "🏢", color: "#32CD32", label: "Centro de acopio" },
  PERSONAL: { emoji: "👥", color: "#800080", label: "Falta de personal" },
  TAPIADA: { emoji: "🆘", color: "#FF0000", label: "Persona tapiada viva" },
  SAQUEO: { emoji: "🏃", color: "#000000", label: "Personas saqueando" }
};

function LocationMarker() {
  const map = useMap();
  useEffect(() => {
    map.on("locationfound", (e) => { map.flyTo(e.latlng, 16); });
  }, [map]);
  return null;
}

function crearIcono(categoria) {
  const cat = CATEGORIAS_CONFIG[categoria] || { emoji: "📍", color: "#757575" };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="42" viewBox="0 0 36 42"><path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 24 18 24S36 31.5 36 18C36 8.06 27.94 0 18 0z" fill="${cat.color}"/><circle cx="18" cy="17" r="12" fill="white" opacity="0.92"/><text x="18" y="22" text-anchor="middle" font-size="14">${cat.emoji}</text></svg>`;
  return L.divIcon({ html: svg, className: "", iconSize: [36, 42], iconAnchor: [18, 42], popupAnchor: [0, -44] });
}

function MapController({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, 13, { duration: 1.2 }); }, [center, map]);
  return null;
}

function ClickCapturar({ activo, onClic }) {
  const map = useMap();
  useEffect(() => {
    if (!activo) return;
    const handler = (e) => onClic(e.latlng);
    map.on("click", handler);
    map.getContainer().style.cursor = "crosshair";
    return () => { map.off("click", handler); map.getContainer().style.cursor = ""; };
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
    if (!titulo.trim() || !ciudad.trim()) { setError("Título y ciudad obligatorios."); return; }
    setBusy(true);
    try {
      await reportarAlerta({ lat: latlng.lat, lng: latlng.lng, categoria, titulo, descripcion, ciudadEstado: ciudad });
      onExito();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  const fieldStyle = { width: "100%", padding: "8px", borderRadius: 8, border: "1.5px solid #ccc", marginTop: 5 };

  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#fff", padding: 20, zIndex: 1100, borderRadius: "20px 20px 0 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}><strong>Nueva Alerta</strong><button onClick={onCerrar}>×</button></div>
      <select onChange={e => setCategoria(e.target.value)} style={fieldStyle}>
        {Object.entries(CATEGORIAS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
      </select>
      <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título" style={fieldStyle} />
      <input value={ciudad} onChange={e => setCiudad(e.target.value)} placeholder="Ciudad" style={fieldStyle} />
      <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción" style={{ ...fieldStyle, height: 60 }} />
      <Btn onClick={enviar} disabled={busy} style={{ width: "100%", marginTop: 10 }}>{busy ? "Enviando..." : "Publicar"}</Btn>
    </div>
  );
}

export default function MapaScreen({ ciudadUsuario }) {
  const ciudadInicial = ciudadUsuario || "Valencia, Carabobo";
  const [ciudadFiltro, setCiudadFiltro] = useState(ciudadInicial);
  const [modoReportar, setModoReportar] = useState(false);
  const [latlngClick, setLatlngClick] = useState(null);
  const [filtro, setFiltro] = useState(null);
  const mapRef = useRef(null);
  const { data: alertas, refetch } = useAlertas(ciudadFiltro);

  return (
    <div style={{ position: "relative", height: "calc(100vh - 110px)" }}>
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1000, display: "flex", gap: 5 }}>
        <input value={ciudadFiltro} onChange={e => setCiudadFiltro(e.target.value)} style={{ padding: 8 }} />
        <button onClick={() => mapRef.current?.locate()}>📍</button>
        <button onClick={() => setModoReportar(!modoReportar)} style={{ background: modoReportar ? "red" : "orange", color: "white" }}>➕</button>
      </div>

      <MapContainer center={[10.1622, -67.9897]} zoom={13} style={{ height: "100%", width: "100%" }} ref={mapRef}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <LocationMarker />
        <ClickCapturar activo={modoReportar} onClic={setLatlngClick} />
        {alertas.filter(a => !filtro || a.categoria === filtro).map(a => <Marker key={a.id} position={[a.lat, a.lng]} icon={crearIcono(a.categoria)} />)}
      </MapContainer>

      {latlngClick && <PanelReportar latlng={latlngClick} onCerrar={() => setLatlngClick(null)} onExito={() => { setLatlngClick(null); refetch(); }} />}
    </div>
  );
}
