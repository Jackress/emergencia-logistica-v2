import { useState, useEffect, useCallback } from "react";
import { supabase, isConfigured, suscribirAlertas } from "../lib/supabase.js";
import { DEMO_ALERTAS } from "../lib/constants.js";

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
    
    // Filtro estrictamente sobre la columna "ciudad"
    if (ciudad && ciudad.trim() !== "") {
      q = q.ilike("ciudad", `%${ciudad.split(",")[0].trim()}%`);
    }
    
    const { data: rows, error } = await q;
    if (error) console.error("Error Supabase:", error);
    setData(rows || []);
    setLoading(false);
  }, [ciudad]);

  useEffect(() => {
    fetch();
    return suscribirAlertas(
      (nueva) => setData(prev => [nueva, ...prev]),
      (updated) => setData(prev => prev.map(a => a.id === updated.id ? updated : a))
    );
  }, [fetch]);

  return { data, loading, refetch: fetch };
}

export async function reportarAlerta({ lat, lng, categoria, titulo, descripcion, ciudad, expiraHoras = 24 }) {
  if (!isConfigured) return "demo-" + Date.now();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase.from("alertas_mapa").insert({
    lat: Number(lat), lng: Number(lng), categoria, titulo, descripcion,
    ciudad: ciudad || "Valencia",
    reportado_por: user?.id || null,
    fuente: "APP",
    expira_en: new Date(Date.now() + expiraHoras * 3600000).toISOString(),
  }).select("id").single();

  if (error) throw new Error(error.message);
  return data.id;
}

export function useEquipos(ciudad) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("equipos_y_maquinaria").select("*, usuarios!propietario_id(nombre_completo,telefono)").eq("disponible", true).order("created_at", { ascending: false });
    if (ciudad && ciudad.trim() !== "") q = q.ilike("ciudad", `%${ciudad.split(",")[0].trim()}%`);
    const { data: rows } = await q;
    setData(rows || []);
    setLoading(false);
  }, [ciudad]);
  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, refetch: fetch };
}

export function useOfertas(rol, ciudad, tiposFiltro = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("ofertas_empleo_y_servicios").select("*, usuarios!creador_id(nombre_completo,telefono)").eq("estado","ABIERTO").order("urgente", { ascending: false }).order("created_at", { ascending: false });
    if (tiposFiltro.length > 0) q = q.in("tipo_solicitud", tiposFiltro);
    if (ciudad && ciudad.trim() !== "") q = q.ilike("ciudad", `%${ciudad.split(",")[0].trim()}%`);
    const { data: rows } = await q;
    setData(rows || []);
    setLoading(false);
  }, [rol, ciudad, tiposFiltro]);
  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, refetch: fetch };
}

export async function publicarOferta({ tipoSolicitud, descripcion, pagoOfrecido, ciudad, urgente, personasRequeridas }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Debes iniciar sesión.");
  const { error } = await supabase.from("ofertas_empleo_y_servicios").insert({
    creador_id: user.id, tipo_solicitud: tipoSolicitud, descripcion, pago_ofrecido: pagoOfrecido, ciudad: ciudad || "Valencia", urgente,
    ...(personasRequeridas ? { personas_requeridas: Number(personasRequeridas) } : {}),
  });
  if (error) throw new Error(error.message);
}
