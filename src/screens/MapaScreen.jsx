import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { C } from "../lib/constants.js";
import { useAlertas, reportarAlerta } from "../hooks/useData.js";
import { Btn, Alert } from "../components/UI.jsx";

// FIX: Íconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
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

function AutoLocate() {
  const map = useMap();
  useEffect(() => {
    map.locate({ setView: true, maxZoom: 16 });
  }, [map]);
  return null;
}

function crearIcono(categoria) {
  const cat = CATEGORIAS_CONFIG[categoria] || { emoji: "📍", color: "#757575" };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="42" viewBox="0 0 36 42"><path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 24 18 24S36 31.5 36 18C36 8.06 27.94 0 18 0z" fill="${cat.color}"/><circle cx="18" cy="17" r="12" fill="white" opacity="0.92"/><text x="18" y="22" text-anchor="middle" font-size="14">${cat.emoji}</text></svg>`;
  return L.divIcon({ html: svg, className: "", iconSize: [36, 42], iconAnchor: [18, 42], popupAnchor: [0, -44] });
}

export default function MapaScreen({ ciudadUsuario }) {
  const mapRef = useRef(null);
  const [ciudadFiltro, setCiudadFiltro] = useState(ciudadUsuario || "Valencia, Carabobo");
  const [modoReportar, setModoReportar] = useState(false);
  const [latlngClick, setLatlngClick] = useState(null);
  const { data: alertas, refetch } = useAlertas(ciudadFiltro);

  function MapClickHandler() {
    useMapEvents({ click: (e) => { if (modoReportar) setLatlngClick(e.latlng); } });
    return null;
  }

  return (
    <div style={{ position: "relative", height: "calc(100vh - 110px)" }}>
      {/* Barra superior */}
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1000, display: "flex", gap: 5, background: "white", padding: 5, borderRadius: 8 }}>
        <input value={ciudadFiltro} onChange={e => setCiudadFiltro(e.target.value)} style={{ padding: 8 }} />
        <button onClick={() => mapRef.current?.locate()}>📍</button>
        <button onClick={() => setModoReportar(!modoReportar)} style={{ background: modoReportar ? "red" : "orange", color: "white" }}>➕</button>
      </div>

      <MapContainer center={[10.1622, -67.9897]} zoom={13} style={{ height: "100%", width: "100%" }} ref={mapRef}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <AutoLocate />
        <MapClickHandler />
        {alertas.map(a => (
          <Marker key={a.id} position={[a.lat, a.lng]} icon={crearIcono(a.categoria)}>
            <Popup>
              <div>
                <strong>{a.titulo}</strong><br/>{a.descripcion}<br/>
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${a.lat},${a.lng}`} target="_blank" rel="noopener noreferrer">🚗 Cómo llegar</a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {latlngClick && (
        <div style={{ position: "absolute", bottom: 20, left: 20, right: 20, zIndex: 1100, background: "white", padding: 20, borderRadius: 10 }}>
          <h4>Nuevo Reporte en {latlngClick.lat.toFixed(4)}, {latlngClick.lng.toFixed(4)}</h4>
          <button onClick={() => { /* Lógica de reportarAlerta aquí */ setLatlngClick(null); setModoReportar(false); }}>Guardar Reporte</button>
          <button onClick={() => setLatlngClick(null)}>Cancelar</button>
        </div>
      )}
    </div>
  );
}
