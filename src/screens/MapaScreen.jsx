import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { C } from "../lib/constants.js";
import { useAlertas, reportarAlerta } from "../hooks/useData.js";
import { Btn, Alert } from "../components/UI.jsx";

// Corrección de íconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Componente para auto-localizar al usuario
function AutoLocate() {
  const map = useMap();
  useEffect(() => {
    map.locate({ setView: true, maxZoom: 16 });
    map.on("locationfound", (e) => {
      L.marker(e.latlng).addTo(map).bindPopup("¡Estás aquí!").openPopup();
    });
  }, [map]);
  return null;
}

export default function MapaScreen() {
  const mapRef = useRef(null);
  const [latlngClick, setLatlngClick] = useState(null);
  const [modoReportar, setModoReportar] = useState(false);

  // Componente interno para capturar el click preciso
  function MapClickHandler() {
    useMapEvents({
      click: (e) => {
        if (modoReportar) setLatlngClick(e.latlng);
      },
    });
    return latlngClick ? <Marker position={latlngClick} /> : null;
  }

  return (
    <div style={{ position: "relative", height: "100vh", width: "100%" }}>
      {/* Controles superiores - Ajustados para no solaparse */}
      <div style={{ position: "absolute", top: "70px", left: "10px", zIndex: 1000, display: "flex", gap: "10px" }}>
        <button onClick={() => mapRef.current?.locate()} style={{ padding: "10px", borderRadius: "8px" }}>📍 Ir a mi ubicación</button>
        <button 
          onClick={() => setModoReportar(!modoReportar)} 
          style={{ padding: "10px", borderRadius: "8px", background: modoReportar ? "red" : "orange", color: "white" }}
        >
          {modoReportar ? "Cancelando..." : "➕ Reportar aquí"}
        </button>
      </div>

      <MapContainer 
        center={[10.1622, -67.9897]} 
        zoom={13} 
        style={{ height: "100%", width: "100%" }} 
        ref={mapRef}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <AutoLocate />
        <MapClickHandler />
      </MapContainer>
    </div>
  );
}
