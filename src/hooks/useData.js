import { useState, useEffect, useCallback } from "react";
import { supabase, isConfigured, suscribirAlertas } from "../lib/supabase.js";
import { DEMO_ALERTAS } from "../lib/constants.js";

// ─── ALERTAS MAPA ──────────────────────────────────────────
export function useAlertas(ciudad) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    if (!isConfigured) {
      setData(DEMO_ALERTAS);
      setLoading(false);
      return;
    }

    let q = supabase
      .from("v_alertas_activas")
      .select("*")
      .order("created_at", { ascending: false });
    
    // Filtro por ciudad (asegurando limpieza de string)
    if (ciudad) {
      const ciudadLimpia = ciudad.split(",")[0].trim();
      q = q.ilike("ciudad", `%${ciudadLimpia}%`);
    }
    
    const { data: rows, error } = await q;
    
    // DEBUG CRÍTICO: Si no ves marcadores, mira esto en la consola F12
    if (error) console.error("Error cargando alertas:", error);
    console.log("Datos recibidos de Supabase:", rows); 
    
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

// ─── REPORTAR ALERTA ──────────────────────────────────────────
export async function reportarAlerta({ lat, lng, categoria, titulo, descripcion, ciudad, expiraHoras = 24 }) {
  if (!isConfigured) return "demo-" + Date.now();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  // Aseguramos que lat/lng sean números
  const { data, error } = await supabase.from("alertas_mapa").insert({
    lat: Number(lat), 
    lng: Number(lng), 
    categoria, 
    titulo, 
    descripcion,
    ciudad: ciudad, 
    reportado_por: user?.id || null,
    fuente: "APP",
    expira_en: new Date(Date.now() + expiraHoras * 3600000).toISOString(),
  }).select("id").single();

  if (error) throw new Error(error.message);
  return data.id;
}

// ─── EQUIPOS Y MAQUINARIA ─────────────────────────────────────
export function useEquipos(ciudad) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("equipos_y_maquinaria")
      .select("*, usuarios!propietario_id(nombre_completo,telefono)")
      .eq("disponible", true)
      .order("created_at", { ascending: false });
    
    if (ciudad) q = q.ilike("ciudad", `%${ciudad.split(",")[0].trim()}%`);
    
    const { data: rows } = await q;
    setData(rows || []);
    setLoading(false);
  }, [ciudad]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, refetch: fetch };
}

// ─── OFERTAS ──────────────────────────────────────────────────
export function useOfertas(rol, ciudad, tiposFiltro = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const fetch = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("ofertas_empleo_y_servicios")
      .select("*, usuarios!creador_id(nombre_completo,telefono)")
      .eq("estado","ABIERTO")
      .order("urgente", { ascending: false })
      .order("created_at", { ascending: false });
    
    if (tiposFiltro.length > 0) q = q.in("tipo_solicitud", tiposFiltro);
    if (ciudad) q = q.ilike("ciudad", `%${ciudad.split(",")[0].trim()}%`);
    
    const { data: rows } = await q;
    setData(rows || []);
    setLoading(false);
  }, [rol, ciudad, tiposFiltro]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, refetch: fetch };
}

// ─── PUBLICAR OFERTA ────────────────────────────────────────
export async function publicarOferta({ tipoSolicitud, descripcion, pagoOfrecido, ciudad, urgente, personasRequeridas }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Debes iniciar sesión.");
  
  const { error } = await supabase.from("ofertas_empleo_y_servicios").insert({
    creador_id: user.id, 
    tipo_solicitud: tipoSolicitud,
    descripcion, 
    pago_ofrecido: pagoOfrecido,
    ciudad: ciudad,
    urgente,
    ...(personasRequeridas ? { personas_requeridas: Number(personasRequeridas) } : {}),
  });
  if (error) throw new Error(error.message);
}
