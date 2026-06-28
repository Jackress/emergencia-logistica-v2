import { C } from "../lib/constants.js";
import { Card } from "../components/UI.jsx";

export default function HomeScreen({ usuario, onNav }) {
  const { rol, ciudad_estado, nombre_completo } = usuario;

  const cards = [
    rol === "CLIENTE" && {
      id: "catalogo",
      emoji: "🚛",
      title: "Necesito Maquinaria",
      sub: "Camiones, excavadoras, gandolas y más",
      bg: `linear-gradient(135deg, ${C.rojo}, #B71C1C)`,
    },
    (rol === "OBRERO" || rol === "TRANSPORTISTA") && {
      id: "ofertas",
      emoji: rol === "OBRERO" ? "👷" : "📦",
      title: rol === "OBRERO" ? "Ver Empleos" : "Ver Pedidos",
      sub: rol === "OBRERO" ? "Trabajos disponibles en tu zona" : "Solicitudes de transporte y maquinaria",
      bg: `linear-gradient(135deg, ${C.naranja}, #BF360C)`,
    },
    rol === "CLIENTE" && {
      id: "ofertas",
      emoji: "👷",
      title: "Necesito Obreros",
      sub: "Personal para obra, escombros, demolición",
      bg: `linear-gradient(135deg, #6A1B9A, #4A148C)`,
    },
    {
      id: "publicar",
      emoji: "➕",
      title: "Publicar Anuncio",
      sub: "Llega a cientos de personas en segundos",
      bg: `linear-gradient(135deg, #1565C0, #0D47A1)`,
    },
  ].filter(Boolean);

  return (
    <div style={{ padding: "20px 16px" }}>
      {/* Saludo */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: C.texto, letterSpacing: -0.5 }}>
          Hola, {nombre_completo?.split(" ")[0]} 👋
        </div>
        <div style={{ fontSize: 13, color: C.gris, marginTop: 3 }}>
          📍 {ciudad_estado || "Venezuela"} · {rol}
        </div>
      </div>

      {/* Crisis banner */}
      <div style={{
        background: `linear-gradient(120deg, ${C.rojo}15, ${C.naranja}10)`,
        border: `1px solid ${C.rojo}30`,
        borderRadius: 14, padding: "14px 16px", marginBottom: 22,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{ fontSize: 32 }}>🇻🇪</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.rojo }}>
            Plataforma de Emergencia Activa
          </div>
          <div style={{ fontSize: 12, color: C.gris, marginTop: 2 }}>
            Conectamos recursos para la reconstrucción post-sismo
          </div>
        </div>
      </div>

      {/* Action cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {cards.map(card => (
          <div
            key={card.id + card.title}
            onClick={() => onNav(card.id)}
            style={{
              background: card.bg,
              borderRadius: 16, padding: "20px 22px",
              cursor: "pointer", color: "#fff",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              display: "flex", alignItems: "center", gap: 16,
              transition: "transform 0.15s, box-shadow 0.15s",
              userSelect: "none",
            }}
            onMouseDown={e => { e.currentTarget.style.transform = "scale(0.97)"; }}
            onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            <div style={{ fontSize: 38 }}>{card.emoji}</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 17, letterSpacing: -0.3 }}>{card.title}</div>
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 3 }}>{card.sub}</div>
            </div>
            <div style={{ marginLeft: "auto", opacity: 0.7, fontSize: 20 }}>›</div>
          </div>
        ))}
      </div>

      {/* Stats strip */}
      <div style={{
        display: "flex", justifyContent: "space-around",
        marginTop: 24, padding: "16px 0",
        borderTop: `1px solid ${C.grisClaro}`,
      }}>
        {[
          { n: "24/7", label: "Disponible" },
          { n: "100%", label: "Gratis" },
          { n: "WhatsApp", label: "Contacto directo" },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 900, fontSize: 15, color: C.rojo }}>{s.n}</div>
            <div style={{ fontSize: 11, color: C.gris, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
