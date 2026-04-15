import { useState, useEffect } from "react";
import { TIPO_LABELS, STATUS_LABELS, STATUS_COLORS, TIPO_ICONS } from "../utils/api";

// ─── OS Card ───────────────────────────────────────────────
export function OSCard({ os, onTap, delay = 0, user }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const sc = STATUS_COLORS[os.status] || STATUS_COLORS.disponivel;
  const valor = os.valor_liquido || os.valorPagamento;
  const tipoServico = os.tipo_servico || os.tipoServico;

  return (
    <div onClick={() => onTap(os)} style={{
      background: "#fff", borderRadius: 16, padding: 16, marginBottom: 12,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
      cursor: "pointer", border: "1px solid #F3F4F6",
      transition: "opacity .5s ease, transform .5s ease",
      opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 13, background: "#F0F9FF",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>
            {TIPO_ICONS[os.tipo] || "📄"}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", fontFamily: "'DM Sans',sans-serif" }}>
              {TIPO_LABELS[tipoServico] || tipoServico}
            </div>
            <div style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "'DM Sans',sans-serif" }}>
              OS #{os.id} · CTO {os.cto || "—"}
            </div>
          </div>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, color: sc.color, background: sc.bg,
          padding: "3px 8px", borderRadius: 20, fontFamily: "'DM Sans',sans-serif",
          textTransform: "uppercase", letterSpacing: 0.5,
        }}>
          {STATUS_LABELS[os.status] || os.status}
        </span>
      </div>

      {/* Location */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
        </svg>
        <span style={{ fontSize: 12, color: "#6B7280", fontFamily: "'DM Sans',sans-serif" }}>
          {os.cidade} {os.endereco ? `· ${os.endereco}` : ""}
        </span>
      </div>

      {/* Client */}
      {os.cliente_nome && (
        <div style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "'DM Sans',sans-serif", marginBottom: 8 }}>
          👤 {os.cliente_nome}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          {valor != null ? (
            <>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#111827", fontFamily: "'Space Mono',monospace" }}>
                R$ {Number(valor).toFixed(0)}
              </span>
              <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: 4, fontFamily: "'DM Sans',sans-serif" }}>
                líquido
              </span>
            </>
          ) : (
            <span style={{ fontSize: 13, color: "#D1D5DB", fontFamily: "'DM Sans',sans-serif", fontStyle: "italic" }}>
              Preço não definido
            </span>
          )}
        </div>

        {os.status === "disponivel" && user?.tipo === "tecnico" && (
          <div style={{
            background: "linear-gradient(135deg,#0EA5E9,#06B6D4)", color: "#fff",
            borderRadius: 12, padding: "8px 18px", fontSize: 13, fontWeight: 700,
            fontFamily: "'DM Sans',sans-serif",
          }}>
            Pegar
          </div>
        )}
      </div>
    </div>
  );
}

// ─── OS Detail ─────────────────────────────────────────────
export function OSDetail({ os, onBack, onAction, loading, user }) {
  const sc = STATUS_COLORS[os.status] || STATUS_COLORS.disponivel;
  const [selectedStatus, setSelectedStatus] = useState("");
  const [obs, setObs] = useState("");
  const tipoServico = os.tipo_servico || os.tipoServico;
  const showPegar = os.status === "disponivel" && user?.tipo === "tecnico";
  const showAtualizar = os.status === "em_execucao" && os.tecnico_id === user?.id && user?.tipo === "tecnico";
  const isImp = selectedStatus.startsWith("impedimento");
  const valor = os.valor_liquido || os.valorPagamento;

  const infoItems = [
    { icon: "📍", label: "Cidade", value: os.cidade },
    { icon: "🏠", label: "Endereço", value: os.endereco || "—" },
    { icon: "🔌", label: "CTO", value: os.cto || "—" },
    { icon: "👤", label: "Cliente", value: os.cliente_nome || "—" },
    { icon: "📱", label: "Telefone", value: os.cliente_telefone || "—" },
    { icon: "🏢", label: "Empresa", value: os.empresa_nome || `#${os.empresa_id}` },
    { icon: "📅", label: "Atualização", value: os.data_atualizacao ? new Date(os.data_atualizacao).toLocaleDateString("pt-BR") : "—" },
  ];

  const statusOptions = [
    { value: "executada", label: "✅ Executada" },
    { value: "impedimento_cto_cheia", label: "🚫 CTO Cheia" },
    { value: "impedimento_cliente_ausente", label: "🏠 Cliente Ausente" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "#fff", zIndex: 200, overflowY: "auto", maxWidth: 480, margin: "0 auto", left: 0, right: 0 }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0C4A6E,#0369A1)", padding: "48px 20px 28px", position: "relative" }}>
        <button onClick={onBack} style={{
          position: "absolute", top: 16, left: 16, background: "rgba(255,255,255,0.2)",
          border: "none", borderRadius: 12, width: 36, height: 36,
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18, background: "rgba(255,255,255,0.15)",
            display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 10,
          }}>
            {TIPO_ICONS[os.tipo] || "📄"}
          </div>
          <div style={{ color: "#fff", fontSize: 18, fontWeight: 700, fontFamily: "'DM Sans',sans-serif" }}>
            {TIPO_LABELS[tipoServico] || tipoServico}
          </div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "'DM Sans',sans-serif", marginTop: 4 }}>
            OS #{os.id} {os.empresa_nome ? `· ${os.empresa_nome}` : ""}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 20, paddingBottom: (showPegar || showAtualizar) ? 160 : 40 }}>
        {/* Status */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <span style={{
            fontSize: 12, fontWeight: 700, color: sc.color, background: sc.bg,
            padding: "6px 16px", borderRadius: 20, fontFamily: "'DM Sans',sans-serif", textTransform: "uppercase",
          }}>
            {STATUS_LABELS[os.status]}
          </span>
        </div>

        {/* Info */}
        <div style={{ background: "#F9FAFB", borderRadius: 16, padding: 16, marginBottom: 16 }}>
          {infoItems.map((item, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
              borderBottom: i < infoItems.length - 1 ? "1px solid #E5E7EB" : "none",
            }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "'DM Sans',sans-serif", marginBottom: 1 }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", fontFamily: "'DM Sans',sans-serif" }}>{item.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Value */}
        {valor != null && (
          <div style={{ background: "#F0F9FF", borderRadius: 16, padding: 16, marginBottom: 16, border: "1px solid #BAE6FD" }}>
            <div style={{ fontSize: 12, color: "#0369A1", fontWeight: 600, fontFamily: "'DM Sans',sans-serif", marginBottom: 4 }}>Valor líquido</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#0C4A6E", fontFamily: "'Space Mono',monospace" }}>R$ {Number(valor).toFixed(2)}</div>
          </div>
        )}

        {/* Observation */}
        {os.observacao && (
          <div style={{ background: "#FFFBEB", borderRadius: 16, padding: 16, marginBottom: 16, border: "1px solid #FDE68A" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E", fontFamily: "'DM Sans',sans-serif", marginBottom: 4 }}>📝 Observação</div>
            <div style={{ fontSize: 13, color: "#78350F", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.6 }}>{os.observacao}</div>
          </div>
        )}

        {/* Status Update */}
        {showAtualizar && (
          <div style={{ background: "#F9FAFB", borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", fontFamily: "'DM Sans',sans-serif", marginBottom: 12 }}>Atualizar Status</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {statusOptions.map((opt) => (
                <button key={opt.value} onClick={() => setSelectedStatus(opt.value)} style={{
                  padding: "8px 14px", borderRadius: 12,
                  border: selectedStatus === opt.value ? "2px solid #0EA5E9" : "1px solid #E5E7EB",
                  background: selectedStatus === opt.value ? "#F0F9FF" : "#fff",
                  fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", cursor: "pointer",
                  color: selectedStatus === opt.value ? "#0369A1" : "#6B7280",
                }}>
                  {opt.label}
                </button>
              ))}
            </div>
            {isImp && (
              <textarea value={obs} onChange={(e) => setObs(e.target.value)}
                placeholder="Motivo do impedimento (obrigatório)..."
                style={{
                  width: "100%", padding: 12, borderRadius: 12, border: "1px solid #E5E7EB",
                  fontSize: 13, fontFamily: "'DM Sans',sans-serif", resize: "vertical",
                  minHeight: 80, outline: "none", background: "#fff", color: "#374151",
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      {(showPegar || showAtualizar) && (
        <div style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 480, padding: "12px 20px 16px",
          background: "#fff", borderTop: "1px solid #E5E7EB", zIndex: 210,
        }}>
          {showPegar && (
            <button onClick={() => onAction("pegar")} disabled={loading} style={{
              width: "100%", padding: 16,
              background: loading ? "#9CA3AF" : "linear-gradient(135deg,#0EA5E9,#06B6D4)",
              color: "#fff", border: "none", borderRadius: 16, fontSize: 16, fontWeight: 700,
              fontFamily: "'DM Sans',sans-serif", cursor: loading ? "wait" : "pointer",
              boxShadow: "0 4px 16px rgba(14,165,233,0.4)",
            }}>
              {loading ? "Processando..." : `Pegar OS #${os.id}${valor != null ? ` — R$ ${Number(valor).toFixed(0)}` : ""}`}
            </button>
          )}
          {showAtualizar && (
            <button
              onClick={() => onAction("atualizar", { status: selectedStatus, observacao: obs })}
              disabled={loading || !selectedStatus || (isImp && !obs.trim())}
              style={{
                width: "100%", padding: 16,
                background: (!selectedStatus || loading) ? "#D1D5DB" : "linear-gradient(135deg,#10B981,#059669)",
                color: "#fff", border: "none", borderRadius: 16, fontSize: 16, fontWeight: 700,
                fontFamily: "'DM Sans',sans-serif",
                cursor: (!selectedStatus || loading) ? "not-allowed" : "pointer",
                boxShadow: selectedStatus ? "0 4px 16px rgba(16,185,129,0.4)" : "none",
              }}
            >
              {loading ? "Processando..." : selectedStatus ? `Marcar como ${STATUS_LABELS[selectedStatus]}` : "Selecione um status"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
