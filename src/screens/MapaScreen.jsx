import { useState, useEffect, useRef, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAlertas, reportarAlerta } from "../hooks/useData.js";
import { Btn, Alert } from "../components/UI.jsx";

// ─── FIX: Leaflet icon URLs ──────────────────────────────────────────────────
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
  SAQUEO: { emoji: "🏃", color: "#222222", label: "Personas saqueando" },
};

function crearIcono(categoria) {
  const cat = CATEGORIAS_CONFIG[categoria] ?? { emoji: "📍", color: "#757575" };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="42" viewBox="0 0 36 42"><path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 24 18 24S36 31.5 36 18C36 8.06 27.94 0 18 0z" fill="${cat.color}"/><circle cx="18" cy="17" r="12" fill="white" opacity="0.92"/><text x="18" y="22" text-anchor="middle" font-size="14">${cat.emoji}</text></svg>`;
  return L.divIcon({ html: svg, className: "", iconSize: [36, 42], iconAnchor: [18, 42], popupAnchor: [0, -44] });
}

export default function MapaScreen({ ciudadUsuario }) {
  const mapRef = useRef(null);
  const [modoReportar, setModoReportar] = useState(false);
  const [latlngClick, setLatlngClick] = useState(null);
  const [form, setForm] = useState({ titulo: "", ciudad: ciudadUsuario || "Valencia", descripcion: "", categoria: "INCENDIO" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  
  // PRUEBA: Cambia "" por ciudadUsuario para restaurar el filtro
  const { data: alertas = [], refetch } = useAlertas(""); 

  useEffect(() => {
    console.log("Alertas cargadas:", alertas);
  }, [alertas]);

  const handleReportar = async () => {
    if (!form.titulo.trim() || !latlngClick) return setError("Campos obligatorios.");
    setEnviando(true);
    try {
      await reportarAlerta({
        ...form,
        lat: latlngClick.lat,
        lng: latlngClick.lng,
        ciudad: form.ciudad
      });
      setLatlngClick(null);
      refetch();
    } catch (err) {
      setError("Error al guardar.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      <div style={{ position: "absolute", top: 15, right: 15, zIndex: 1000 }}>
        <button onClick={() => setModoReportar(!modoReportar)} style={{ padding: "10px", background: modoReportar ? "red" : "orange", color: "white", border: "none", borderRadius: 8 }}>
          {modoReportar ? "Cancelar" : "Reportar"}
        </button>
      </div>

      <MapContainer center={[10.1622, -67.9897]} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {/* Captura click */}
        <MapEventsComponent setLatlngClick={setLatlngClick} modoReportar={modoReportar} />

        {/* Marcadores */}
        {alertas.map((a) => (
          <Marker 
            key={a.id} 
            position={[Number(a.lat), Number(a.lng)]} 
            icon={crearIcono(a.categoria)}
          >
            <Popup>
              <div>
                <strong>{a.titulo}</strong>
                <p>{a.descripcion}</p>
                <a href={`https://www.google.com/maps?q=${a.lat},${a.lng}`} target="_blank" rel="noreferrer">Cómo llegar</a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

function MapEventsComponent({ setLatlngClick, modoReportar }) {
  useMapEvents({
    click(e) {
      if (modoReportar) setLatlngClick(e.latlng);
    }
  });
  return null;
}
