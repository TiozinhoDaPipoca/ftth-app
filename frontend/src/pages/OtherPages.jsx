import { useState, useEffect, useRef } from "react";
import { api, TIPO_LABELS, TIPO_ICONS, STATUS_LABELS, STATUS_COLORS } from "../utils/api";

// ─── My Jobs Page ──────────────────────────────────────────
export function MyJobsPage({ ordens, user }) {
  const my = ordens.filter((os) => os.tecnico_id === user?.id);
  const groups = [
    { title: "⏳ Em Execução", items: my.filter((o) => o.status === "em_execucao") },
    { title: "✅ Executadas", items: my.filter((o) => o.status === "executada") },
    { title: "🚫 Impedimentos", items: my.filter((o) => o.status?.startsWith("impedimento")) },
  ];

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: "20px 0 16px", fontFamily: "'DM Sans',sans-serif" }}>Meus Jobs</h2>
      {my.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#374151", fontFamily: "'DM Sans',sans-serif", marginBottom: 4 }}>Nenhum job ainda</div>
          <div style={{ fontSize: 13, color: "#9CA3AF", fontFamily: "'DM Sans',sans-serif" }}>Pegue OS na página inicial</div>
        </div>
      ) : (
        groups.map((g, gi) => (
          <div key={gi} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#374151", fontFamily: "'DM Sans',sans-serif", marginBottom: 8 }}>
              {g.title} ({g.items.length})
            </div>
            {g.items.length === 0 ? (
              <div style={{ fontSize: 12, color: "#D1D5DB", fontStyle: "italic", fontFamily: "'DM Sans',sans-serif", padding: "4px 0" }}>Nenhuma</div>
            ) : (
              g.items.map((os) => {
                const sc = STATUS_COLORS[os.status] || STATUS_COLORS.disponivel;
                const val = os.valor_liquido || os.valorPagamento;
                const tipoServico = os.tipo_servico || os.tipoServico;
                return (
                  <div key={os.id} style={{ background: "#fff", borderRadius: 14, padding: 14, marginBottom: 8, border: "1px solid #F3F4F6" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#111827", fontFamily: "'DM Sans',sans-serif" }}>
                        {TIPO_ICONS[os.tipo]} {TIPO_LABELS[tipoServico] || tipoServico}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: sc.color, background: sc.bg, padding: "3px 8px", borderRadius: 20, fontFamily: "'DM Sans',sans-serif" }}>
                        {STATUS_LABELS[os.status]}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "'DM Sans',sans-serif" }}>
                      OS #{os.id} · {os.cidade} · CTO {os.cto || "—"}
                    </div>
                    {val != null && (
                      <div style={{ marginTop: 8, fontSize: 17, fontWeight: 800, color: "#111827", fontFamily: "'Space Mono',monospace" }}>
                        R$ {Number(val).toFixed(2)}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ─── Criar OS Page (Empresa) ───────────────────────────────
export function CriarOSPage({ onCreated, setToast }) {
  const [form, setForm] = useState({
    cliente_cpf: "", cliente_nome: "", cliente_telefone: "",
    cidade: "", endereco: "", tipo: "instalacao", tipo_servico: "instalacao",
    cto: "", observacao: "",
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const inputStyle = {
    width: "100%", padding: "14px 16px", borderRadius: 14, border: "1px solid #E5E7EB",
    fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: "none",
    background: "#F9FAFB", color: "#111827",
  };

  const handleCreate = async () => {
    if (!form.cidade || !form.tipo) {
      setToast({ message: "Cidade e tipo são obrigatórios", type: "error" });
      return;
    }
    setLoading(true);
    const res = await api("/os", { method: "POST", body: JSON.stringify(form) });
    if (res.ok) {
      onCreated();
      setToast({ message: "OS criada com sucesso!", type: "success" });
      setForm({ cliente_cpf: "", cliente_nome: "", cliente_telefone: "", cidade: "", endereco: "", tipo: "instalacao", tipo_servico: "instalacao", cto: "", observacao: "" });
    } else {
      setToast({ message: res.error, type: "error" });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: "20px 0 16px", fontFamily: "'DM Sans',sans-serif" }}>Nova Ordem de Serviço</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input placeholder="Nome do cliente" value={form.cliente_nome} onChange={(e) => set("cliente_nome", e.target.value)} style={inputStyle} />
        <input placeholder="CPF do cliente" value={form.cliente_cpf} onChange={(e) => set("cliente_cpf", e.target.value)} style={inputStyle} />
        <input placeholder="Telefone do cliente" value={form.cliente_telefone} onChange={(e) => set("cliente_telefone", e.target.value)} style={inputStyle} />
        <input placeholder="Cidade *" value={form.cidade} onChange={(e) => set("cidade", e.target.value)} style={inputStyle} />
        <input placeholder="Endereço" value={form.endereco} onChange={(e) => set("endereco", e.target.value)} style={inputStyle} />
        <select value={form.tipo} onChange={(e) => { set("tipo", e.target.value); set("tipo_servico", e.target.value); }} style={{ ...inputStyle, appearance: "auto" }}>
          <option value="instalacao">Instalação</option>
          <option value="reparo">Reparo</option>
        </select>
        <select value={form.tipo_servico} onChange={(e) => set("tipo_servico", e.target.value)} style={{ ...inputStyle, appearance: "auto" }}>
          <option value="instalacao">Instalação</option>
          <option value="reparo_sem_conexao">Reparo - Sem Conexão</option>
          <option value="reparo_lentidao">Reparo - Lentidão</option>
          <option value="reparo_intermitente">Reparo - Intermitente</option>
          <option value="migracao">Migração</option>
        </select>
        <input placeholder="CTO (ex: F09-C01)" value={form.cto} onChange={(e) => set("cto", e.target.value)} style={inputStyle} />
        <textarea placeholder="Observações" value={form.observacao} onChange={(e) => set("observacao", e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} />
        <button onClick={handleCreate} disabled={loading} style={{
          width: "100%", padding: 16,
          background: loading ? "#9CA3AF" : "linear-gradient(135deg,#0EA5E9,#06B6D4)",
          color: "#fff", border: "none", borderRadius: 16, fontSize: 16, fontWeight: 700,
          fontFamily: "'DM Sans',sans-serif", cursor: loading ? "wait" : "pointer",
          boxShadow: "0 4px 16px rgba(14,165,233,0.4)",
        }}>
          {loading ? "Criando..." : "Criar OS"}
        </button>
      </div>
    </div>
  );
}

// ─── Stats Page ────────────────────────────────────────────
export function StatsPage({ ordens, user }) {
  const [stats, setStats] = useState(null);
  const [indicadores, setIndicadores] = useState(null);
  const [ld, setLd] = useState(true);

  useEffect(() => {
    (async () => {
      setLd(true);
      const [s, ind] = await Promise.all([
        user?.tipo === "tecnico" ? api(`/os/estatisticas/tecnico/${user.id}`) : Promise.resolve({ ok: false }),
        api("/indicadores"),
      ]);
      if (s.ok) setStats(s.data);
      if (ind.ok) setIndicadores(ind.data);
      setLd(false);
    })();
  }, [ordens, user]);

  const ganho = ordens
    .filter((os) => os.tecnico_id === user?.id && (os.valor_liquido || os.valorPagamento) != null)
    .reduce((s, os) => s + Number(os.valor_liquido || os.valorPagamento || 0), 0);

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: "20px 0 16px", fontFamily: "'DM Sans',sans-serif" }}>Indicadores</h2>

      {user?.tipo === "tecnico" && (
        <div style={{ background: "linear-gradient(135deg,#0C4A6E,#0369A1)", borderRadius: 20, padding: 24, marginBottom: 20, color: "#fff" }}>
          <div style={{ fontSize: 12, opacity: 0.8, fontFamily: "'DM Sans',sans-serif", marginBottom: 4 }}>Ganho total</div>
          <div style={{ fontSize: 36, fontWeight: 800, fontFamily: "'Space Mono',monospace" }}>R$ {ganho.toFixed(2)}</div>
        </div>
      )}

      {ld ? (
        <div style={{ textAlign: "center", padding: 30 }}>
          <div style={{ width: 28, height: 28, border: "3px solid #E5E7EB", borderTopColor: "#0EA5E9", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 10px" }} />
        </div>
      ) : stats && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 20, border: "1px solid #F3F4F6" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#374151", fontFamily: "'DM Sans',sans-serif", marginBottom: 12 }}>Suas Estatísticas</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Total OS", value: stats.totalOS, color: "#6B7280" },
              { label: "Executadas", value: stats.executadas, color: "#10B981" },
              { label: "Taxa Sucesso", value: stats.taxaSucesso, color: "#0EA5E9" },
              { label: "Impedimentos", value: stats.impedidas, color: "#EF4444" },
            ].map((s, i) => (
              <div key={i} style={{ background: "#F9FAFB", borderRadius: 12, padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color, fontFamily: "'Space Mono',monospace" }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {indicadores && indicadores.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 16, border: "1px solid #F3F4F6" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#374151", fontFamily: "'DM Sans',sans-serif", marginBottom: 12 }}>Ranking Técnicos</div>
          {indicadores.map((t, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < indicadores.length - 1 ? "1px solid #F3F4F6" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: t.tecnico === user?.nome ? "#F0F9FF" : "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: t.tecnico === user?.nome ? "#0EA5E9" : "#9CA3AF", fontFamily: "'Space Mono',monospace" }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", fontFamily: "'DM Sans',sans-serif" }}>
                    {t.tecnico} {t.tecnico === user?.nome && "⭐"}
                  </div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "'DM Sans',sans-serif" }}>
                    {t.executadas}/{t.totalOS} executadas
                  </div>
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: parseFloat(t.percentualImpedimento) > 30 ? "#EF4444" : "#10B981", fontFamily: "'Space Mono',monospace" }}>
                {t.percentualImpedimento}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Profile Page ──────────────────────────────────────────
export function ProfilePage({ user, onLogout }) {
  const menuItems = user?.tipo === "empresa"
    ? ["Dados da empresa", "Tabela de preços", "Configurar IXC", "Técnicos", "Configurações"]
    : ["Dados pessoais", "Certificações", "Equipamentos", "Área de atuação", "Configurações"];

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <div style={{ textAlign: "center", padding: "30px 0 20px" }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "linear-gradient(135deg,#0EA5E9,#06B6D4)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, fontWeight: 800, color: "#fff",
          fontFamily: "'Space Mono',monospace", marginBottom: 12,
        }}>
          {user?.nome?.charAt(0) || "?"}
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#111827", fontFamily: "'DM Sans',sans-serif" }}>{user?.nome}</div>
        <div style={{ fontSize: 13, color: "#6B7280", fontFamily: "'DM Sans',sans-serif" }}>
          {user?.tipo === "empresa" ? "Empresa" : "Técnico FTTH"} · {user?.cidade || ""}
        </div>
        <div style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "'DM Sans',sans-serif", marginTop: 4 }}>{user?.email}</div>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: "1px solid #F3F4F6" }}>
        {menuItems.map((item, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 16px", borderBottom: i < menuItems.length - 1 ? "1px solid #F3F4F6" : "none", cursor: "pointer",
          }}>
            <span style={{ fontSize: 14, color: "#374151", fontFamily: "'DM Sans',sans-serif" }}>{item}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
          </div>
        ))}
      </div>

      <button onClick={onLogout} style={{
        width: "100%", padding: 14, marginTop: 16, background: "none",
        border: "2px solid #EF4444", borderRadius: 16, color: "#EF4444",
        fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", cursor: "pointer",
      }}>
        Sair da conta
      </button>
    </div>
  );
}

// ─── Map Page ──────────────────────────────────────────────
export function MapPage({ ordens, user }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [filter, setFilter] = useState("all");
  const [leafletReady, setLeafletReady] = useState(false);

  useEffect(() => {
    if (window.L) { setLeafletReady(true); return; }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLeafletReady(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!leafletReady || !mapRef.current || mapInstanceRef.current) return;
    const L = window.L;
    const map = L.map(mapRef.current, { zoomControl: false }).setView([-22.6569, -43.3707], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap", maxZoom: 19 }).addTo(map);
    L.control.zoom({ position: "topright" }).addTo(map);
    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, [leafletReady]);

  useEffect(() => {
    if (!mapInstanceRef.current || !leafletReady) return;
    const L = window.L;
    const map = mapInstanceRef.current;
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    const colors = { disponivel: "#0EA5E9", em_execucao: "#F59E0B", executada: "#10B981", impedimento_cto_cheia: "#EF4444", impedimento_cliente_ausente: "#EF4444" };
    const bounds = [];

    const filtered = ordens
      .filter((os) => os.latitude && os.longitude)
      .filter((os) => {
        if (filter === "all") return true;
        if (filter === "disponivel") return os.status === "disponivel";
        if (filter === "meus") return os.tecnico_id === user?.id;
        return true;
      });

    filtered.forEach((os) => {
      const lat = Number(os.latitude), lng = Number(os.longitude);
      if (isNaN(lat) || isNaN(lng)) return;
      const color = colors[os.status] || "#6B7280";
      const icon = L.divIcon({ className: "os-marker", html: `<div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;background:${color};box-shadow:0 2px 8px rgba(0,0,0,0.3);border:3px solid #fff;cursor:pointer">${TIPO_ICONS[os.tipo] || "📄"}</div>`, iconSize: [32, 32], iconAnchor: [16, 16] });
      const tipoServico = os.tipo_servico || os.tipoServico;
      const val = os.valor_liquido || os.valorPagamento;
      const popup = L.popup({ offset: [0, -10] }).setContent(`<div style="padding:10px;font-family:'DM Sans',sans-serif"><b>${TIPO_LABELS[tipoServico] || tipoServico}</b><br/><span style="color:#9CA3AF">OS #${os.id} · CTO ${os.cto || "—"}</span><br/>📍 ${os.cidade}${os.cliente_nome ? "<br/>👤 " + os.cliente_nome : ""}${val ? "<br/><b>R$ " + Number(val).toFixed(0) + "</b>" : ""}</div>`);
      const marker = L.marker([lat, lng], { icon }).addTo(map).bindPopup(popup);
      markersRef.current.push(marker);
      bounds.push([lat, lng]);
    });

    if (bounds.length > 0) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [ordens, filter, leafletReady, user]);

  const withCoords = ordens.filter((os) => os.latitude && os.longitude);

  return (
    <div style={{ position: "relative", height: "calc(100vh - 60px)", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 12, left: 12, right: 12, zIndex: 10, display: "flex", gap: 6 }}>
        {[
          { id: "all", label: `Todas (${withCoords.length})` },
          { id: "disponivel", label: `Disponíveis (${withCoords.filter((o) => o.status === "disponivel").length})` },
          ...(user?.tipo === "tecnico" ? [{ id: "meus", label: `Meus (${withCoords.filter((o) => o.tecnico_id === user?.id).length})` }] : []),
        ].map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: "8px 12px", borderRadius: 12, border: "none",
            background: filter === f.id ? "#0EA5E9" : "#fff",
            color: filter === f.id ? "#fff" : "#6B7280",
            fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans',sans-serif",
            cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", whiteSpace: "nowrap",
          }}>
            {f.label}
          </button>
        ))}
      </div>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
