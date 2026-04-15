import { useState, useEffect, useCallback } from "react";
import { api, getUser, clearAuth, STATUS_LABELS } from "./utils/api";
import { Toast, SuccessModal, BottomNav } from "./components/UI";
import { OSDetail } from "./components/OSComponents";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import { MyJobsPage, CriarOSPage, StatsPage, ProfilePage, MapPage } from "./pages/OtherPages";

export default function App() {
  const [user, setUser] = useState(getUser());
  const [page, setPage] = useState("home");
  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [toast, setToast] = useState(null);
  const [successModal, setSuccessModal] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  // ─── Load OS ─────────────────────────────────────────────
  const loadOrdens = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const res = await api("/os");
    if (res.ok) {
      setOrdens(res.data);
    } else if (res.error?.includes("Token")) {
      handleLogout();
    } else {
      setToast({ message: `Erro: ${res.error}`, type: "error" });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) loadOrdens();
  }, [user, loadOrdens]);

  // ─── Auth ────────────────────────────────────────────────
  const handleLogin = (u) => {
    setUser(u);
    setPage("home");
  };

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setOrdens([]);
    setPage("home");
  };

  // ─── OS Actions ──────────────────────────────────────────
  const handleAction = async (action, extra = {}) => {
    if (!detail) return;
    setActionLoading(true);

    if (action === "pegar") {
      const res = await api(`/os/${detail.id}/pegar`, {
        method: "POST",
        body: JSON.stringify({ tecnicoId: user.id }),
      });
      if (res.ok) {
        setDetail(null);
        setSuccessModal({ message: "OS Atribuída!", sub: `Você pegou a OS #${detail.id}.` });
        await loadOrdens();
      } else {
        setToast({ message: res.error, type: "error" });
      }
    }

    if (action === "atualizar") {
      const res = await api(`/os/${detail.id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: extra.status,
          observacao: extra.observacao || null,
          tecnicoId: user.id,
        }),
      });
      if (res.ok) {
        setDetail(null);
        setSuccessModal({ message: "OS Atualizada!", sub: `Status: ${STATUS_LABELS[extra.status]}` });
        await loadOrdens();
      } else {
        setToast({ message: res.error, type: "error" });
      }
    }

    setActionLoading(false);
  };

  const myJobCount = ordens.filter((os) => os.tecnico_id === user?.id && os.status === "em_execucao").length;

  // ─── Login Screen ────────────────────────────────────────
  if (!user) return <LoginPage onLogin={handleLogin} />;

  // ─── Main App ────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", background: "#FAFBFC", minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; background: #F0F2F5; }
        input::placeholder, textarea::placeholder { color: #9CA3AF; }
        ::-webkit-scrollbar { display: none; }
        @keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes slideDown { from { transform: translate(-50%,-20px); opacity: 0; } to { transform: translate(-50%,0); opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Overlays */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {successModal && (
        <SuccessModal
          message={successModal.message}
          sub={successModal.sub}
          onClose={() => {
            setSuccessModal(null);
            if (user?.tipo === "tecnico") setPage("myjobs");
            else setPage("home");
          }}
        />
      )}
      {detail && <OSDetail os={detail} onBack={() => setDetail(null)} onAction={handleAction} loading={actionLoading} user={user} />}

      {/* Pages */}
      {page === "home" && (
        <HomePage
          ordens={ordens} loading={loading} onTapOS={setDetail}
          search={search} setSearch={setSearch}
          category={category} setCategory={setCategory}
          user={user}
        />
      )}
      {page === "mapa" && <MapPage ordens={ordens} user={user} />}
      {page === "myjobs" && <MyJobsPage ordens={ordens} user={user} />}
      {page === "criar" && <CriarOSPage onCreated={() => { loadOrdens(); setPage("home"); }} setToast={setToast} />}
      {page === "stats" && <StatsPage ordens={ordens} user={user} />}
      {page === "profile" && <ProfilePage user={user} onLogout={handleLogout} />}

      {/* Navigation */}
      <BottomNav active={page} onNavigate={setPage} jobCount={myJobCount} userType={user?.tipo} />
    </div>
  );
}
