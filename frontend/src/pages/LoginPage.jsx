import { useState } from "react";
import { api, saveAuth } from "../utils/api";
import { Toast } from "../components/UI";

export default function LoginPage({ onLogin }) {
  const [tab, setTab] = useState("tecnico");
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", senha: "", cpf: "", cnpj: "", telefone: "", cidade: "", codigoConvite: "" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setLoading(true);
    const path = isRegister ? `/auth/registro/${tab}` : `/auth/login/${tab}`;
    const body = isRegister
      ? { ...form, codigoConvite: form.codigoConvite.trim().toUpperCase() }
      : { email: form.email, senha: form.senha };

    const res = await api(path, { method: "POST", body: JSON.stringify(body) });

    if (res.ok) {
      saveAuth(res.data.token, res.data.usuario);
      onLogin(res.data.usuario);
    } else {
      setToast({ message: res.error, type: "error" });
    }
    setLoading(false);
  };

  const inputStyle = {
    width: "100%", padding: "14px 16px", borderRadius: 14, border: "1px solid #E5E7EB",
    fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: "none",
    background: "#F9FAFB", color: "#111827", transition: "border .2s",
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 20,
      background: "linear-gradient(135deg,#0C4A6E 0%,#0369A1 50%,#0EA5E9 100%)",
    }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, background: "rgba(255,255,255,0.15)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, marginBottom: 12, backdropFilter: "blur(8px)",
          }}>
            ⚡
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", fontFamily: "'Space Mono',monospace", letterSpacing: -1 }}>
            Lampejo
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontFamily: "'DM Sans',sans-serif", marginTop: 4 }}>
            Serviços FTTH para técnicos
          </div>
        </div>

        {/* Card */}
        <div style={{ background: "#fff", borderRadius: 24, padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {["tecnico", "empresa"].map((t) => (
              <button key={t} onClick={() => { setTab(t); setIsRegister(false); setForm({ nome: "", email: "", senha: "", cpf: "", cnpj: "", telefone: "", cidade: "", codigoConvite: "" }); }}
                style={{
                  flex: 1, padding: "10px", borderRadius: 12, border: "none",
                  background: tab === t ? "#0EA5E9" : "#F3F4F6",
                  color: tab === t ? "#fff" : "#6B7280",
                  fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", cursor: "pointer",
                  transition: "all .2s",
                }}>
                {t === "tecnico" ? "🔧 Técnico" : "🏢 Empresa"}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 18, fontWeight: 800, color: "#111827", fontFamily: "'DM Sans',sans-serif", marginBottom: 16 }}>
            {isRegister ? "Criar Conta" : "Entrar"}
          </div>

          {/* Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {isRegister && (
              <input placeholder="Nome completo" value={form.nome} onChange={(e) => set("nome", e.target.value)} style={inputStyle} />
            )}
            <input placeholder="Email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} style={inputStyle} />
            <input placeholder="Senha" type="password" value={form.senha} onChange={(e) => set("senha", e.target.value)} style={inputStyle}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
            {isRegister && (
              <>
                <input placeholder={tab === "tecnico" ? "CPF" : "CNPJ"} value={tab === "tecnico" ? form.cpf : form.cnpj}
                  onChange={(e) => set(tab === "tecnico" ? "cpf" : "cnpj", e.target.value)} style={inputStyle} />
                <input placeholder="Telefone" value={form.telefone} onChange={(e) => set("telefone", e.target.value)} style={inputStyle} />
                <input placeholder="Cidade" value={form.cidade} onChange={(e) => set("cidade", e.target.value)} style={inputStyle} />
                <input placeholder="Código de Convite *" value={form.codigoConvite}
                  onChange={(e) => set("codigoConvite", e.target.value)}
                  style={{ ...inputStyle, border: "2px solid #0EA5E9", background: "#F0F9FF" }} />
              </>
            )}
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading || !form.email || !form.senha}
            style={{
              width: "100%", padding: 16, marginTop: 16,
              background: loading ? "#9CA3AF" : "linear-gradient(135deg,#0EA5E9,#06B6D4)",
              color: "#fff", border: "none", borderRadius: 16, fontSize: 16, fontWeight: 700,
              fontFamily: "'DM Sans',sans-serif", cursor: loading ? "wait" : "pointer",
              boxShadow: "0 4px 16px rgba(14,165,233,0.4)",
            }}>
            {loading ? "Entrando..." : isRegister ? "Criar Conta" : "Entrar"}
          </button>

          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button onClick={() => setIsRegister(!isRegister)} style={{
              background: "none", border: "none", color: "#0EA5E9", fontSize: 13,
              fontWeight: 600, fontFamily: "'DM Sans',sans-serif", cursor: "pointer",
            }}>
              {isRegister ? "Já tenho conta → Entrar" : "Não tenho conta → Criar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
