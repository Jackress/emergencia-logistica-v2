import { useState, Suspense, lazy } from "react";
import { C } from "./lib/constants.js";
import { useAuth } from "./hooks/useData.js";
import AuthScreen from "./screens/AuthScreen.jsx";
import HomeScreen from "./screens/HomeScreen.jsx";
import MapaScreen from "./screens/MapaScreen.jsx";
import { Spinner, DemoBanner } from "./components/UI.jsx";

// Carga diferida de pantallas pesadas
const CatalogoScreen = lazy(() => import("./screens/CatalogoScreen.jsx"));
const OfertasScreen  = lazy(() => import("./screens/OfertasScreen.jsx"));
const PublicarScreen = lazy(() => import("./screens/PublicarScreen.jsx"));

const DEMO_USER = {
  id: "demo",
  nombre_completo: "Visitante",
  rol: "COLABORADOR",
  ciudad_estado: "Valencia, Carabobo",
  telefono: "+58414000000",
};

export default function App() {
  const { session, perfil, loading, isConfigured, login, registro, logout } = useAuth();
  // El mapa es la pantalla inicial — accesible sin login
  const [screen,   setScreen]   = useState("mapa");
  const [demoMode, setDemoMode] = useState(false);

  if (loading) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Spinner size={40} />
      </div>
    );
  }

  // Usuario activo: autenticado real, demo, o anónimo en el mapa
  const usuario = demoMode ? DEMO_USER : perfil;
  const esAnonimo = !usuario; // puede ver el mapa pero no publicar

  // Pantallas accesibles sin login
  const PANTALLAS_PUBLICAS = ["mapa"];

  async function handleLogin(email, pass, regData) {
    if (!isConfigured) { setDemoMode(true); setScreen("home"); return; }
    if (regData) {
      await registro({
        email, password: pass,
        nombreCompleto: regData.nombre,
        telefono: regData.tel,
        ciudadEstado: regData.ciudad,
        rol: regData.rol,
      });
    } else {
      await login(email, pass);
    }
    setScreen("home");
  }

  function handleLogout() {
    if (demoMode) { setDemoMode(false); setScreen("mapa"); return; }
    logout();
    setScreen("mapa");
  }

  // Si intenta ir a pantalla privada sin sesión → mostrar auth
  function navegar(destino) {
    if (!usuario && !PANTALLAS_PUBLICAS.includes(destino)) {
      setScreen("__auth__");
    } else {
      setScreen(destino);
    }
  }

  // Pantalla de auth explícita
  if (screen === "__auth__") {
    return (
      <AuthScreen
        onLogin={handleLogin}
        onDemoLogin={() => { setDemoMode(true); setScreen("home"); }}
      />
    );
  }

  // ── Tabs dinámicos según estado de sesión ──────────────────
  const tabs = [
    { id: "mapa",    icon: "🗺️", label: "Mapa"    },
    ...(usuario ? [{ id: "home", icon: "🏠", label: "Inicio" }] : []),
    ...(usuario?.rol === "COLABORADOR"
      ? [{ id: "catalogo", icon: "🚛", label: "Maquinaria" }]
      : []),
    ...(usuario
      ? [{
          id: "ofertas",
          icon: "📋",
          label: usuario.rol === "OBRERO"       ? "Empleos"
               : usuario.rol === "TRANSPORTISTA" ? "Pedidos"
               : "Ofertas",
        }]
      : []),
    { id: "publicar", icon: "➕", label: usuario ? "Publicar" : "Publicar" },
  ];

  const ciudadUsuario = usuario?.ciudad_estado;

  return (
    <div style={{
      minHeight:"100vh", background: C.bg,
      maxWidth:430, margin:"0 auto",
      position:"relative", paddingBottom:70,
      fontFamily:"'Inter',sans-serif",
    }}>
      {(!isConfigured || demoMode) && <DemoBanner />}

      {/* AppBar */}
      <div style={{
        background:`linear-gradient(120deg, ${C.rojo} 0%, #880E4F 100%)`,
        color:"#fff", padding:"13px 18px",
        display:"flex", justifyContent:"space-between", alignItems:"center",
        position:"sticky", top:0, zIndex:200,
        boxShadow:"0 2px 14px rgba(0,0,0,0.22)",
      }}>
        <div style={{ cursor:"pointer" }} onClick={() => setScreen("mapa")}>
          <div style={{ fontWeight:900, fontSize:16, letterSpacing:-0.3 }}>
            🚨 Emergencia Logística
          </div>
          <div style={{ fontSize:11, opacity:0.75, marginTop:1 }}>
            {usuario ? `${usuario.nombre_completo} · ${usuario.rol}` : "Red abierta · Acceso libre"}
          </div>
        </div>
        {usuario ? (
          <button onClick={handleLogout} style={{
            background:"rgba(255,255,255,0.18)", border:"none",
            color:"#fff", borderRadius:8, padding:"6px 12px",
            fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
          }}>
            {demoMode ? "← Demo" : "Salir"}
          </button>
        ) : (
          <button onClick={() => setScreen("__auth__")} style={{
            background:"rgba(255,255,255,0.25)", border:"none",
            color:"#fff", borderRadius:8, padding:"6px 12px",
            fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
          }}>
            Ingresar
          </button>
        )}
      </div>

      {/* Contenido */}
      <Suspense fallback={<Spinner />}>
        {screen === "mapa"     && <MapaScreen    ciudadUsuario={ciudadUsuario} />}
        {screen === "home"     && <HomeScreen    usuario={usuario} onNav={navegar} />}
        {screen === "catalogo" && <CatalogoScreen ciudadUsuario={ciudadUsuario} />}
        {screen === "ofertas"  && <OfertasScreen  rolUsuario={usuario?.rol} ciudadUsuario={ciudadUsuario} />}
        {screen === "publicar" && <PublicarScreen  onPublicado={() => setScreen("mapa")} />}
      </Suspense>

      {/* Bottom Nav */}
      <nav style={{
        position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
        width:"100%", maxWidth:430,
        background:"#fff", borderTop:`1px solid ${C.grisClaro}`,
        display:"flex", boxShadow:"0 -2px 14px rgba(0,0,0,0.07)",
        zIndex:200,
      }}>
        {tabs.map(t => (
          <button key={t.id + t.label} onClick={() => navegar(t.id)}
            style={{
              flex:1, padding:"9px 0 7px", border:"none",
              cursor:"pointer", background:"transparent",
              borderTop: screen === t.id ? `3px solid ${C.rojo}` : "3px solid transparent",
              fontFamily:"inherit",
            }}>
            <div style={{ fontSize:22 }}>{t.icon}</div>
            <div style={{
              fontSize:10, fontWeight:700, marginTop:1,
              color: screen === t.id ? C.rojo : C.gris,
            }}>
              {t.label}
            </div>
          </button>
        ))}
      </nav>
    </div>
  );
}
