import { useState, useEffect, useCallback } from "react";
import { supabase, isConfigured, suscribirAlertas } from "../lib/supabase.js";
import { DEMO_ALERTAS, DEMO_EQUIPOS, DEMO_OFERTAS } from "../lib/constants.js";

// ... (El código de useAuth se mantiene igual)

// ─── ALERTAS MAPA (Corregido: filtro por 'ciudad') ──────────
export function useAlertas(ciudad) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    if (!isConfigured) {
      await new Promise(r => setTimeout(r, 350));
      const base = ciudad?.split(",")[0]?.trim();
      setData(base ? DEMO_ALERTAS.filter(a => a.ciudad.startsWith(base)) : DEMO_ALERTAS);
      setLoading(false);
      return;
    }
    let q = supabase
      .from("v_alertas_activas")
      .select("*")
      .order("created_at", { ascending: false });
    
    // CORRECCIÓN: Cambiado 'ciudad_estado' por 'ciudad'
    if (ciudad) q = q.ilike("ciudad", `%${ciudad.split(",")[0].trim()}%`);
    
    const { data: rows, error } = await q;
    if (error) console.error("Error cargando alertas:", error);
    setData(rows || []);
    setLoading(false);
  }, [ciudad]);

  useEffect(() => {
    fetch();
    const unsub = suscribirAlertas(
      (nueva) => setData(prev => [nueva, ...prev]),
      (updated) => setData(prev => prev.map(a => a.id === updated.id ? updated : a))
    );
    return unsub;
  }, [fetch]);

  return { data, loading, refetch: fetch };
}

// ─── REPORTAR ALERTA (Corregido: campo ciudad) ───────────────
export async function reportarAlerta({ lat, lng, categoria, titulo, descripcion, ciudadEstado, expiraHoras = 24 }) {
  if (!isConfigured) return "demo-" + Date.now();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("alertas_mapa").insert({
    lat, lng, categoria, titulo, descripcion,
    ciudad: ciudadEstado, // CORRECCIÓN: Ajustado a 'ciudad'
    reportado_por: user?.id || null,
    fuente: "APP",
    expira_en: new Date(Date.now() + expiraHoras * 3600000).toISOString(),
  }).select("id").single();
  if (error) throw new Error(error.message);
  return data.id;
}

// ─── EQUIPOS (Corregido: filtro por 'ciudad') ───────────────
export function useEquipos(ciudad) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("equipos_y_maquinaria")
      .select("id,tipo_equipo,descripcion_modelo,precio_estimado,ciudad,disponible,foto_url,usuarios!propietario_id(nombre_completo,telefono)")
      .eq("disponible", true)
      .order("created_at", { ascending: false });
    
    // CORRECCIÓN: Cambiado 'ciudad_estado' por 'ciudad'
    if (ciudad) q = q.ilike("ciudad", `%${ciudad.split(",")[0].trim()}%`);
    const { data: rows } = await q;
    setData(rows || []);
    setLoading(false);
  }, [ciudad]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, refetch: fetch };
}

// ─── OFERTAS (Corregido: filtro por 'ciudad') ───────────────
export function useOfertas(rol, ciudad) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ... (tiposFiltro se mantiene igual)

  const fetch = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("ofertas_empleo_y_servicios")
      .select("id,tipo_solicitud,descripcion,pago_ofrecido,ciudad,urgente,personas_requeridas,usuarios!creador_id(nombre_completo,telefono)")
      .eq("estado","ABIERTO")
      .in("tipo_solicitud", tiposFiltro)
      .order("urgente", { ascending: false })
      .order("created_at", { ascending: false });
    
    // CORRECCIÓN: Cambiado 'ciudad_estado' por 'ciudad'
    if (ciudad) q = q.ilike("ciudad", `%${ciudad.split(",")[0].trim()}%`);
    const { data: rows } = await q;
    setData(rows || []);
    setLoading(false);
  }, [rol, ciudad]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, refetch: fetch };
}

// ─── PUBLICAR OFERTA (Corregido: campo ciudad) ──────────────
export async function publicarOferta({ tipoSolicitud, descripcion, pagoOfrecido, ciudadEstado, urgente, personasRequeridas }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Debes iniciar sesión.");
  const { error } = await supabase.from("ofertas_empleo_y_servicios").insert({
    creador_id: user.id, 
    tipo_solicitud: tipoSolicitud,
    descripcion, 
    pago_ofrecido: pagoOfrecido,
    ciudad: ciudadEstado, // CORRECCIÓN: Ajustado a 'ciudad'
    urgente,
    ...(personasRequeridas ? { personas_requeridas: Number(personasRequeridas) } : {}),
  });
  if (error) throw new Error(error.message);
}
