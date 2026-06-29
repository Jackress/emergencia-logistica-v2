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

// ─── FIX: Leaflet icon URLs broken by Vite's asset pipeline ──────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── Categoria config ─────────────────────────────────────────────────────────
const CATEGORIAS_CONFIG = {
  INCENDIO:         { emoji: "🔥", color: "#FF4500", label: "Incendio" },
  DERRUMBE:         { emoji: "⛰️", color: "#8B4513", label: "Derrumbe" },
  MAQUINARIA:       { emoji: "🚜", color: "#FFD700", label: "Maquinaria trabajando" },
  FALTA_MAQUINARIA: { emoji: "⚠️", color: "#B8860B", label: "Falta de maquinaria" },
  INSUMOS:          { emoji: "📦", color: "#4682B4", label: "Falta de insumos" },
  ACOPIO:           { emoji: "🏢", color: "#32CD32", label: "Centro de acopio" },
  PERSONAL:         { emoji: "👥", color: "#800080", label: "Falta de personal" },
  TAPIADA:          { emoji: "🆘", color: "#FF0000", label: "Persona tapiada viva" },
  SAQUEO:           { emoji: "🏃", color: "#222222", label: "Personas saqueando" },
};

// ─── SVG pin icon factory ─────────────────────────────────────────────────────
function crearIcono(categoria) {
  const cat = CATEGORIAS_CONFIG[categoria] ?? { emoji: "📍", color: "#757575" };
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="42" viewBox="0 0 36 42">
      <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 24 18 24S36 31.5 36 18C36 8.06 27.94 0 18 0z" fill="${cat.color}"/>
      <circle cx="18" cy="17" r="12" fill="white" opacity="0.92"/>
      <text x="18" y="22" text-anchor="middle" font-size="14">${cat.emoji}</text>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [36, 42],
    iconAnchor: [18, 42],
    popupAnchor: [0, -44],
  });
}

// ─── Sub-component: auto-locate on mount ─────────────────────────────────────
function AutoLocate({ onLocate }) {
  const map = useMap();

  useEffect(() => {
    function handleFound(e) {
      onLocate(e.latlng);
      L.circleMarker(e.latlng, {
        radius: 9,
        color: "#1565C0",
        fillColor: "#42A5F5",
        fillOpacity: 0.55,
        weight: 2,
      }).addTo(map);
    }

    map.on("locationfound", handleFound);
    map.locate({ setView: true, maxZoom: 16 });

    return () => map.off("locationfound", handleFound);
  }, [map, onLocate]);

  return null;
}

// ─── Sub-component: capture map clicks in report mode ────────────────────────
function MapClickHandler({ modoReportar, onMapClick }) {
  useMapEvents({
    click(e) {
      if (modoReportar) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
}

// ─── Sub-component: imperative map handle forwarded from parent ───────────────
function MapHandleRef({ mapRef }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

// ─── Inline styles (avoids external CSS dependency) ──────────────────────────
const styles = {
  root: {
    position: "relative",
    height: "100vh",
    width: "100%",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  controls: {
    position: "absolute",
    top: 15,
    // Right-aligned so it does NOT collide with Leaflet's zoom (+/−) on the left
    right: 15,
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  ctrlBtn: (active) => ({
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
    background: active ? "#D32F2F" : "#E65100",
    color: "white",
    transition: "background 0.2s",
  }),
  gpsBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
    background: "#1565C0",
    color: "white",
  },
  crosshairOverlay: {
    position: "absolute",
    inset: 0,
    zIndex: 500,
    cursor: "crosshair",
    pointerEvents: "none", // clicks pass through to the map
  },
  modeLabel: {
    position: "absolute",
    top: 70,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 1000,
    background: "#D32F2F",
    color: "white",
    padding: "6px 18px",
    borderRadius: 20,
    fontWeight: 700,
    fontSize: 13,
    pointerEvents: "none",
    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
  },
  panel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1100,
    background: "white",
    padding: "20px 20px 32px",
    borderRadius: "20px 20px 0 0",
    boxShadow: "0 -4px 24px rgba(0,0,0,0.18)",
  },
  panelTitle: {
    margin: "0 0 16px",
    fontSize: 16,
    fontWeight: 700,
    color: "#1a1a1a",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  input: {
    padding: "9px 12px",
    borderRadius: 8,
    border: "1.5px solid #ddd",
    fontSize: 14,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  select: {
    padding: "9px 12px",
    borderRadius: 8,
    border: "1.5px solid #ddd",
    fontSize: 14,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    background: "white",
  },
  panelActions: {
    display: "flex",
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    padding: "11px",
    borderRadius: 10,
    border: "1.5px solid #ccc",
    background: "white",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },
  popup: {
    minWidth: 180,
  },
  popupTitle: {
    margin: "0 0 4px",
    fontSize: 14,
    fontWeight: 700,
  },
  popupDesc: {
    margin: "0 0 10px",
    fontSize: 13,
    color: "#444",
  },
  popupNav: {
    display: "block",
    background: "#1565C0",
    color: "white",
    padding: "7px 0",
    textAlign: "center",
    borderRadius: 7,
    textDecoration: "none",
    fontWeight: 600,
    fontSize: 13,
  },
};

// ─── Estado inicial del formulario de reporte ─────────────────────────────────
const FORM_INIT = {
  titulo: "",
  ciudad: "",
  descripcion: "",
  categoria: "INCENDIO",
};

// ─── Componente principal ─────────────────────────────────────────────────────
export default function MapaScreen({ ciudadUsuario }) {
  const mapRef = useRef(null);
  const [modoReportar, setModoReportar] = useState(false);
  const [latlngClick, setLatlngClick] = useState(null);
  const [form, setForm] = useState(FORM_INIT);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [userLatlng, setUserLatlng] = useState(null);

  const ciudad = ciudadUsuario || "Valencia";
  const { data: alertas = [], refetch } = useAlertas(ciudad);

  // Centrar en ubicación del usuario manualmente
  const irAMiUbicacion = useCallback(() => {
    if (!mapRef.current) return;
    if (userLatlng) {
      mapRef.current.flyTo(userLatlng, 16, { duration: 1.2 });
    } else {
      mapRef.current.locate({ setView: true, maxZoom: 16 });
    }
  }, [userLatlng]);

  const handleMapClick = useCallback((latlng) => {
    setLatlngClick(latlng);
    setForm({ ...FORM_INIT, ciudad });
    setError(null);
  }, [ciudad]);

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleReportar = async () => {
    if (!form.titulo.trim()) {
      setError("El título es obligatorio.");
      return;
    }
    if (!form.ciudad.trim()) {
      setError("La ciudad es obligatoria.");
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      await reportarAlerta({
        titulo: form.titulo.trim(),
        ciudad: form.ciudad.trim(),
        descripcion: form.descripcion.trim(),
        categoria: form.categoria,
        lat: latlngClick.lat,
        lng: latlngClick.lng,
      });
      setLatlngClick(null);
      setForm(FORM_INIT);
      refetch();
    } catch (err) {
      setError("No se pudo guardar el reporte. Intenta de nuevo.");
      console.error("reportarAlerta error:", err);
    } finally {
      setEnviando(false);
    }
  };

  const cancelarPanel = () => {
    setLatlngClick(null);
    setForm(FORM_INIT);
    setError(null);
  };

  return (
    <div style={styles.root}>
      {/* ── Cursor crosshair overlay cuando modo reporte está activo ── */}
      {modoReportar && <div style={styles.crosshairOverlay} />}

      {/* ── Etiqueta de modo activo ── */}
      {modoReportar && (
        <div style={styles.modeLabel}>🎯 Toca el mapa para ubicar el reporte</div>
      )}

      {/* ── Controles flotantes (derecha, sobre zoom leaflet) ── */}
      <div style={styles.controls}>
        <button style={styles.gpsBtn} onClick={irAMiUbicacion} title="Mi ubicación">
          📍 Mi ubicación
        </button>
        <button
          style={styles.ctrlBtn(modoReportar)}
          onClick={() => setModoReportar((v) => !v)}
          title={modoReportar ? "Cancelar reporte" : "Agregar reporte"}
        >
          {modoReportar ? "✖ Cancelar" : "➕ Reportar"}
        </button>
      </div>

      {/* ── Mapa ── */}
      <MapContainer
        center={[10.1622, -67.9897]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Inyecta referencia imperativa del mapa al ref del padre */}
        <MapHandleRef mapRef={mapRef} />

        {/* Auto-locate al montar */}
        <AutoLocate onLocate={setUserLatlng} />

        {/* Captura clicks en modo reporte */}
        <MapClickHandler
          modoReportar={modoReportar}
          onMapClick={(latlng) => {
            setModoReportar(false);
            handleMapClick(latlng);
          }}
        />

        {/* Marcadores de alertas */}
        {alertas.map((a) => (
          <Marker
            key={a.id}
            position={[a.lat, a.lng]}
            icon={crearIcono(a.categoria)}
          >
            <Popup>
              <div style={styles.popup}>
                <p style={styles.popupTitle}>
                  {CATEGORIAS_CONFIG[a.categoria]?.emoji ?? "📍"}{" "}
                  {a.titulo}
                </p>
                {a.descripcion && (
                  <p style={styles.popupDesc}>{a.descripcion}</p>
                )}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${a.lat},${a.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.popupNav}
                >
                  🚗 Cómo llegar
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* ── Panel inferior de reporte ── */}
      {latlngClick && (
        <div style={styles.panel}>
          <p style={styles.panelTitle}>
            📌 Nuevo reporte —{" "}
            <span style={{ fontWeight: 400, fontSize: 13, color: "#666" }}>
              {latlngClick.lat.toFixed(5)}, {latlngClick.lng.toFixed(5)}
            </span>
          </p>

          {error && (
            <Alert
              style={{ marginBottom: 12 }}
              message={error}
              type="error"
            />
          )}

          {/* Título */}
          <div style={styles.field}>
            <label style={styles.label} htmlFor="rp-titulo">Título *</label>
            <input
              id="rp-titulo"
              name="titulo"
              style={styles.input}
              placeholder="Ej. Incendio en edificio central"
              value={form.titulo}
              onChange={handleFormChange}
            />
          </div>

          {/* Ciudad */}
          <div style={styles.field}>
            <label style={styles.label} htmlFor="rp-ciudad">Ciudad *</label>
            <input
              id="rp-ciudad"
              name="ciudad"
              style={styles.input}
              placeholder="Ej. Valencia"
              value={form.ciudad}
              onChange={handleFormChange}
            />
          </div>

          {/* Descripción */}
          <div style={styles.field}>
            <label style={styles.label} htmlFor="rp-descripcion">Descripción</label>
            <input
              id="rp-descripcion"
              name="descripcion"
              style={styles.input}
              placeholder="Detalles adicionales (opcional)"
              value={form.descripcion}
              onChange={handleFormChange}
            />
          </div>

          {/* Categoría */}
          <div style={styles.field}>
            <label style={styles.label} htmlFor="rp-categoria">Categoría</label>
            <select
              id="rp-categoria"
              name="categoria"
              style={styles.select}
              value={form.categoria}
              onChange={handleFormChange}
            >
              {Object.entries(CATEGORIAS_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.emoji} {cfg.label}
                </option>
              ))}
            </select>
          </div>

          {/* Acciones */}
          <div style={styles.panelActions}>
            <button style={styles.cancelBtn} onClick={cancelarPanel} disabled={enviando}>
              Cancelar
            </button>
            <Btn
              onClick={handleReportar}
              disabled={enviando}
              style={{ flex: 2 }}
            >
              {enviando ? "Guardando…" : "✓ Confirmar reporte"}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
