// ─── Constantes ────────────────────────────────────────────
export const API = import.meta.env.VITE_API_URL || "";

export const TIPO_LABELS = {
  instalacao: "Instalação",
  reparo: "Reparo",
  reparo_sem_conexao: "Reparo s/ Conexão",
  reparo_lentidao: "Reparo Lentidão",
  reparo_intermitente: "Reparo Intermitente",
  manutencao: "Manutenção",
  migracao: "Migração",
  certificacao: "Certificação",
  recolhimento: "Recolhimento",
  reativacao: "Reativação",
  ponto_extra: "Ponto Extra Wi-Fi",
  analise: "Análise/Viabilidade",
  infraestrutura: "Infraestrutura",
  expansao_rede: "Expansão de Rede",
};

export const STATUS_LABELS = {
  disponivel: "Disponível",
  em_execucao: "Em Execução",
  executada: "Executada",
  impedimento_cto_cheia: "CTO Cheia",
  impedimento_cliente_ausente: "Cliente Ausente",
};

export const STATUS_COLORS = {
  disponivel: { color: "#0EA5E9", bg: "#F0F9FF" },
  em_execucao: { color: "#F59E0B", bg: "#FFFBEB" },
  executada: { color: "#10B981", bg: "#ECFDF5" },
  impedimento_cto_cheia: { color: "#EF4444", bg: "#FEF2F2" },
  impedimento_cliente_ausente: { color: "#EF4444", bg: "#FEF2F2" },
};

export const TIPO_ICONS = {
  instalacao: "🏠",
  reparo: "🔧",
  reparo_sem_conexao: "📡",
  reparo_lentidao: "🐌",
  reparo_intermitente: "📶",
  manutencao: "🛠️",
  migracao: "🔄",
  certificacao: "📋",
  recolhimento: "📦",
  reativacao: "🔌",
  ponto_extra: "📶",
  analise: "🔍",
  infraestrutura: "🏗️",
  expansao_rede: "🌐",
};

export const CATEGORIES = [
  { id: "all", label: "Todos", icon: "⚡" },
  { id: "disponivel", label: "Disponíveis", icon: "📋" },
  { id: "em_execucao", label: "Em Execução", icon: "⏳" },
  { id: "executada", label: "Executadas", icon: "✅" },
  { id: "impedimento", label: "Impedidas", icon: "🚫" },
];

// ─── Auth helpers ──────────────────────────────────────────
export function getToken() {
  return localStorage.getItem("lampejo_token");
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem("lampejo_user"));
  } catch {
    return null;
  }
}

export function saveAuth(token, usuario) {
  localStorage.setItem("lampejo_token", token);
  localStorage.setItem("lampejo_user", JSON.stringify(usuario));
}

export function clearAuth() {
  localStorage.removeItem("lampejo_token");
  localStorage.removeItem("lampejo_user");
}

// ─── API helper ────────────────────────────────────────────
export async function api(path, options = {}) {
  try {
    const token = getToken();
    const res = await fetch(`${API}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.erro || "Erro na API");
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
