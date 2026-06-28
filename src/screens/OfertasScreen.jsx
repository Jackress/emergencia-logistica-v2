import { useState } from "react";
import { C, TIPO_LABEL, abrirWhatsApp } from "../lib/constants.js";
import { useOfertas, registrarContacto } from "../hooks/useData.js";
import { Badge, Btn, Card, Spinner, Empty } from "../components/UI.jsx";

export default function OfertasScreen({ rolUsuario, ciudadUsuario }) {
  const [ciudadFiltro, setCiudadFiltro] = useState(ciudadUsuario || "");
  const { data: ofertas, loading } = useOfertas(rolUsuario, ciudadFiltro);

  const titulo = rolUsuario === "OBRERO"       ? "💼 Empleos Disponibles"
               : rolUsuario === "TRANSPORTISTA" ? "📦 Pedidos de Transporte"
               : "📋 Todas las Ofertas";

  function contactar(oferta) {
    const u = oferta.usuarios || {};
    registrarContacto({ receptorId: u.id, ofertaId: oferta.id }).catch(() => {});
    const meta = TIPO_LABEL[oferta.tipo_solicitud] || {};
    abrirWhatsApp(u.telefono, u.nombre_completo,
      `${meta.emoji || ""} ${meta.label || oferta.tipo_solicitud} — ${oferta.descripcion.substring(0, 80)}...`
    );
  }

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 4 }}>{titulo}</div>
      <div style={{ fontSize: 13, color: C.gris, marginBottom: 16 }}>
        Ordenadas por urgencia · Actualizado en tiempo real
      </div>

      {/* Ciudad filtro */}
      <input
        value={ciudadFiltro}
        onChange={e => setCiudadFiltro(e.target.value)}
        placeholder="📍 Filtrar por ciudad..."
        style={{
          width: "100%", padding: "9px 12px", borderRadius: 9,
          border: `1.5px solid ${C.grisBorde}`, fontSize: 13,
          outline: "none", background: "#fafafa",
          boxSizing: "border-box", marginBottom: 14,
        }}
      />

      {loading && <Spinner />}

      {!loading && ofertas.length === 0 && (
        <Empty
          emoji="📋"
          title="Sin ofertas disponibles"
          sub="Intenta cambiar la ciudad o revisa más tarde"
        />
      )}

      {ofertas.map(o => {
        const meta = TIPO_LABEL[o.tipo_solicitud] || { label: o.tipo_solicitud, emoji: "📌", color: C.gris };
        const u = o.usuarios || {};
        return (
          <Card
            key={o.id}
            style={{
              borderLeft: o.urgente ? `4px solid ${C.rojo}` : `4px solid ${C.grisClaro}`,
            }}
          >
            {/* Header badges */}
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 10 }}>
              <Badge label={`${meta.emoji} ${meta.label}`} bg={meta.color} />
              {o.urgente && (
                <Badge label="🔴 URGENTE" bg={C.rojo} style={{ animation: "pulse 1.5s infinite" }} />
              )}
            </div>

            <div style={{ fontSize: 14, color: C.textoSub, lineHeight: 1.55, marginBottom: 12 }}>
              {o.descripcion}
            </div>

            <div style={{ display: "flex", gap: 14, fontSize: 12, color: C.gris, marginBottom: 14, flexWrap: "wrap" }}>
              <span>📍 {o.ciudad_estado}</span>
              <span style={{ fontWeight: 800, color: C.verde, fontSize: 13 }}>💰 {o.pago_ofrecido}</span>
              {o.personas_requeridas && (
                <span>👥 {o.personas_requeridas} {o.personas_requeridas === 1 ? "persona" : "personas"}</span>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 12, color: C.gris }}>
                Publicado por: <strong style={{ color: C.texto }}>{u.nombre_completo}</strong>
              </div>
              <Btn variant="whatsapp" small onClick={() => contactar(o)}>
                📱 Contactar
              </Btn>
            </div>
          </Card>
        );
      })}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
