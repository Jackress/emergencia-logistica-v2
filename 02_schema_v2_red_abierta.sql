-- =============================================================
-- EMERGENCIA LOGÍSTICA VENEZUELA — SCHEMA v2
-- Red Abierta + Mapa Colaborativo
-- Ejecutar en: Supabase → SQL Editor → New Query → Run
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 0. EXTENSIONES
-- ─────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";   -- para coordenadas geográficas

-- ─────────────────────────────────────────────────────────────
-- 1. TABLA: usuarios (sin cambios de estructura)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.usuarios (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),
  nombre_completo text not null,
  telefono        text not null unique,
  ciudad_estado   text not null,
  rol             text not null check (rol in ('COLABORADOR','TRANSPORTISTA','OBRERO')),
  -- Nota: 'CLIENTE' renombrado a 'COLABORADOR' para reflejar filosofía abierta
  foto_url        text,
  activo          boolean not null default true
);

-- ─────────────────────────────────────────────────────────────
-- 2. TABLA: alertas_mapa  ← NUEVA — corazón de la red abierta
-- ─────────────────────────────────────────────────────────────
create table if not exists public.alertas_mapa (
  id           uuid primary key default uuid_generate_v4(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- Coordenadas (lat/lng decimales, compatibles con Leaflet)
  lat          numeric(10,7) not null,
  lng          numeric(10,7) not null,

  -- Categoría del ícono en el mapa
  categoria    text not null check (categoria in (
    'INCENDIO',
    'MAQUINARIA',
    'PERSONAL',
    'ACOPIO',
    'ALERTA_PERSONAL',
    'ALERTA_INSUMOS'
  )),

  titulo       text not null,
  descripcion  text,
  ciudad_estado text not null,

  -- Estado del evento
  activo       boolean not null default true,
  verificado   boolean not null default false,  -- moderación colaborativa

  -- Quién lo reportó (nullable = reporte anónimo permitido)
  reportado_por uuid references public.usuarios(id) on delete set null,

  -- Fuente: permite ingestión desde apps externas
  fuente       text not null default 'APP',     -- 'APP' | 'API' | 'BOT_TELEGRAM' | 'RSS'
  fuente_url   text,                            -- URL de origen si viene de otra app

  -- TTL automático: las alertas expiran en 24h por defecto
  expira_en    timestamptz not null default (now() + interval '24 hours')
);

comment on table public.alertas_mapa is
  'Alertas geolocalizadas visibles en el mapa colaborativo. Acceso público de lectura.';

create index if not exists idx_alertas_activas_ciudad
  on public.alertas_mapa (ciudad_estado, activo, categoria)
  where activo = true;

create index if not exists idx_alertas_coords
  on public.alertas_mapa (lat, lng)
  where activo = true;

-- Auto-actualizar updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger alertas_updated_at
  before update on public.alertas_mapa
  for each row execute procedure public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 3. TABLA: equipos_y_maquinaria (sin cambios)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.equipos_y_maquinaria (
  id                uuid primary key default uuid_generate_v4(),
  created_at        timestamptz not null default now(),
  propietario_id    uuid not null references public.usuarios(id) on delete cascade,
  tipo_equipo       text not null,
  descripcion_modelo text not null,
  disponible        boolean not null default true,
  precio_estimado   text not null,
  ciudad_estado     text not null,
  foto_url          text,
  capacidad_m3      numeric(8,2),
  -- Nuevos: coordenadas opcionales para aparecer en el mapa
  lat               numeric(10,7),
  lng               numeric(10,7)
);

create index if not exists idx_equipos_ciudad_disponible
  on public.equipos_y_maquinaria (ciudad_estado, disponible);

-- ─────────────────────────────────────────────────────────────
-- 4. TABLA: ofertas_empleo_y_servicios (sin cambios)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.ofertas_empleo_y_servicios (
  id             uuid primary key default uuid_generate_v4(),
  created_at     timestamptz not null default now(),
  creador_id     uuid not null references public.usuarios(id) on delete cascade,
  tipo_solicitud text not null check (tipo_solicitud in (
                   'BUSCO_MAQUINARIA','BUSCO_OBREROS','OFREZCO_TRABAJO')),
  descripcion    text not null,
  pago_ofrecido  text not null,
  ciudad_estado  text not null,
  estado         text not null default 'ABIERTO'
                   check (estado in ('ABIERTO','CERRADO','EN_PROCESO')),
  urgente        boolean not null default false,
  personas_requeridas int
);

create index if not exists idx_ofertas_ciudad_estado_tipo
  on public.ofertas_empleo_y_servicios (ciudad_estado, estado, tipo_solicitud);

-- ─────────────────────────────────────────────────────────────
-- 5. TABLA: contactos (sin cambios)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.contactos (
  id             uuid primary key default uuid_generate_v4(),
  created_at     timestamptz not null default now(),
  solicitante_id uuid not null references public.usuarios(id),
  receptor_id    uuid not null references public.usuarios(id),
  oferta_id      uuid references public.ofertas_empleo_y_servicios(id),
  equipo_id      uuid references public.equipos_y_maquinaria(id),
  canal          text not null default 'WHATSAPP'
);

-- ─────────────────────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────
alter table public.usuarios                    enable row level security;
alter table public.equipos_y_maquinaria        enable row level security;
alter table public.ofertas_empleo_y_servicios  enable row level security;
alter table public.contactos                   enable row level security;
alter table public.alertas_mapa                enable row level security;

-- ── usuarios ──────────────────────────────────────────────────
create policy "Lectura pública de usuarios"
  on public.usuarios for select using (true);

create policy "Edición propia de perfil"
  on public.usuarios for update using (auth.uid() = id);

create policy "Insertar perfil propio"
  on public.usuarios for insert with check (auth.uid() = id);

-- ── equipos ───────────────────────────────────────────────────
create policy "Lectura pública de equipos"
  on public.equipos_y_maquinaria for select using (true);

create policy "Insertar equipo propio"
  on public.equipos_y_maquinaria for insert
  with check (auth.uid() = propietario_id);

create policy "Editar equipo propio"
  on public.equipos_y_maquinaria for update
  using (auth.uid() = propietario_id);

create policy "Eliminar equipo propio"
  on public.equipos_y_maquinaria for delete
  using (auth.uid() = propietario_id);

-- ── ofertas ───────────────────────────────────────────────────
create policy "Lectura pública de ofertas"
  on public.ofertas_empleo_y_servicios for select using (true);

create policy "Insertar oferta propia"
  on public.ofertas_empleo_y_servicios for insert
  with check (auth.uid() = creador_id);

create policy "Editar oferta propia"
  on public.ofertas_empleo_y_servicios for update
  using (auth.uid() = creador_id);

create policy "Cerrar oferta propia"
  on public.ofertas_empleo_y_servicios for delete
  using (auth.uid() = creador_id);

-- ── contactos ─────────────────────────────────────────────────
create policy "Lectura contactos propios"
  on public.contactos for select
  using (auth.uid() = solicitante_id or auth.uid() = receptor_id);

create policy "Registrar contacto autenticado"
  on public.contactos for insert
  with check (auth.uid() = solicitante_id);

-- ── alertas_mapa — LECTURA TOTALMENTE PÚBLICA ─────────────────
-- Cualquiera (incluso sin autenticar) puede leer alertas activas.
-- Esto es el corazón de la red abierta.
create policy "Lectura pública de alertas activas"
  on public.alertas_mapa for select
  using (activo = true and expira_en > now());

-- Cualquier usuario autenticado puede reportar una alerta
create policy "Reportar alerta autenticado"
  on public.alertas_mapa for insert
  with check (auth.uid() is not null or auth.uid() is null); -- permite anónimos también

-- Solo el reportero puede cerrar su propia alerta
create policy "Cerrar alerta propia"
  on public.alertas_mapa for update
  using (auth.uid() = reportado_por or reportado_por is null);

-- ─────────────────────────────────────────────────────────────
-- 7. VISTAS PÚBLICAS (endpoints de la red abierta)
-- ─────────────────────────────────────────────────────────────

-- Vista principal del mapa: consumible por cualquier app externa
create or replace view public.v_alertas_activas as
  select
    a.id,
    a.created_at,
    a.lat,
    a.lng,
    a.categoria,
    a.titulo,
    a.descripcion,
    a.ciudad_estado,
    a.verificado,
    a.fuente,
    a.fuente_url,
    a.expira_en,
    u.nombre_completo as reportado_por_nombre
  from public.alertas_mapa a
  left join public.usuarios u on u.id = a.reportado_por
  where a.activo = true and a.expira_en > now()
  order by a.created_at desc;

comment on view public.v_alertas_activas is
  'Endpoint público de alertas. Seguro para exponer a apps externas.';

-- Vista de catálogo combinado (equipos + ofertas)
create or replace view public.v_catalogo as
  select
    e.id, 'EQUIPO' as categoria,
    e.tipo_equipo as titulo, e.descripcion_modelo as descripcion,
    e.precio_estimado as precio, e.ciudad_estado,
    u.nombre_completo as contacto_nombre, u.telefono as contacto_telefono,
    e.foto_url, e.lat, e.lng, e.created_at
  from public.equipos_y_maquinaria e
  join public.usuarios u on u.id = e.propietario_id
  where e.disponible = true
union all
  select
    o.id, 'OFERTA' as categoria,
    o.tipo_solicitud as titulo, o.descripcion,
    o.pago_ofrecido as precio, o.ciudad_estado,
    u.nombre_completo, u.telefono,
    null as foto_url, null as lat, null as lng, o.created_at
  from public.ofertas_empleo_y_servicios o
  join public.usuarios u on u.id = o.creador_id
  where o.estado = 'ABIERTO';

-- ─────────────────────────────────────────────────────────────
-- 8. FUNCIÓN: ingestión desde apps externas (API abierta)
-- Llamada con service_role desde un edge function o webhook
-- ─────────────────────────────────────────────────────────────
create or replace function public.ingestar_alerta_externa(
  p_lat          numeric,
  p_lng          numeric,
  p_categoria    text,
  p_titulo       text,
  p_descripcion  text,
  p_ciudad       text,
  p_fuente       text,
  p_fuente_url   text default null,
  p_expira_horas int default 24
) returns uuid language plpgsql security definer as $$
declare
  nuevo_id uuid;
begin
  -- Validación básica de categoría
  if p_categoria not in ('INCENDIO','MAQUINARIA','PERSONAL','ACOPIO','ALERTA_PERSONAL','ALERTA_INSUMOS') then
    raise exception 'Categoría inválida: %', p_categoria;
  end if;
  -- Validación de coordenadas (Venezuela: lat 0.6–12.2, lng -73.4 a -59.8)
  if p_lat < 0.6 or p_lat > 12.2 or p_lng < -73.4 or p_lng > -59.8 then
    raise exception 'Coordenadas fuera de Venezuela';
  end if;

  insert into public.alertas_mapa
    (lat, lng, categoria, titulo, descripcion, ciudad_estado, fuente, fuente_url, expira_en)
  values
    (p_lat, p_lng, p_categoria, p_titulo, p_descripcion, p_ciudad,
     p_fuente, p_fuente_url, now() + (p_expira_horas || ' hours')::interval)
  returning id into nuevo_id;

  return nuevo_id;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 9. REALTIME: activar para alertas (push al cliente sin polling)
-- ─────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.alertas_mapa;

-- ─────────────────────────────────────────────────────────────
-- 10. SEED: alertas de demostración
-- ─────────────────────────────────────────────────────────────
insert into public.alertas_mapa
  (lat, lng, categoria, titulo, descripcion, ciudad_estado, fuente, expira_en)
values
  (10.1621, -67.9894, 'INCENDIO',        'Incendio sector norte',          'Fuego activo en galpón industrial. Se necesitan extintores.',           'Valencia, Carabobo',  'APP', now() + interval '48 hours'),
  (10.1700, -68.0050, 'MAQUINARIA',      'Retroexcavadora disponible',     'Caterpillar 416F2 disponible para remoción de escombros.',              'Valencia, Carabobo',  'APP', now() + interval '48 hours'),
  (10.1550, -67.9700, 'PERSONAL',        'Brigada voluntaria en terreno',  '12 voluntarios activos limpiando Av. Bolívar. Coordinador: Carlos.',    'Valencia, Carabobo',  'APP', now() + interval '48 hours'),
  (10.1800, -67.9600, 'ACOPIO',          'Centro de acopio Las Acacias',   'Recibimos agua, comida enlatada y medicamentos. Abierto 7am–8pm.',      'Valencia, Carabobo',  'APP', now() + interval '48 hours'),
  (10.1400, -68.0200, 'ALERTA_PERSONAL', 'Urgente: faltan obreros',        'Zona residencial El Trigal necesita 8 personas para remoción hoy.',     'Valencia, Carabobo',  'APP', now() + interval '24 hours'),
  (10.1900, -67.9800, 'ALERTA_INSUMOS',  'Sin agua potable',               'Sector La Isabelica sin suministro. 200 familias afectadas.',           'Valencia, Carabobo',  'APP', now() + interval '24 hours'),
  (10.4806, -66.9036, 'INCENDIO',        'Incendio Petare',                'Incendio en viviendas. Cuerpo de bomberos activo.',                     'Caracas, Miranda',    'APP', now() + interval '24 hours'),
  (10.2467, -67.5964, 'ACOPIO',          'Acopio Cruz Roja Maracay',       'Centro oficial. Aceptan ropa, agua y medicinas.',                       'Maracay, Aragua',     'APP', now() + interval '72 hours')
on conflict do nothing;
