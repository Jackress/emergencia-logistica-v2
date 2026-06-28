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

// ─── SUBCOMPONENTE: centrar mapa cuando cambia ciudad ─────────
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 13, { duration: 1.2 });
  }, [center, map]);
  return null;
}

// ─── SUBCOMPONENTE: capturar clic para reportar ───────────────
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

// ─── PANEL: REPORTAR NUEVA ALERTA ────────────────────────────
function PanelReportar({ latlng, onCerrar, onExito }) {
  const [categoria,   setCategoria]   = useState("INCENDIO");
  const [titulo,      setTitulo]      = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [ciudad,      setCiudad]      = useState("");
  const [busy,        setBusy]        = useState(false);
  const [error,       setError]       = useState("");

  async function enviar() {
    if (!titulo.trim() || !ciudad.trim()) {
      setError("Título y ciudad son obligatorios."); return;
    }
    setBusy(true); setError("");
    try {
      await reportarAlerta({
        lat: latlng.lat, lng: latlng.lng,
        categoria, titulo, descripcion,
        ciudadEstado: ciudad,
      });
      onExito();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  const fieldStyle = {
    width: "100%", padding: "8px 10px", borderRadius: 8,
    border: `1.5px solid ${C.grisBorde}`, fontSize: 13,
    outline: "none", boxSizing: "border-box", marginTop: 3,
    background: "#fafafa",
  };

  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      background: "#fff", borderRadius: "18px 18px 0 0",
      padding: "20px 18px 28px", zIndex: 1100,
      boxShadow: "0 -6px 30px rgba(0,0,0,0.15)",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ fontWeight:900, fontSize:17 }}>📍 Nueva Alerta</div>
        <button onClick={onCerrar} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:C.gris }}>×</button>
      </div>
      <div style={{ fontSize:12, color:C.gris, marginBottom:12 }}>
        📌 Coords: {latlng.lat.toFixed(5)}, {latlng.lng.toFixed(5)}
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Selector de categoría */}
      <div style={{ marginBottom:12 }}>
        <label style={{ fontSize:12, fontWeight:600, color:C.gris }}>Categoría</label>
        <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginTop:6 }}>
          {Object.entries(CATEGORIAS).map(([key, cat]) => (
            <button key={key} onClick={() => setCategoria(key)}
              style={{
                padding:"5px 10px", borderRadius:20, border:"none",
                cursor:"pointer", fontSize:12, fontWeight:700,
                background: categoria === key ? cat.color : C.grisClaro,
                color: categoria === key ? "#fff" : C.gris,
                transition: "all 0.15s",
              }}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom:10 }}>
        <label style={{ fontSize:12, fontWeight:600, color:C.gris }}>Título <span style={{color:C.rojo}}>*</span></label>
        <input value={titulo} onChange={e => setTitulo(e.target.value)}
          placeholder="Ej: Incendio en galpón norte" style={fieldStyle} />
      </div>
      <div style={{ marginBottom:10 }}>
        <label style={{ fontSize:12, fontWeight:600, color:C.gris }}>Descripción</label>
        <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
          placeholder="Detalles: qué se necesita, cuántos afectados..."
          rows={2} style={{ ...fieldStyle, resize:"none", fontFamily:"inherit", lineHeight:1.5 }} />
      </div>
      <div style={{ marginBottom:16 }}>
        <label style={{ fontSize:12, fontWeight:600, color:C.gris }}>Ciudad y Estado <span style={{color:C.rojo}}>*</span></label>
        <input value={ciudad} onChange={e => setCiudad(e.target.value)}
          list="ciudades-mapa" placeholder="Valencia, Carabobo" style={fieldStyle} />
        <datalist id="ciudades-mapa">{CIUDADES.map(c => <option key={c} value={c} />)}</datalist>
      </div>

      <Btn onClick={enviar} disabled={busy} style={{ width:"100%", justifyContent:"center" }}>
        {busy ? "Publicando..." : "Publicar alerta →"}
      </Btn>
    </div>
  );
}

// ─── LEYENDA ──────────────────────────────────────────────────
function Leyenda({ filtroActivo, onToggle }) {
  const [expandido, setExpandido] = useState(false);
  return (
    <div style={{
      position:"absolute", bottom:90, right:10, zIndex:1000,
      background:"#fff", borderRadius:12,
      boxShadow:"0 2px 12px rgba(0,0,0,0.15)",
      overflow:"hidden", minWidth:46,
    }}>
      <button onClick={() => setExpandido(e => !e)}
        style={{
          width:"100%", padding:"10px 12px", border:"none",
          cursor:"pointer", background:"none", fontWeight:700,
          fontSize:12, color:C.texto, textAlign:"left",
          display:"flex", alignItems:"center", gap:6,
        }}>
        <span style={{fontSize:16}}>🗂️</span>
        {expandido && <span>Filtrar</span>}
      </button>
      {expandido && (
        <div style={{ padding:"4px 10px 10px" }}>
          {Object.entries(CATEGORIAS).map(([key, cat]) => (
            <button key={key} onClick={() => onToggle(key)}
              style={{
                display:"flex", alignItems:"center", gap:7, width:"100%",
                padding:"5px 0", border:"none", cursor:"pointer",
                background:"none", opacity: filtroActivo === null || filtroActivo === key ? 1 : 0.35,
                transition:"opacity 0.2s",
              }}>
              <div style={{ width:12, height:12, borderRadius:"50%", background:cat.color, flexShrink:0 }}/>
              <span style={{ fontSize:11, fontWeight:600, textAlign:"left" }}>{cat.emoji} {cat.label}</span>
            </button>
          ))}
          {filtroActivo && (
            <button onClick={() => onToggle(null)}
              style={{ fontSize:11, color:C.azul, border:"none", background:"none", cursor:"pointer", marginTop:4 }}>
              Ver todas
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────
export default function MapaScreen({ ciudadUsuario }) {
  const ciudadInicial = ciudadUsuario || "Valencia, Carabobo";
  const centroInicial = CIUDAD_COORDS[ciudadInicial] || [10.1622, -67.9897];

  const [ciudadFiltro, setCiudadFiltro] = useState(ciudadInicial);
  const [centroMapa,   setCentroMapa]   = useState(centroInicial);
  const [filtroCateg,  setFiltroCateg]  = useState(null);
  const [modoReportar, setModoReportar] = useState(false);
  const [latlngClick,  setLatlngClick]  = useState(null);
  const [exitoMsg,     setExitoMsg]     = useState("");

  const { data: alertas, loading, refetch } = useAlertas(ciudadFiltro);

  const alertasFiltradas = filtroCateg
    ? alertas.filter(a => a.categoria === filtroCateg)
    : alertas;

  function handleCiudad(c) {
    setCiudadFiltro(c);
    const coords = CIUDAD_COORDS[c];
    if (coords) setCentroMapa(coords);
  }

  function handleMapaClic(latlng) {
    setLatlngClick(latlng);
    setModoReportar(false);
  }

  function handleExitoReporte() {
    setLatlngClick(null);
    setExitoMsg("✅ Alerta publicada. Visible en el mapa en segundos.");
    refetch();
    setTimeout(() => setExitoMsg(""), 4000);
  }

  function toggleFiltro(key) {
    setFiltroCateg(prev => prev === key ? null : key);
  }

  const conteo = Object.fromEntries(
    Object.keys(CATEGORIAS).map(k => [k, alertas.filter(a => a.categoria === k).length])
  );

  return (
    <div style={{ position:"relative", height:"calc(100vh - 110px)", overflow:"hidden" }}>

      {/* Barra superior */}
      <div style={{
        position:"absolute", top:0, left:0, right:0, zIndex:1000,
        background:"rgba(255,255,255,0.95)", backdropFilter:"blur(8px)",
        padding:"10px 12px", display:"flex", gap:8, alignItems:"center",
        borderBottom:`1px solid ${C.grisClaro}`,
      }}>
        <input
          value={ciudadFiltro}
          onChange={e => handleCiudad(e.target.value)}
          list="ciudades-barra"
          placeholder="📍 Ciudad..."
          style={{
            flex:1, padding:"7px 10px", borderRadius:8,
            border:`1.5px solid ${C.grisBorde}`, fontSize:13, outline:"none",
          }}
        />
        <datalist id="ciudades-barra">{CIUDADES.map(c => <option key={c} value={c} />)}</datalist>
        <button
          onClick={() => { setModoReportar(r => !r); setLatlngClick(null); }}
          style={{
            padding:"7px 12px", borderRadius:8, border:"none",
            background: modoReportar ? C.rojo : C.naranja,
            color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer",
            fontFamily:"inherit", whiteSpace:"nowrap",
          }}>
          {modoReportar ? "✕ Cancelar" : "➕ Reportar"}
        </button>
      </div>

      {/* Instrucción modo reportar */}
      {modoReportar && (
        <div style={{
          position:"absolute", top:56, left:"50%", transform:"translateX(-50%)",
          zIndex:1001, background:C.rojo, color:"#fff",
          borderRadius:20, padding:"6px 16px", fontSize:12, fontWeight:700,
          boxShadow:"0 2px 10px rgba(0,0,0,0.2)", whiteSpace:"nowrap",
        }}>
          👆 Toca el mapa donde ocurrió el evento
        </div>
      )}

      {/* Banner éxito */}
      {exitoMsg && (
        <div style={{
          position:"absolute", top:56, left:12, right:12, zIndex:1002,
          background:"#E8F5E9", border:`1px solid ${C.verde}`,
          borderRadius:10, padding:"10px 14px", fontSize:13,
          fontWeight:600, color:C.verde,
        }}>
          {exitoMsg}
        </div>
      )}

      {/* MAPA */}
      <MapContainer
        center={centroInicial}
        zoom={13}
        style={{ width:"100%", height:"100%", paddingTop:48 }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController center={centroMapa} />
        <ClickCapturar activo={modoReportar} onClic={handleMapaClic} />

        {alertasFiltradas.map(alerta => (
          <Marker
            key={alerta.id}
            position={[alerta.lat, alerta.lng]}
            icon={crearIcono(alerta.categoria)}
          >
            <Popup maxWidth={260}>
              <div style={{ fontFamily:"'Inter',sans-serif", minWidth:200 }}>
                <div style={{ display:"flex", gap:6, marginBottom:6, flexWrap:"wrap" }}>
                  <Badge
                    label={`${CATEGORIAS[alerta.categoria]?.emoji} ${CATEGORIAS[alerta.categoria]?.label}`}
                    bg={CATEGORIAS[alerta.categoria]?.color}
                  />
                  {alerta.verificado && (
                    <Badge label="✓ Verificado" bg={C.verde} />
                  )}
                </div>
                <div style={{ fontWeight:800, fontSize:14, marginBottom:4 }}>{alerta.titulo}</div>
                {alerta.descripcion && (
                  <div style={{ fontSize:12, color:C.textoSub, lineHeight:1.5, marginBottom:6 }}>
                    {alerta.descripcion}
                  </div>
                )}
                <div style={{ fontSize:11, color:C.gris }}>
                  📍 {alerta.ciudad_estado}
                  {alerta.reportado_por_nombre && (
                    <> · Por: <strong>{alerta.reportado_por_nombre}</strong></>
                  )}
                </div>
                {alerta.fuente !== "APP" && (
                  <div style={{ fontSize:11, color:C.azul, marginTop:3 }}>
                    🔗 Fuente: {alerta.fuente}
                    {alerta.fuente_url && (
                      <a href={alerta.fuente_url} target="_blank" rel="noreferrer"
                        style={{ marginLeft:4 }}>ver</a>
                    )}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Leyenda + filtros */}
      <Leyenda filtroActivo={filtroCateg} onToggle={toggleFiltro} />

      {/* Contador de alertas */}
      <div style={{
        position:"absolute", bottom:90, left:10, zIndex:1000,
        background:"rgba(255,255,255,0.95)", borderRadius:10,
        padding:"8px 12px", boxShadow:"0 2px 10px rgba(0,0,0,0.12)",
        fontSize:11, fontWeight:700, color:C.texto,
      }}>
        {loading ? "..." : `${alertasFiltradas.length} alertas`}
        {filtroCateg && (
          <span style={{ color:C.gris, fontWeight:400 }}> ({CATEGORIAS[filtroCateg]?.label})</span>
        )}
      </div>

      {/* Panel reportar alerta */}
      {latlngClick && (
        <PanelReportar
          latlng={latlngClick}
          onCerrar={() => setLatlngClick(null)}
          onExito={handleExitoReporte}
        />
      )}
    </div>
  );
}
