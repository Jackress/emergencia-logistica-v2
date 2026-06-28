# 🚨 Emergencia Logística — Guía de Despliegue

## Estructura del proyecto

```
emergencia-logistica/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   └── UI.jsx              # Badge, Btn, Card, Input, Spinner, Alert, DemoBanner
│   ├── hooks/
│   │   └── useData.js          # useAuth, useEquipos, useOfertas, publicarOferta
│   ├── lib/
│   │   ├── constants.js        # Tokens de diseño, datos demo, helpers
│   │   └── supabase.js         # Cliente Supabase (singleton)
│   ├── screens/
│   │   ├── AuthScreen.jsx      # Login + Registro
│   │   ├── HomeScreen.jsx      # Hub principal
│   │   ├── CatalogoScreen.jsx  # Listado de maquinaria (CLIENTE)
│   │   ├── OfertasScreen.jsx   # Listado de empleos/pedidos
│   │   └── PublicarScreen.jsx  # Formulario de nueva publicación
│   ├── App.jsx                 # Root: auth, navegación, rutas
│   └── main.jsx                # Entry point
├── index.html
├── vite.config.js
├── package.json
├── .env.example                # Plantilla de variables de entorno
└── .gitignore
```

---

## PASO 1 — Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a **SQL Editor → New Query** y pega el contenido de `01_schema.sql`
3. Ejecuta el script (crea tablas, RLS y datos de prueba)

---

## PASO 2 — Variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local`:
```env
VITE_SUPABASE_URL=https://TU-PROJECT-ID.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY_AQUI
```

Obtén ambos valores en: **Supabase → Settings → API**

---

## PASO 3 — Desarrollo local

```bash
npm install
npm run dev
# → http://localhost:5173
```

> **Sin configurar Supabase:** la app funciona en modo demo con datos de prueba.
> El banner amarillo lo indica. El botón "Explorar sin cuenta" también activa el modo demo.

---

## PASO 4 — Build de producción

```bash
npm run build
# Genera la carpeta /dist lista para desplegar
```

---

## PASO 5 — Despliegue

### Vercel (recomendado — gratis)
```bash
npm i -g vercel
vercel
# Sigue el asistente. Agrega las variables VITE_SUPABASE_* en el dashboard de Vercel.
```

### Netlify (alternativa — gratis)
```bash
npm i -g netlify-cli
netlify deploy --dir=dist --prod
# Agrega las variables en: Netlify → Site → Environment variables
```

### Distribución por APK (Android)
- Después del build, usa [Capacitor](https://capacitorjs.com) o súbelo como PWA:
  - En Vercel/Netlify agrega el dominio y comparte el link por WhatsApp
  - En Chrome Android: "Agregar a pantalla de inicio" → comportamiento nativo

---

## Flujo de la app

```
Auth (login / registro)
  └─> App detecta sesión Supabase
      └─> HomeScreen (hub con botones según rol)
          ├─ CLIENTE     → CatalogoScreen (maquinaria disponible)
          ├─ OBRERO      → OfertasScreen (empleos y trabajo)
          ├─ TRANSPORTISTA → OfertasScreen (pedidos de maquinaria)
          └─ Todos       → PublicarScreen (nuevo anuncio)
```

Cada contacto abre WhatsApp con mensaje pre-cargado y registra la interacción en la tabla `contactos` para auditoría.

---

## Extensiones posibles

| Feature | Cómo |
|---|---|
| Notificaciones push | Supabase Realtime + PWA Push API |
| Subida de fotos | Supabase Storage, campo `foto_url` ya existe |
| Perfil de usuario | Nueva pantalla + update a tabla `usuarios` |
| Panel de admin | Supabase Studio o app separada con service_role key |
| Búsqueda por mapa | Integrar Google Maps con coordenadas en BD |
