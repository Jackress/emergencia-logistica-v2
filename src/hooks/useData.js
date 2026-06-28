import { useState, useEffect, useCallback } from "react";
import { supabase, isConfigured, suscribirAlertas } from "../lib/supabase.js";
import { DEMO_ALERTAS, DEMO_EQUIPOS, DEMO_OFERTAS } from "../lib/constants.js";

// ─── AUTH ────────────────────────────────────────────────────
export function useAuth() {
  const [session, setSession] = useState(null);
  const [perfil,  setPerfil]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) cargarPerfil(data.session.user.id);
      else setLoading(false);
    });
    const { data: l } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) cargarPerfil(s.user.id);
      else { setPerfil(null); setLoading(false); }
    });
    return () => l.subscription.unsubscribe();
  }, []);

  async function cargarPerfil(uid) {
    const { data } = await supabase.from("usuarios").select("*").eq("id", uid).single();
    setPerfil(data);
    setLoading(false);
  }

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }

  async function registro({ email, password, nombreCompleto, telefono, ciudadEstado, rol }) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    const uid = data.user?.id;
    if (!uid) throw new Error("No se pudo crear la cuenta.");
    const { error: pe } = await supabase.from("usuarios").insert({
      id: uid, nombre_completo: nombreCompleto,
      telefono, ciudad_estado: ciudadEstado, rol,
    });
    if (pe) throw new Error(pe.message);
  }

  async function logout() { await supabase.auth.signOut(); }

  return { session, perfil, loading, isConfigured, login, registro, logout };
}

// ─── ALERTAS MAPA (con Realtime) ─────────────────────────────
export function useAlertas(ciudad) {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    if (!isConfigured) {
      await new Promise(r => setTimeout(r, 350));
      const base = ciudad?.split(",")[0]?.trim();
      setData(base ? DEMO_ALERTAS.filter(a => a.ciudad_estado.startsWith(base)) : DEMO_ALERTAS);
      setLoading(false);
      return;
    }
    let q = supabase
      .from("v_alertas_activas")   // vista pública — sin RLS extra
      .select("*")
      .order("created_at", { ascending: false });
    if (ciudad) q = q.ilike("ciudad_estado", `%${ciudad.split(",")[0].trim()}%`);
    const { data: rows } = await q;
    setData(rows || []);
    setLoading(false);
  }, [ciudad]);

  useEffect(() => {
    fetch();
    // Realtime: insertar nueva alerta la agrega al estado sin refetch
    const unsub = suscribirAlertas(
      (nueva) => setData(prev => [nueva, ...prev]),
      (updated) => setData(prev => prev.map(a => a.id === updated.id ? updated : a))
    );
    return unsub;
  }, [fetch]);

  return { data, loading, refetch: fetch };
}

// ─── REPORTAR ALERTA ─────────────────────────────────────────
export async function reportarAlerta({ lat, lng, categoria, titulo, descripcion, ciudadEstado, expiraHoras = 24 }) {
  if (!isConfigured) {
    await new Promise(r => setTimeout(r, 500));
    return "demo-" + Date.now();
  }
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("alertas_mapa").insert({
    lat, lng, categoria, titulo, descripcion,
    ciudad_estado: ciudadEstado,
    reportado_por: user?.id || null,   // null = reporte anónimo permitido
    fuente: "APP",
    expira_en: new Date(Date.now() + expiraHoras * 3600000).toISOString(),
  }).select("id").single();
  if (error) throw new Error(error.message);
  return data.id;
}

// ─── EQUIPOS ─────────────────────────────────────────────────
export function useEquipos(ciudad) {
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    if (!isConfigured) {
      await new Promise(r => setTimeout(r, 350));
      const base = ciudad?.split(",")[0]?.trim();
      setData(base ? DEMO_EQUIPOS.filter(e => e.ciudad_estado.startsWith(base)) : DEMO_EQUIPOS);
      setLoading(false);
      return;
    }
    let q = supabase
      .from("equipos_y_maquinaria")
      .select("id,tipo_equipo,descripcion_modelo,precio_estimado,ciudad_estado,disponible,foto_url,usuarios!propietario_id(nombre_completo,telefono)")
      .eq("disponible", true)
      .order("created_at", { ascending: false });
    if (ciudad) q = q.ilike("ciudad_estado", `%${ciudad.split(",")[0].trim()}%`);
    const { data: rows } = await q;
    setData(rows || []);
    setLoading(false);
  }, [ciudad]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, refetch: fetch };
}

// ─── OFERTAS ─────────────────────────────────────────────────
export function useOfertas(rol, ciudad) {
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);

  const tiposFiltro = rol === "OBRERO"
    ? ["BUSCO_OBREROS","OFREZCO_TRABAJO"]
    : rol === "TRANSPORTISTA"
    ? ["BUSCO_MAQUINARIA"]
    : ["BUSCO_OBREROS","BUSCO_MAQUINARIA","OFREZCO_TRABAJO"];

  const fetch = useCallback(async () => {
    setLoading(true);
    if (!isConfigured) {
      await new Promise(r => setTimeout(r, 350));
      const base = ciudad?.split(",")[0]?.trim();
      let rows = DEMO_OFERTAS.filter(o => tiposFiltro.includes(o.tipo_solicitud));
      if (base) rows = rows.filter(o => o.ciudad_estado.startsWith(base));
      setData(rows);
      setLoading(false);
      return;
    }
    let q = supabase
      .from("ofertas_empleo_y_servicios")
      .select("id,tipo_solicitud,descripcion,pago_ofrecido,ciudad_estado,urgente,personas_requeridas,usuarios!creador_id(nombre_completo,telefono)")
      .eq("estado","ABIERTO")
      .in("tipo_solicitud", tiposFiltro)
      .order("urgente", { ascending: false })
      .order("created_at", { ascending: false });
    if (ciudad) q = q.ilike("ciudad_estado", `%${ciudad.split(",")[0].trim()}%`);
    const { data: rows } = await q;
    setData(rows || []);
    setLoading(false);
  }, [rol, ciudad]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, refetch: fetch };
}

// ─── PUBLICAR OFERTA ─────────────────────────────────────────
export async function publicarOferta({ tipoSolicitud, descripcion, pagoOfrecido, ciudadEstado, urgente, personasRequeridas }) {
  if (!isConfigured) { await new Promise(r => setTimeout(r, 500)); return; }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Debes iniciar sesión.");
  const { error } = await supabase.from("ofertas_empleo_y_servicios").insert({
    creador_id: user.id, tipo_solicitud: tipoSolicitud,
    descripcion, pago_ofrecido: pagoOfrecido,
    ciudad_estado: ciudadEstado, urgente,
    ...(personasRequeridas ? { personas_requeridas: Number(personasRequeridas) } : {}),
  });
  if (error) throw new Error(error.message);
}

// ─── REGISTRAR CONTACTO ───────────────────────────────────────
export async function registrarContacto({ receptorId, ofertaId, equipoId }) {
  if (!isConfigured || !receptorId) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("contactos").insert({
    solicitante_id: user.id, receptor_id: receptorId,
    ...(ofertaId ? { oferta_id: ofertaId } : {}),
    ...(equipoId ? { equipo_id: equipoId } : {}),
  });
}
