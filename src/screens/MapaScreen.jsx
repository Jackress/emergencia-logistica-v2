import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAlertas } from "../hooks/useData.js"; // Asegúrate de tener este hook

// ... (El resto de funciones AutoLocate, crearIcono, etc., se mantienen igual que antes)

// Función para abrir Google Maps
function abrirNavegacion(lat, lng) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  window.open(url, "_blank");
}

export default function MapaScreen() {
  const mapRef = useRef(null);
  const [latlngClick, setLatlngClick] = useState(null);
  const [modoReportar, setModoReportar] = useState(false);
  const { data: alertas } = useAlertas(); // Asumiendo que trae lat, lng, titulo

  return (
    <div style={{ position: "relative", height: "100vh", width: "100%" }}>
      {/* ... (Botones de arriba igual que antes) ... */}

      <MapContainer center={[10.1622, -67.9897]} zoom={13} style={{ height: "100%", width: "100%" }} ref={mapRef}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {/* Marcadores de reportes existentes */}
        {alertas.map((alerta) => (
          <Marker key={alerta.id} position={[alerta.lat, alerta.lng]}>
            <Popup>
              <div>
                <strong>{alerta.titulo}</strong>
                <p>{alerta.descripcion}</p>
                <button 
                  onClick={() => abrirNavegacion(alerta.lat, alerta.lng)}
                  style={{ 
                    background: "#4285F4", 
                    color: "white", 
                    border: "none", 
                    padding: "8px", 
                    borderRadius: "5px", 
                    width: "100%",
                    cursor: "pointer"
                  }}
                >
                  🚗 Cómo llegar
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
