import { useState } from "react";
import { C, CIUDADES } from "../lib/constants.js";
import { Btn, Input, Alert } from "../components/UI.jsx";

const ROLES = [
  { value: "CLIENTE",       label: "🏗️ Cliente — Necesito maquinaria u obreros" },
  { value: "TRANSPORTISTA", label: "🚛 Transportista — Tengo vehículos / maquinaria" },
  { value: "OBRERO",        label: "👷 Obrero — Busco trabajo o lo ofrezco" },
];

export default function AuthScreen({ onLogin, onDemoLogin }) {
  const [tab,    setTab]    = useState("login");
  const [email,  setEmail]  = useState("");
  const [pass,   setPass]   = useState("");
  const [nombre, setNombre] = useState("");
  const [tel,    setTel]    = useState("+58");
  const [ciudad, setCiudad] = useState("");
  const [rol,    setRol]    = useState("CLIENTE");
  const [error,  setError]  = useState("");
  const [busy,   setBusy]   = useState(false);

  async function handleLogin() {
    if (!email || !pass) { setError("Completa todos los campos."); return; }
    setBusy(true); setError("");
    try { await onLogin(email, pass); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function handleRegister() {
    if (!nombre || !tel || !ciudad || !email || !pass) {
      setError("Todos los campos son obligatorios."); return;
    }
    if (pass.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    setBusy(true); setError("");
    try {
      await onLogin(email, pass, { nombre, tel, ciudad, rol });
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(150deg, ${C.rojo} 0%, #880E4F 55%, #4A148C 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px 16px",
    }}>
      <div style={{
        background: "#fff", borderRadius: 22, padding: "28px 26px",
        width: "100%", maxWidth: 390,
        boxShadow: "0 24px 60px rgba(0,0,0,0.30)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontSize: 48, lineHeight: 1 }}>🚨</div>
          <div style={{ fontWeight: 900, fontSize: 21, color: C.rojo, marginTop: 8, letterSpacing: -0.5 }}>
            Emergencia Logística
          </div>
          <div style={{ fontSize: 12, color: C.gris, marginTop: 3 }}>
            Venezuela · Reactivación Post-Emergencia
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", borderRadius: 11, overflow: "hidden",
          border: `1.5px solid ${C.grisClaro}`, marginBottom: 22,
        }}>
          {["login", "registro"].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); }}
              style={{
                flex: 1, padding: "10px 0", border: "none", cursor: "pointer",
                fontWeight: 700, fontSize: 13, fontFamily: "inherit",
                background: tab === t ? C.rojo : "#fff",
                color: tab === t ? "#fff" : C.gris,
                transition: "background 0.2s",
              }}
            >
              {t === "login" ? "Ingresar" : "Registrarse"}
            </button>
          ))}
        </div>

        {error && <Alert type="error" message={error} />}

        {tab === "login" ? (
          <>
            <Input label="Correo electrónico" value={email} onChange={setEmail} type="email" placeholder="tu@email.com" required />
            <Input label="Contraseña" value={pass} onChange={setPass} type="password" placeholder="••••••••" required />
            <Btn onClick={handleLogin} disabled={busy} style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
              {busy ? "Ingresando..." : "Entrar →"}
            </Btn>
          </>
        ) : (
          <>
            <Input label="Nombre completo" value={nombre} onChange={setNombre} placeholder="Ej: Carlos Medina" required />
            <Input label="Teléfono" value={tel} onChange={setTel} type="tel" placeholder="+58414XXXXXXX" required />
            <Input
              label="Ciudad y Estado" value={ciudad} onChange={setCiudad}
              placeholder="Valencia, Carabobo" list="ciudades-list" required
            />
            <datalist id="ciudades-list">
              {CIUDADES.map(c => <option key={c} value={c} />)}
            </datalist>
            <Input label="¿Quién eres?" value={rol} onChange={setRol} options={ROLES} required />
            <Input label="Correo electrónico" value={email} onChange={setEmail} type="email" placeholder="tu@email.com" required />
            <Input label="Contraseña (mín. 6 caracteres)" value={pass} onChange={setPass} type="password" placeholder="••••••••" required />
            <Btn onClick={handleRegister} disabled={busy} style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
              {busy ? "Creando cuenta..." : "Crear cuenta →"}
            </Btn>
          </>
        )}

        {/* Demo bypass */}
        <div style={{ marginTop: 18, textAlign: "center" }}>
          <button
            onClick={onDemoLogin}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 12, color: C.gris, textDecoration: "underline",
              fontFamily: "inherit",
            }}
          >
            Explorar sin cuenta (modo demo)
          </button>
        </div>
      </div>
    </div>
  );
}
