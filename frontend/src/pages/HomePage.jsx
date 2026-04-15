import { TIPO_LABELS, CATEGORIES } from "../utils/api";
import { OSCard } from "../components/OSComponents";

export default function HomePage({ ordens, loading, onTapOS, search, setSearch, category, setCategory, user }) {
  const filtered = ordens
    .filter((os) => {
      if (category === "all") return true;
      if (category === "impedimento") return os.status?.startsWith("impedimento");
      return os.status === category;
    })
    .filter((os) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (os.cidade || "").toLowerCase().includes(q) ||
        (os.cto || "").toLowerCase().includes(q) ||
        (TIPO_LABELS[os.tipo_servico || os.tipoServico] || "").toLowerCase().includes(q) ||
        String(os.id).includes(q) ||
        (os.cliente_nome || "").toLowerCase().includes(q)
      );
    });

  const disp = ordens.filter((o) => o.status === "disponivel").length;
  const exec = ordens.filter((o) => o.status === "em_execucao").length;

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg,#0C4A6E 0%,#0369A1 50%,#0EA5E9 100%)",
        padding: "16px 16px 20px", borderRadius: "0 0 24px 24px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "'DM Sans',sans-serif" }}>
              Olá, {user?.nome} 👋
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "'Space Mono',monospace", letterSpacing: -1 }}>
              Lampejo
            </div>
          </div>
          {loading && (
            <div style={{
              width: 24, height: 24, border: "3px solid rgba(255,255,255,0.3)",
              borderTopColor: "#fff", borderRadius: "50%", animation: "spin 1s linear infinite",
            }} />
          )}
        </div>

        {/* Search */}
        <div style={{ position: "relative" }}>
          <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cidade, CTO, cliente..."
            style={{
              width: "100%", padding: "12px 16px 12px 42px", borderRadius: 14, border: "none",
              background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 14,
              fontFamily: "'DM Sans',sans-serif", outline: "none",
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 8, padding: "16px 16px 0" }}>
        {[
          { label: "Total", value: ordens.length, color: "#6B7280" },
          { label: "Disponíveis", value: disp, color: "#0EA5E9" },
          { label: "Em Execução", value: exec, color: "#F59E0B" },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, background: "#fff", borderRadius: 14, padding: 12, textAlign: "center", border: "1px solid #F3F4F6" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color, fontFamily: "'Space Mono',monospace" }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div style={{ display: "flex", gap: 8, padding: "16px 16px 4px", overflowX: "auto" }}>
        {CATEGORIES.map((cat) => (
          <button key={cat.id} onClick={() => setCategory(cat.id)} style={{
            flexShrink: 0, padding: "8px 14px", borderRadius: 12, border: "none",
            background: category === cat.id ? "#0EA5E9" : "#fff",
            color: category === cat.id ? "#fff" : "#6B7280",
            fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 4, transition: "all .2s",
            boxShadow: category === cat.id ? "0 2px 8px rgba(14,165,233,0.3)" : "0 1px 3px rgba(0,0,0,0.05)",
          }}>
            <span>{cat.icon}</span>{cat.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ padding: "12px 16px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: "#111827", fontFamily: "'DM Sans',sans-serif" }}>Ordens de Serviço</span>
          <span style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "'DM Sans',sans-serif" }}>
            {filtered.length} encontrada{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading && ordens.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ width: 32, height: 32, border: "3px solid #E5E7EB", borderTopColor: "#0EA5E9", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 13, color: "#9CA3AF", fontFamily: "'DM Sans',sans-serif" }}>Carregando...</div>
          </div>
        )}

        {filtered.map((os, i) => (
          <OSCard key={os.id} os={os} onTap={onTapOS} delay={i * 80} user={user} />
        ))}

        {filtered.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#6B7280", fontFamily: "'DM Sans',sans-serif" }}>Nenhuma OS encontrada</div>
          </div>
        )}
      </div>
    </div>
  );
}
