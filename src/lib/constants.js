// ─── DESIGN TOKENS ───────────────────────────────────────────
export const C = {
  rojo:        "#C62828",
  rojoClaro:   "#EF5350",
  rojoBg:      "#FFEBEE",
  naranja:     "#E65100",
  bg:          "#F4F4F6",
  card:        "#FFFFFF",
  texto:       "#1A1A1A",
  textoSub:    "#444444",
  gris:        "#757575",
  grisClaro:   "#E5E5E5",
  grisBorde:   "#D4D4D8",
  verde:       "#2E7D32",
  verdeBg:     "#E8F5E9",
  azul:        "#1565C0",
  purpura:     "#6A1B9A",
  whatsapp:    "#25D366",
};

// ─── CATEGORÍAS DE ALERTA (mapa) ─────────────────────────────
// Un único lugar de verdad: usado por el mapa, formularios y leyenda
export const CATEGORIAS = {
  INCENDIO:        { label: "Incendio",               emoji: "🔥", color: "#C62828", markerColor: "#C62828" },
  MAQUINARIA:      { label: "Maquinaria en terreno",  emoji: "🚛", color: "#1565C0", markerColor: "#1565C0" },
  PERSONAL:        { label: "Personal voluntario",    emoji: "👷", color: "#2E7D32", markerColor: "#2E7D32" },
  ACOPIO:          { label: "Centro de acopio",       emoji: "📦", color: "#6A1B9A", markerColor: "#6A1B9A" },
  ALERTA_PERSONAL: { label: "Faltan personas",        emoji: "🆘", color: "#E65100", markerColor: "#E65100" },
  ALERTA_INSUMOS:  { label: "Faltan insumos",         emoji: "⚠️", color: "#F9A825", markerColor: "#F57F17" },
};

// ─── TIPO SOLICITUD (ofertas) ─────────────────────────────────
export const TIPO_LABEL = {
  BUSCO_MAQUINARIA: { label: "Busco Maquinaria", emoji: "🚛", color: "#1565C0" },
  BUSCO_OBREROS:    { label: "Busco Obreros",    emoji: "👷", color: "#6A1B9A" },
  OFREZCO_TRABAJO:  { label: "Ofrezco Trabajo",  emoji: "💼", color: "#2E7D32" },
};

// ─── CIUDADES VENEZUELA ───────────────────────────────────────
export const CIUDADES = [
  "Caracas, Miranda","Valencia, Carabobo","Maracaibo, Zulia",
  "Barquisimeto, Lara","Maracay, Aragua","Barcelona, Anzoátegui",
  "Maturín, Monagas","Cumaná, Sucre","Mérida, Mérida",
  "San Cristóbal, Táchira","Barinas, Barinas","Calabozo, Guárico",
  "Punto Fijo, Falcón","Coro, Falcón",
];

// ─── CENTROS APROXIMADOS POR CIUDAD (para centrar el mapa) ───
export const CIUDAD_COORDS = {
  "Valencia, Carabobo":    [10.1622, -67.9897],
  "Caracas, Miranda":      [10.4806, -66.9036],
  "Maracay, Aragua":       [10.2467, -67.5964],
  "Maracaibo, Zulia":      [10.6544, -71.6338],
  "Barquisimeto, Lara":    [10.0678, -69.3467],
  "Barcelona, Anzoátegui": [10.1353, -64.6861],
  "Maturín, Monagas":      [9.7458,  -63.1836],
  "Mérida, Mérida":        [8.5833,  -71.1333],
};

// ─── HELPER: WhatsApp ────────────────────────────────────────
export function abrirWhatsApp(telefono, nombre, contexto) {
  const num = telefono.replace(/\D/g, "");
  const msg = encodeURIComponent(
    `Hola ${nombre} 👋, vi tu anuncio en *Emergencia Logística* ` +
    `y estoy interesado/a en: *${contexto}*. ¿Podemos coordinar?`
  );
  window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
}

// ─── DATOS DEMO ───────────────────────────────────────────────
export const DEMO_ALERTAS = [
  { id:"a1", lat:10.1621, lng:-67.9894, categoria:"INCENDIO",        titulo:"Incendio sector norte",          descripcion:"Fuego activo en galpón industrial. Se necesitan extintores.",         ciudad_estado:"Valencia, Carabobo",  verificado:true,  fuente:"APP",     created_at: new Date().toISOString() },
  { id:"a2", lat:10.1700, lng:-68.0050, categoria:"MAQUINARIA",      titulo:"Retroexcavadora disponible",     descripcion:"Caterpillar 416F2 disponible para remoción de escombros.",            ciudad_estado:"Valencia, Carabobo",  verificado:false, fuente:"APP",     created_at: new Date().toISOString() },
  { id:"a3", lat:10.1550, lng:-67.9700, categoria:"PERSONAL",        titulo:"Brigada voluntaria activa",      descripcion:"12 voluntarios limpiando Av. Bolívar. Coordinador: Carlos +58414.",   ciudad_estado:"Valencia, Carabobo",  verificado:true,  fuente:"APP",     created_at: new Date().toISOString() },
  { id:"a4", lat:10.1800, lng:-67.9600, categoria:"ACOPIO",          titulo:"Centro de acopio Las Acacias",   descripcion:"Recibimos agua, comida y medicamentos. Abierto 7am–8pm.",             ciudad_estado:"Valencia, Carabobo",  verificado:true,  fuente:"APP",     created_at: new Date().toISOString() },
  { id:"a5", lat:10.1400, lng:-68.0200, categoria:"ALERTA_PERSONAL", titulo:"Urgente: faltan obreros",        descripcion:"Zona El Trigal necesita 8 personas para remoción hoy. Paga $20/día.", ciudad_estado:"Valencia, Carabobo",  verificado:false, fuente:"APP",     created_at: new Date().toISOString() },
  { id:"a6", lat:10.1900, lng:-67.9800, categoria:"ALERTA_INSUMOS",  titulo:"Sin agua potable",               descripcion:"Sector La Isabelica sin suministro. 200 familias afectadas.",         ciudad_estado:"Valencia, Carabobo",  verificado:false, fuente:"APP",     created_at: new Date().toISOString() },
  { id:"a7", lat:10.4806, lng:-66.9036, categoria:"INCENDIO",        titulo:"Incendio Petare",                descripcion:"Incendio en viviendas. Cuerpo de bomberos activo.",                   ciudad_estado:"Caracas, Miranda",    verificado:true,  fuente:"APP",     created_at: new Date().toISOString() },
  { id:"a8", lat:10.2467, lng:-67.5964, categoria:"ACOPIO",          titulo:"Acopio Cruz Roja Maracay",       descripcion:"Centro oficial. Aceptan ropa, agua y medicinas.",                     ciudad_estado:"Maracay, Aragua",     verificado:true,  fuente:"API",     created_at: new Date().toISOString() },
];

export const DEMO_EQUIPOS = [
  { id:"e1", tipo_equipo:"Camión Volteo",    descripcion_modelo:"Ford F-7000 · 7 m³",            precio_estimado:"$50 por viaje", ciudad_estado:"Valencia, Carabobo", disponible:true,  usuarios:{nombre_completo:"Carlos Medina",    telefono:"+58414123456"} },
  { id:"e2", tipo_equipo:"Retroexcavadora",  descripcion_modelo:"Caterpillar 416F2",              precio_estimado:"$120 por hora", ciudad_estado:"Valencia, Carabobo", disponible:true,  usuarios:{nombre_completo:"José Torrealba",   telefono:"+58424987654"} },
  { id:"e3", tipo_equipo:"Gandola Cava",     descripcion_modelo:"Mack CH613 · 20 toneladas",      precio_estimado:"A convenir",    ciudad_estado:"Maracay, Aragua",    disponible:true,  usuarios:{nombre_completo:"Rafael Blanco",    telefono:"+58416555333"} },
];

export const DEMO_OFERTAS = [
  { id:"o1", tipo_solicitud:"BUSCO_OBREROS",    descripcion:"Se necesitan 4 personas para remover escombros en Naguanagua. 2 días. Almuerzo incluido.", pago_ofrecido:"$20 el día", ciudad_estado:"Valencia, Carabobo", urgente:true,  personas_requeridas:4,    usuarios:{nombre_completo:"Pedro Ramos",        telefono:"+58249998888"} },
  { id:"o2", tipo_solicitud:"BUSCO_MAQUINARIA", descripcion:"Gandola para transportar materiales de construcción, ruta Valencia–Maracay.",               pago_ofrecido:"A convenir",  ciudad_estado:"Valencia, Carabobo", urgente:false, personas_requeridas:null, usuarios:{nombre_completo:"Constructora Andina", telefono:"+58212345678"} },
  { id:"o3", tipo_solicitud:"OFREZCO_TRABAJO",  descripcion:"5 puestos de trabajo limpiando escombros en Las Acacias. Pago diario.",                    pago_ofrecido:"$18 el día", ciudad_estado:"Maracay, Aragua",    urgente:true,  personas_requeridas:5,    usuarios:{nombre_completo:"ONG Reconstruye VE", telefono:"+58243111222"} },
];
