import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured =
  !!url && !!key && !url.includes("TU-PROJECT");

if (!isConfigured) {
  console.info("[EL] Modo demo activo — sin Supabase configurado.");
}

// Cliente principal (anon key — lectura pública habilitada)
export const supabase = createClient(url || "https://x.supabase.co", key || "x", {
  auth: { persistSession: true, autoRefreshToken: true },
  realtime: { params: { eventsPerSecond: 10 } },
});

// ─── API PÚBLICA: helpers para red abierta ────────────────────
// Estos endpoints son seguros para exponer porque RLS garantiza
// que solo se leen datos públicos (alertas activas, catálogo).

/**
 * Suscripción Realtime a alertas del mapa.
 * Llámala desde cualquier app externa con la anon key.
 * Retorna la función de unsubscribe.
 */
export function suscribirAlertas(onInsert, onUpdate) {
  if (!isConfigured) return () => {};

  const channel = supabase
    .channel("alertas-publicas")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "alertas_mapa" },
      (payload) => onInsert?.(payload.new)
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "alertas_mapa" },
      (payload) => onUpdate?.(payload.new)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

/**
 * Ingesta desde app externa.
 * Llama a la SQL function validada del lado del servidor.
 * No requiere autenticación — la función es security definer.
 */
export async function ingestarAlertaExterna(alerta) {
  if (!isConfigured) throw new Error("Supabase no configurado.");
  const { data, error } = await supabase.rpc("ingestar_alerta_externa", {
    p_lat:          alerta.lat,
    p_lng:          alerta.lng,
    p_categoria:    alerta.categoria,
    p_titulo:       alerta.titulo,
    p_descripcion:  alerta.descripcion,
    p_ciudad:       alerta.ciudad,
    p_fuente:       alerta.fuente || "API",
    p_fuente_url:   alerta.fuente_url || null,
    p_expira_horas: alerta.expira_horas || 24,
  });
  if (error) throw new Error(error.message);
  return data; // uuid de la alerta creada
}
