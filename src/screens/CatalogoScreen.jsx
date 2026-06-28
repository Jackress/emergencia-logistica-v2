import { useState } from "react";
import { C, TIPO_LABEL, abrirWhatsApp } from "../lib/constants.js";
import { useEquipos, registrarContacto } from "../hooks/useData.js";
import { Badge, Btn, Card, Spinner, Empty, Input } from "../components/UI.jsx";

export default function CatalogoScreen({ ciudadUsuario }) {
  const [ciudadFiltro, setCiudadFiltro] = useState(ciudadUsuario || "");
  const [busqueda,     setBusqueda]     = useState("");
  const { data: equipos, loading, refetch } = useEquipos(ciudadFiltro);

  const filtrados = equipos.filter(e =>
    !busqueda ||
    e.tipo_equipo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.descripcion_modelo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  function contactar(equipo) {
    const u = equipo.usuarios || {};
    registrarContacto({ receptorId: u.id, equipoId: equipo.id }).catch(() => {});
    abrirWhatsApp(u.telefono, u.nombre_completo, `${equipo.tipo_equipo} — ${equipo.descripcion_modelo}`);
  }

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 4 }}>🚛 Maquinaria Disponible</div>
      <div style={{ fontSize: 13, color: C.gris, marginBottom: 16 }}>
        Equipos listos para trabajar
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <input
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="🔍 Buscar equipo..."
            style={{
              width: "100%", padding: "9px 12px", borderRadius: 9,
              border: `1.5px solid ${C.grisBorde}`, fontSize: 13,
              outline: "none", background: "#fafafa", boxSizing: "border-box",
            }}
          />
        </div>
        <input
          value={ciudadFiltro} onChange={e => setCiudadFiltro(e.target.value)}
          placeholder="📍 Ciudad"
          style={{
            width: 130, padding: "9px 10px", borderRadius: 9,
            border: `1.5px solid ${C.grisBorde}`, fontSize: 13,
            outline: "none", background: "#fafafa",
          }}
        />
      </div>

      {loading && <Spinner />}

      {!loading && filtrados.length === 0 && (
        <Empty
          emoji="🚛"
          title="Sin equipos disponibles"
          sub="Prueba cambiar la ciudad o ampliar la búsqueda"
        />
      )}

      {filtrados.map(eq => {
        const u = eq.usuarios || {};
        return (
          <Card key={eq.id} style={{
            borderLeft: `4px solid ${eq.disponible ? C.verde : C.gris}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: C.texto }}>{eq.tipo_equipo}</div>
                <div style={{ fontSize: 13, color: C.gris, marginTop: 2 }}>{eq.descripcion_modelo}</div>
              </div>
              <Badge
                label={eq.disponible ? "✓ Disponible" : "No disponible"}
                bg={eq.disponible ? C.verde : C.gris}
              />
            </div>

            <div style={{ display: "flex", gap: 14, fontSize: 12, color: C.gris, marginBottom: 14, flexWrap: "wrap" }}>
              <span>📍 {eq.ciudad_estado}</span>
              <span style={{ fontWeight: 800, color: C.verde, fontSize: 13 }}>
                💰 {eq.precio_estimado}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 12, color: C.gris }}>
                Propietario: <strong style={{ color: C.texto }}>{u.nombre_completo}</strong>
              </div>
              <Btn
                variant="whatsapp"
                small
                disabled={!eq.disponible}
                onClick={() => contactar(eq)}
              >
                📱 Contactar
              </Btn>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
