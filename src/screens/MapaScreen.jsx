import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAlertas, reportarAlerta } from "../hooks/useData.js";
import { Btn, Alert } from "../components/UI.jsx";

// FIX: Íconos de Leaflet para Vite
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
    map.on("locationfound", (e) => {
      L.circleMarker(e.latlng, { radius: 8, color: 'blue', fillColor: '#3388ff', fillOpacity: 0.5 }).addTo(map);
    });
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
  const [modoReportar, setModoReportar] = useState(false);
  const [latlngClick, setLatlngClick] = useState(null);
  const { data: alertas, refetch } = useAlertas(ciudadUsuario || "Valencia");

  function MapClickHandler() {
    useMapEvents({ click: (e) => { if (modoReportar) { setLatlngClick(e.latlng); setModoReportar(false); } } });
    return null;
  }

  return (
    <div style={{ position: "relative", height: "100vh" }}>
      {/* Controles */}
      <div style={{ position: "absolute", top: 15, left: 15, zIndex: 1000, display: "flex", gap: 10 }}>
        <button onClick={() => mapRef.current?.locate()} style={{ padding: "10px", borderRadius: 8, border: "none", boxShadow: "0 2px 5px rgba(0,0,0,0.3)" }}>📍</button>
        <button onClick={() => setModoReportar(!modoReportar)} style={{ padding: "10px", borderRadius: 8, border: "none", background: modoReportar ? "red" : "orange", color: "white" }}>➕ Reportar</button>
      </div>

      <MapContainer center={[10.1622, -67.9897]} zoom={13} style={{ height: "100%", width: "100%" }} ref={mapRef}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <AutoLocate />
        <MapClickHandler />
        {alertas.map(a => (
          <Marker key={a.id} position={[a.lat, a.lng]} icon={crearIcono(a.categoria)}>
            <Popup>
              <strong>{a.titulo}</strong><p>{a.descripcion}</p>
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${a.lat},${a.lng}`} target="_blank" rel="noopener noreferrer" style={{ display: "block", background: "blue", color: "white", padding: 5, textAlign: "center", borderRadius: 5 }}>🚗 Cómo llegar</a>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {latlngClick && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 1100, background: "white", padding: 20, borderRadius: "20px 20px 0 0" }}>
          <h4>Reportar en: {latlngClick.lat.toFixed(4)}, {latlngClick.lng.toFixed(4)}</h4>
          <Btn onClick={() => { /* Lógica de reportarAlerta */ setLatlngClick(null); refetch(); }}>Confirmar Reporte</Btn>
          <button onClick={() => setLatlngClick(null)} style={{ marginLeft: 10 }}>Cancelar</button>
        </div>
      )}
    </div>
  );
}
