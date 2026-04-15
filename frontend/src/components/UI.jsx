import { useEffect } from "react";

// ─── Toast ─────────────────────────────────────────────────
export function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
      background: type === "success" ? "#10B981" : "#EF4444",
      color: "#fff", padding: "12px 24px", borderRadius: 14, fontSize: 13,
      fontWeight: 600, fontFamily: "'DM Sans',sans-serif", zIndex: 999,
      boxShadow: "0 8px 24px rgba(0,0,0,0.2)", animation: "slideDown .3s ease",
      maxWidth: 360, textAlign: "center",
    }}>
      {message}
    </div>
  );
}

// ─── Success Modal ─────────────────────────────────────────
export function SuccessModal({ message, sub, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, backdropFilter: "blur(4px)",
    }}>
      <div style={{
        background: "#fff", borderRadius: 24, padding: 32, textAlign: "center",
        maxWidth: 340, width: "100%", animation: "popIn .3s ease",
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "linear-gradient(135deg,#10B981,#059669)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          marginBottom: 16,
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: "0 0 8px", fontFamily: "'DM Sans',sans-serif" }}>{message}</h3>
        <p style={{ fontSize: 12, color: "#9CA3AF", margin: "0 0 24px", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.6 }}>{sub}</p>
        <button onClick={onClose} style={{
          width: "100%", padding: 14, background: "#111827", color: "#fff",
          border: "none", borderRadius: 14, fontSize: 14, fontWeight: 700,
          fontFamily: "'DM Sans',sans-serif", cursor: "pointer",
        }}>
          OK
        </button>
      </div>
    </div>
  );
}

// ─── Bottom Navigation ─────────────────────────────────────
export function BottomNav({ active, onNavigate, jobCount, userType }) {
  const mapIcon = (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? "#0EA5E9" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );

  const homeIcon = (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? "#0EA5E9" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );

  const jobsIcon = (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? "#0EA5E9" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );

  const profileIcon = (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? "#0EA5E9" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );

  const addIcon = (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? "#0EA5E9" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );

  const tecItems = [
    { id: "home", label: "Início", icon: homeIcon },
    { id: "mapa", label: "Mapa", icon: mapIcon },
    { id: "myjobs", label: "Meus Jobs", icon: jobsIcon, badge: jobCount },
    { id: "profile", label: "Perfil", icon: profileIcon },
  ];

  const empItems = [
    { id: "home", label: "OS", icon: homeIcon },
    { id: "mapa", label: "Mapa", icon: mapIcon },
    { id: "criar", label: "Nova OS", icon: addIcon },
    { id: "profile", label: "Perfil", icon: profileIcon },
  ];

  const items = userType === "empresa" ? empItems : tecItems;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 480, background: "#fff", borderTop: "1px solid #E5E7EB",
      display: "flex", justifyContent: "space-around", padding: "8px 0 12px", zIndex: 100,
    }}>
      {items.map((item) => (
        <button key={item.id} onClick={() => onNavigate(item.id)} style={{
          background: "none", border: "none", display: "flex", flexDirection: "column",
          alignItems: "center", gap: 3, cursor: "pointer", padding: "4px 12px", position: "relative",
        }}>
          {item.icon(active === item.id)}
          {item.badge > 0 && (
            <div style={{
              position: "absolute", top: -2, right: 4, width: 16, height: 16,
              borderRadius: "50%", background: "#EF4444", fontSize: 9, color: "#fff",
              fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {item.badge}
            </div>
          )}
          <span style={{
            fontSize: 10, fontWeight: active === item.id ? 700 : 500,
            color: active === item.id ? "#0EA5E9" : "#9CA3AF",
            fontFamily: "'DM Sans',sans-serif",
          }}>
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}
