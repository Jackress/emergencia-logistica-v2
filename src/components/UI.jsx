import { C } from "../lib/constants.js";

// ─── BADGE ────────────────────────────────────────────────────
export function Badge({ label, color, bg, style = {} }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: "3px 9px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: 0.4,
      color: color || "#fff", background: bg || C.rojo,
      whiteSpace: "nowrap",
      ...style,
    }}>
      {label}
    </span>
  );
}

// ─── BUTTON ──────────────────────────────────────────────────
export function Btn({ children, onClick, variant = "primary", small, disabled, style = {}, type = "button" }) {
  const base = {
    border: "none", borderRadius: 10, cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 700, transition: "transform 0.1s, opacity 0.15s",
    opacity: disabled ? 0.55 : 1,
    fontSize: small ? 13 : 15,
    padding: small ? "7px 14px" : "12px 22px",
    display: "inline-flex", alignItems: "center", gap: 6,
    lineHeight: 1,
  };
  const variants = {
    primary:   { background: C.rojo,        color: "#fff" },
    secondary: { background: C.naranja,     color: "#fff" },
    ghost:     { background: C.grisClaro,   color: C.texto },
    outline:   { background: "transparent", color: C.rojo, border: `2px solid ${C.rojo}` },
    whatsapp:  { background: C.whatsapp,    color: "#fff" },
    danger:    { background: "#b71c1c",      color: "#fff" },
  };
  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = "scale(0.96)"; }}
      onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      {children}
    </button>
  );
}

// ─── CARD ────────────────────────────────────────────────────
export function Card({ children, style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: C.card, borderRadius: 16, padding: "16px 18px",
        boxShadow: "0 1px 6px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)",
        marginBottom: 12,
        cursor: onClick ? "pointer" : "default",
        transition: onClick ? "box-shadow 0.15s" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── INPUT ───────────────────────────────────────────────────
export function Input({ label, value, onChange, type = "text", options, placeholder, required, min, list }) {
  const fieldStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 9,
    border: `1.5px solid ${C.grisBorde}`, fontSize: 14,
    outline: "none", background: "#fafafa", marginTop: 4,
    boxSizing: "border-box", color: C.texto,
    transition: "border-color 0.15s",
  };
  const focusStyle = { borderColor: C.rojo };

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: C.gris }}>
        {label}{required && <span style={{ color: C.rojo }}> *</span>}
      </label>
      {options ? (
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={fieldStyle}
          onFocus={e => Object.assign(e.target.style, focusStyle)}
          onBlur={e => { e.target.style.borderColor = C.grisBorde; }}
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <>
          <input
            type={type} value={value} placeholder={placeholder}
            onChange={e => onChange(e.target.value)}
            style={fieldStyle} min={min} list={list}
            onFocus={e => Object.assign(e.target.style, focusStyle)}
            onBlur={e => { e.target.style.borderColor = C.grisBorde; }}
          />
          {list && <datalist id={list} />}
        </>
      )}
    </div>
  );
}

// ─── TEXTAREA ────────────────────────────────────────────────
export function Textarea({ label, value, onChange, placeholder, required, rows = 4 }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: C.gris }}>
        {label}{required && <span style={{ color: C.rojo }}> *</span>}
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{
          width: "100%", padding: "10px 12px", borderRadius: 9,
          border: `1.5px solid ${C.grisBorde}`, fontSize: 14,
          outline: "none", resize: "vertical", fontFamily: "inherit",
          marginTop: 4, boxSizing: "border-box", background: "#fafafa",
          color: C.texto, lineHeight: 1.55,
        }}
        onFocus={e => { e.target.style.borderColor = C.rojo; }}
        onBlur={e => { e.target.style.borderColor = C.grisBorde; }}
      />
    </div>
  );
}

// ─── SPINNER ────────────────────────────────────────────────
export function Spinner({ size = 28, color = C.rojo }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        border: `3px solid ${color}22`,
        borderTopColor: color,
        animation: "spin 0.7s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────
export function Empty({ emoji, title, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px", color: C.gris }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>{emoji}</div>
      <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6, color: C.textoSub }}>{title}</div>
      {sub && <div style={{ fontSize: 13 }}>{sub}</div>}
    </div>
  );
}

// ─── ALERT ───────────────────────────────────────────────────
export function Alert({ type = "error", message }) {
  const styles = {
    error:   { bg: "#FFEBEE", color: C.rojo,   icon: "⚠️" },
    success: { bg: "#E8F5E9", color: C.verde,  icon: "✅" },
    info:    { bg: "#E3F2FD", color: "#1565C0", icon: "ℹ️" },
  };
  const s = styles[type];
  return (
    <div style={{
      background: s.bg, color: s.color, borderRadius: 10,
      padding: "10px 14px", fontSize: 13, marginBottom: 14,
      display: "flex", alignItems: "center", gap: 8, fontWeight: 500,
    }}>
      <span>{s.icon}</span>
      <span>{message}</span>
    </div>
  );
}

// ─── DEMO BANNER ─────────────────────────────────────────────
export function DemoBanner() {
  return (
    <div style={{
      background: "#FFF8E1", borderBottom: "1px solid #FFE082",
      padding: "8px 16px", fontSize: 12, color: "#5D4037", textAlign: "center",
    }}>
      🛠️ <strong>Modo Demo</strong> — Datos de prueba. Configura Supabase en <code>.env.local</code> para activar el backend.
    </div>
  );
}
