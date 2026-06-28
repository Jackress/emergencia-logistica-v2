// =============================================================
// RED ABIERTA — DOCUMENTACIÓN DE ENDPOINTS PÚBLICOS
// =============================================================
// Todos estos endpoints usan la ANON KEY de Supabase.
// No requieren autenticación para lectura.
// La ingesta de datos externos usa la función SQL validada.
// =============================================================

/**
 * ENDPOINT 1 — Leer alertas activas (cualquier app puede consumir)
 *
 * GET https://TU-PROJECT.supabase.co/rest/v1/v_alertas_activas
 * Headers:
 *   apikey: TU_ANON_KEY
 *   Accept: application/json
 *
 * Query params opcionales:
 *   ?ciudad_estado=ilike.*Valencia*
 *   &categoria=eq.INCENDIO
 *   &order=created_at.desc
 *   &limit=50
 *
 * Ejemplo de respuesta:
 * [
 *   {
 *     "id": "uuid",
 *     "lat": 10.1621,
 *     "lng": -67.9894,
 *     "categoria": "INCENDIO",
 *     "titulo": "Incendio sector norte",
 *     "descripcion": "...",
 *     "ciudad_estado": "Valencia, Carabobo",
 *     "verificado": true,
 *     "fuente": "APP",
 *     "created_at": "2025-01-01T00:00:00Z"
 *   }
 * ]
 */

/**
 * ENDPOINT 2 — Realtime (WebSocket, para apps que quieran push)
 *
 * const supabase = createClient(URL, ANON_KEY)
 * supabase
 *   .channel('alertas-externas')
 *   .on('postgres_changes', { event: '*', schema: 'public', table: 'alertas_mapa' }, handler)
 *   .subscribe()
 */

/**
 * ENDPOINT 3 — Ingestar alerta desde app externa
 *
 * POST https://TU-PROJECT.supabase.co/rest/v1/rpc/ingestar_alerta_externa
 * Headers:
 *   apikey: TU_ANON_KEY
 *   Content-Type: application/json
 *
 * Body:
 * {
 *   "p_lat": 10.1621,
 *   "p_lng": -67.9894,
 *   "p_categoria": "INCENDIO",      // ver CATEGORIAS en constants.js
 *   "p_titulo": "Incendio en X",
 *   "p_descripcion": "Descripción",
 *   "p_ciudad": "Valencia, Carabobo",
 *   "p_fuente": "BOT_TELEGRAM",     // identifica tu app
 *   "p_fuente_url": "https://t.me/...",
 *   "p_expira_horas": 24
 * }
 *
 * Respuesta: UUID de la alerta creada
 * La función valida: categoría permitida + coordenadas dentro de Venezuela.
 */

// =============================================================
// EDGE FUNCTION — Webhook para recibir alertas de Telegram/RSS
// Despliega en: Supabase → Edge Functions → New Function
// =============================================================

// supabase/functions/ingestar-webhook/index.ts
export const EDGE_FUNCTION_TEMPLATE = `
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_SOURCES = ["BOT_TELEGRAM", "RSS_CBVE", "APP_BOMBEROS", "ONG_VE"];

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Validar token de fuente externa (configúralo en Edge Function Secrets)
  const token = req.headers.get("x-api-token");
  if (token !== Deno.env.get("WEBHOOK_SECRET")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const fuente = body.fuente;

  if (!ALLOWED_SOURCES.includes(fuente)) {
    return new Response("Fuente no permitida", { status: 403 });
  }

  // Usar service_role para bypassear RLS en ingestión confiable
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );

  const { data, error } = await supabase.rpc("ingestar_alerta_externa", {
    p_lat:          body.lat,
    p_lng:          body.lng,
    p_categoria:    body.categoria,
    p_titulo:       body.titulo,
    p_descripcion:  body.descripcion || "",
    p_ciudad:       body.ciudad,
    p_fuente:       fuente,
    p_fuente_url:   body.fuente_url || null,
    p_expira_horas: body.expira_horas || 24,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ id: data }), {
    status: 201, headers: { "Content-Type": "application/json" }
  });
});
`;

// =============================================================
// EJEMPLO: Consumir esta API desde otra app (vanilla JS)
// =============================================================
export const EJEMPLO_CONSUMIDOR = `
const EMERGENCIA_URL = "https://TU-PROJECT.supabase.co/rest/v1/v_alertas_activas";
const ANON_KEY = "TU_ANON_KEY";

async function obtenerAlertasVenezuela() {
  const res = await fetch(
    EMERGENCIA_URL + "?order=created_at.desc&limit=100",
    { headers: { apikey: ANON_KEY, Accept: "application/json" } }
  );
  return res.json();
}

// Para filtrar por ciudad
async function alertasCaracas() {
  const res = await fetch(
    EMERGENCIA_URL + "?ciudad_estado=ilike.*Caracas*&order=created_at.desc",
    { headers: { apikey: ANON_KEY, Accept: "application/json" } }
  );
  return res.json();
}
`;
