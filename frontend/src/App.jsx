import { useState, useEffect, useCallback, useRef } from "react";

const API = import.meta.env.VITE_API_URL || "";

// ─── Labels & Maps ─────────────────────────────────────────
const TIPO_LABELS = { instalacao:"Instalação", reparo:"Reparo", reparo_sem_conexao:"Reparo s/ Conexão", reparo_lentidao:"Reparo Lentidão", reparo_intermitente:"Reparo Intermitente", manutencao:"Manutenção", migracao:"Migração", certificacao:"Certificação" };
const STATUS_LABELS = { disponivel:"Disponível", em_execucao:"Em Execução", executada:"Executada", impedimento_cto_cheia:"CTO Cheia", impedimento_cliente_ausente:"Cliente Ausente" };
const STATUS_COLORS = { disponivel:{color:"#0EA5E9",bg:"#F0F9FF"}, em_execucao:{color:"#F59E0B",bg:"#FFFBEB"}, executada:{color:"#10B981",bg:"#ECFDF5"}, impedimento_cto_cheia:{color:"#EF4444",bg:"#FEF2F2"}, impedimento_cliente_ausente:{color:"#EF4444",bg:"#FEF2F2"} };
const TIPO_ICONS = { instalacao:"🏠", reparo:"🔧", reparo_sem_conexao:"📡", reparo_lentidao:"🐌", reparo_intermitente:"📶", manutencao:"🛠️", migracao:"🔄", certificacao:"📋" };
const CATEGORIES = [ {id:"all",label:"Todos",icon:"⚡"}, {id:"disponivel",label:"Disponíveis",icon:"📋"}, {id:"em_execucao",label:"Em Execução",icon:"⏳"}, {id:"executada",label:"Executadas",icon:"✅"}, {id:"impedimento",label:"Impedidas",icon:"🚫"} ];

// ─── API helper ────────────────────────────────────────────
function getToken() { return localStorage.getItem("lampejo_token"); }
function getUser() { try { return JSON.parse(localStorage.getItem("lampejo_user")); } catch { return null; } }

async function api(path, options = {}) {
  try {
    const token = getToken();
    const res = await fetch(`${API}${path}`, {
      headers: { "Content-Type":"application/json", ...(token ? { Authorization:`Bearer ${token}` } : {}) },
      ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.erro || "Erro na API");
    return { ok:true, data };
  } catch (err) {
    return { ok:false, error:err.message };
  }
}

// ─── Shared Components ─────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return <div style={{ position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",background:type==="success"?"#10B981":"#EF4444",color:"#fff",padding:"12px 24px",borderRadius:14,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",zIndex:999,boxShadow:"0 8px 24px rgba(0,0,0,0.2)",animation:"slideDown .3s ease",maxWidth:360,textAlign:"center" }}>{message}</div>;
}

function BottomNav({ active, onNavigate, jobCount, userType }) {
  const mapIcon = (a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?"#0EA5E9":"#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>;
  const tecItems = [
    {id:"home",label:"Início",icon:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?"#0EA5E9":"#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>},
    {id:"mapa",label:"Mapa",icon:mapIcon},
    {id:"myjobs",label:"Meus Jobs",icon:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?"#0EA5E9":"#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,badge:jobCount},
    {id:"profile",label:"Perfil",icon:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?"#0EA5E9":"#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>},
  ];
  const empItems = [
    {id:"home",label:"OS",icon:tecItems[0].icon},
    {id:"mapa",label:"Mapa",icon:mapIcon},
    {id:"criar",label:"Nova OS",icon:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?"#0EA5E9":"#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>},
    {id:"profile",label:"Perfil",icon:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?"#0EA5E9":"#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>},
  ];
  const items = userType === "empresa" ? empItems : tecItems;
  return (
    <div style={{ position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"#fff",borderTop:"1px solid #E5E7EB",display:"flex",justifyContent:"space-around",padding:"8px 0 12px",zIndex:100 }}>
      {items.map(item=>(
        <button key={item.id} onClick={()=>onNavigate(item.id)} style={{ background:"none",border:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",padding:"4px 12px",position:"relative" }}>
          {item.icon(active===item.id)}
          {item.badge>0&&<div style={{ position:"absolute",top:-2,right:4,width:16,height:16,borderRadius:"50%",background:"#EF4444",fontSize:9,color:"#fff",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center" }}>{item.badge}</div>}
          <span style={{ fontSize:10,fontWeight:active===item.id?700:500,color:active===item.id?"#0EA5E9":"#9CA3AF",fontFamily:"'DM Sans',sans-serif" }}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Login Page ────────────────────────────────────────────
function LoginPage({ onLogin, toast, setToast }) {
  const [tab, setTab] = useState("tecnico");
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ nome:"", email:"", senha:"", cpf:"", cnpj:"", telefone:"", cidade:"", codigoConvite:"" });
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSubmit = async () => {
    setLoading(true);
    const path = isRegister ? `/auth/registro/${tab}` : `/auth/login/${tab}`;
    const body = isRegister ? { ...form, codigoConvite: form.codigoConvite.trim().toUpperCase() } : { email:form.email, senha:form.senha };
    const res = await api(path, { method:"POST", body:JSON.stringify(body) });
    if (res.ok) {
      localStorage.setItem("lampejo_token", res.data.token);
      localStorage.setItem("lampejo_user", JSON.stringify(res.data.usuario));
      onLogin(res.data.usuario);
    } else {
      setToast({ message:res.error, type:"error" });
    }
    setLoading(false);
  };

  const inputStyle = { width:"100%",padding:"14px 16px",borderRadius:14,border:"1px solid #E5E7EB",fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",background:"#F9FAFB",color:"#111827",transition:"border .2s" };

  return (
    <div style={{ minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,background:"linear-gradient(135deg,#0C4A6E 0%,#0369A1 50%,#0EA5E9 100%)" }}>
      {toast&&<Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)}/>}
      <div style={{ width:"100%",maxWidth:400 }}>
        {/* Logo */}
        <div style={{ textAlign:"center",marginBottom:32 }}>
          <div style={{ width:64,height:64,borderRadius:20,background:"rgba(255,255,255,0.15)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:32,marginBottom:12,backdropFilter:"blur(8px)" }}>⚡</div>
          <div style={{ fontSize:28,fontWeight:800,color:"#fff",fontFamily:"'Space Mono',monospace",letterSpacing:-1 }}>Lampejo</div>
          <div style={{ fontSize:13,color:"rgba(255,255,255,0.7)",fontFamily:"'DM Sans',sans-serif",marginTop:4 }}>Serviços FTTH para técnicos</div>
        </div>

        {/* Card */}
        <div style={{ background:"#fff",borderRadius:24,padding:24,boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
          {/* Tabs Técnico/Empresa */}
          <div style={{ display:"flex",gap:8,marginBottom:20 }}>
            {["tecnico","empresa"].map(t=>(
              <button key={t} onClick={()=>{setTab(t);setIsRegister(false);setForm({nome:"",email:"",senha:"",cpf:"",cnpj:"",telefone:"",cidade:""});}} style={{ flex:1,padding:"10px",borderRadius:12,border:"none",background:tab===t?"#0EA5E9":"#F3F4F6",color:tab===t?"#fff":"#6B7280",fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",transition:"all .2s" }}>
                {t==="tecnico"?"🔧 Técnico":"🏢 Empresa"}
              </button>
            ))}
          </div>

          <div style={{ fontSize:18,fontWeight:800,color:"#111827",fontFamily:"'DM Sans',sans-serif",marginBottom:16 }}>
            {isRegister?"Criar Conta":"Entrar"}
          </div>

          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            {isRegister && <input placeholder="Nome completo" value={form.nome} onChange={e=>set("nome",e.target.value)} style={inputStyle}/>}
            <input placeholder="Email" type="email" value={form.email} onChange={e=>set("email",e.target.value)} style={inputStyle}/>
            <input placeholder="Senha" type="password" value={form.senha} onChange={e=>set("senha",e.target.value)} style={inputStyle} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>
            {isRegister && <>
              <input placeholder={tab==="tecnico"?"CPF":"CNPJ"} value={tab==="tecnico"?form.cpf:form.cnpj} onChange={e=>set(tab==="tecnico"?"cpf":"cnpj",e.target.value)} style={inputStyle}/>
              <input placeholder="Telefone" value={form.telefone} onChange={e=>set("telefone",e.target.value)} style={inputStyle}/>
              <input placeholder="Cidade" value={form.cidade} onChange={e=>set("cidade",e.target.value)} style={inputStyle}/>
              <input placeholder="Código de Convite *" value={form.codigoConvite} onChange={e=>set("codigoConvite",e.target.value)} style={{...inputStyle, border:"2px solid #0EA5E9", background:"#F0F9FF"}}/>
            </>}
          </div>

          <button onClick={handleSubmit} disabled={loading||!form.email||!form.senha} style={{ width:"100%",padding:16,marginTop:16,background:loading?"#9CA3AF":"linear-gradient(135deg,#0EA5E9,#06B6D4)",color:"#fff",border:"none",borderRadius:16,fontSize:16,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:loading?"wait":"pointer",boxShadow:"0 4px 16px rgba(14,165,233,0.4)" }}>
            {loading?"Entrando...":(isRegister?"Criar Conta":"Entrar")}
          </button>

          <div style={{ textAlign:"center",marginTop:16 }}>
            <button onClick={()=>setIsRegister(!isRegister)} style={{ background:"none",border:"none",color:"#0EA5E9",fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer" }}>
              {isRegister?"Já tenho conta → Entrar":"Não tenho conta → Criar"}
            </button>
          </div>
        </div>

        {/* Credenciais de teste */}
        <div style={{ marginTop:20,background:"rgba(255,255,255,0.1)",borderRadius:16,padding:16,backdropFilter:"blur(8px)" }}>
          <div style={{ fontSize:11,color:"rgba(255,255,255,0.7)",fontFamily:"'DM Sans',sans-serif",marginBottom:6,fontWeight:600 }}>Logins de teste:</div>
          <div style={{ fontSize:11,color:"rgba(255,255,255,0.9)",fontFamily:"'Space Mono',monospace",lineHeight:1.8 }}>
            Técnico: joao@email.com / 123456<br/>
            Empresa: admin@fibralink.com / 123456
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── OS Card ───────────────────────────────────────────────
function OSCard({ os, onTap, delay=0, user }) {
  const [visible,setVisible]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setVisible(true),delay);return()=>clearTimeout(t);},[delay]);
  const sc=STATUS_COLORS[os.status]||STATUS_COLORS.disponivel;
  const valor = os.valor_liquido || os.valorPagamento;
  return (
    <div onClick={()=>onTap(os)} style={{ background:"#fff",borderRadius:16,padding:16,marginBottom:12,boxShadow:"0 1px 4px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.04)",cursor:"pointer",border:"1px solid #F3F4F6",transition:"opacity .5s ease,transform .5s ease",opacity:visible?1:0,transform:visible?"translateY(0)":"translateY(20px)" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:42,height:42,borderRadius:13,background:"#F0F9FF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 }}>{TIPO_ICONS[os.tipo]||"📄"}</div>
          <div>
            <div style={{ fontSize:14,fontWeight:700,color:"#111827",fontFamily:"'DM Sans',sans-serif" }}>{TIPO_LABELS[os.tipo_servico||os.tipoServico]||(os.tipo_servico||os.tipoServico)}</div>
            <div style={{ fontSize:11,color:"#9CA3AF",fontFamily:"'DM Sans',sans-serif" }}>OS #{os.id} · CTO {os.cto||"—"}</div>
          </div>
        </div>
        <span style={{ fontSize:10,fontWeight:700,color:sc.color,background:sc.bg,padding:"3px 8px",borderRadius:20,fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase",letterSpacing:.5 }}>{STATUS_LABELS[os.status]||os.status}</span>
      </div>
      <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:4 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <span style={{ fontSize:12,color:"#6B7280",fontFamily:"'DM Sans',sans-serif" }}>{os.cidade} {os.endereco?`· ${os.endereco}`:""}</span>
      </div>
      {os.cliente_nome&&<div style={{ fontSize:11,color:"#9CA3AF",fontFamily:"'DM Sans',sans-serif",marginBottom:8 }}>👤 {os.cliente_nome}</div>}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div>
          {valor!=null?<><span style={{ fontSize:22,fontWeight:800,color:"#111827",fontFamily:"'Space Mono',monospace" }}>R$ {Number(valor).toFixed(0)}</span><span style={{ fontSize:11,color:"#9CA3AF",marginLeft:4,fontFamily:"'DM Sans',sans-serif" }}>líquido</span></>:<span style={{ fontSize:13,color:"#D1D5DB",fontFamily:"'DM Sans',sans-serif",fontStyle:"italic" }}>Preço não definido</span>}
        </div>
        {os.status==="disponivel"&&user?.tipo==="tecnico"&&<div style={{ background:"linear-gradient(135deg,#0EA5E9,#06B6D4)",color:"#fff",borderRadius:12,padding:"8px 18px",fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif" }}>Pegar</div>}
      </div>
    </div>
  );
}

// ─── OS Detail ─────────────────────────────────────────────
function OSDetail({ os, onBack, onAction, loading, user }) {
  const sc=STATUS_COLORS[os.status]||STATUS_COLORS.disponivel;
  const [selectedStatus,setSelectedStatus]=useState("");
  const [obs,setObs]=useState("");
  const showPegar=os.status==="disponivel"&&user?.tipo==="tecnico";
  const showAtualizar=os.status==="em_execucao"&&os.tecnico_id===user?.id&&user?.tipo==="tecnico";
  const isImp=selectedStatus.startsWith("impedimento");
  const valor=os.valor_liquido||os.valorPagamento;

  return (
    <div style={{ position:"fixed",inset:0,background:"#fff",zIndex:200,overflowY:"auto",maxWidth:480,margin:"0 auto",left:0,right:0 }}>
      <div style={{ background:"linear-gradient(135deg,#0C4A6E,#0369A1)",padding:"48px 20px 28px",position:"relative" }}>
        <button onClick={onBack} style={{ position:"absolute",top:16,left:16,background:"rgba(255,255,255,0.2)",border:"none",borderRadius:12,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:56,height:56,borderRadius:18,background:"rgba(255,255,255,0.15)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:28,marginBottom:10 }}>{TIPO_ICONS[os.tipo]||"📄"}</div>
          <div style={{ color:"#fff",fontSize:18,fontWeight:700,fontFamily:"'DM Sans',sans-serif" }}>{TIPO_LABELS[os.tipo_servico||os.tipoServico]||(os.tipo_servico||os.tipoServico)}</div>
          <div style={{ color:"rgba(255,255,255,0.7)",fontSize:13,fontFamily:"'DM Sans',sans-serif",marginTop:4 }}>OS #{os.id} {os.empresa_nome?`· ${os.empresa_nome}`:""}</div>
        </div>
      </div>
      <div style={{ padding:20,paddingBottom:(showPegar||showAtualizar)?160:40 }}>
        <div style={{ display:"flex",justifyContent:"center",marginBottom:20 }}><span style={{ fontSize:12,fontWeight:700,color:sc.color,background:sc.bg,padding:"6px 16px",borderRadius:20,fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase" }}>{STATUS_LABELS[os.status]}</span></div>
        <div style={{ background:"#F9FAFB",borderRadius:16,padding:16,marginBottom:16 }}>
          {[
            {icon:"📍",label:"Cidade",value:os.cidade},
            {icon:"🏠",label:"Endereço",value:os.endereco||"—"},
            {icon:"🔌",label:"CTO",value:os.cto||"—"},
            {icon:"👤",label:"Cliente",value:os.cliente_nome||"—"},
            {icon:"📱",label:"Telefone",value:os.cliente_telefone||"—"},
            {icon:"🏢",label:"Empresa",value:os.empresa_nome||`#${os.empresa_id}`},
            {icon:"📅",label:"Atualização",value:os.data_atualizacao?new Date(os.data_atualizacao).toLocaleDateString("pt-BR"):"—"},
          ].map((item,i)=>(
            <div key={i} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<6?"1px solid #E5E7EB":"none" }}>
              <span style={{ fontSize:18 }}>{item.icon}</span>
              <div><div style={{ fontSize:11,color:"#9CA3AF",fontFamily:"'DM Sans',sans-serif",marginBottom:1 }}>{item.label}</div><div style={{ fontSize:13,fontWeight:600,color:"#374151",fontFamily:"'DM Sans',sans-serif" }}>{item.value}</div></div>
            </div>
          ))}
        </div>
        {valor!=null&&<div style={{ background:"#F0F9FF",borderRadius:16,padding:16,marginBottom:16,border:"1px solid #BAE6FD" }}>
          <div style={{ fontSize:12,color:"#0369A1",fontWeight:600,fontFamily:"'DM Sans',sans-serif",marginBottom:4 }}>Valor líquido</div>
          <div style={{ fontSize:32,fontWeight:800,color:"#0C4A6E",fontFamily:"'Space Mono',monospace" }}>R$ {Number(valor).toFixed(2)}</div>
        </div>}
        {os.observacao&&<div style={{ background:"#FFFBEB",borderRadius:16,padding:16,marginBottom:16,border:"1px solid #FDE68A" }}><div style={{ fontSize:12,fontWeight:700,color:"#92400E",fontFamily:"'DM Sans',sans-serif",marginBottom:4 }}>📝 Observação</div><div style={{ fontSize:13,color:"#78350F",fontFamily:"'DM Sans',sans-serif",lineHeight:1.6 }}>{os.observacao}</div></div>}
        {showAtualizar&&(
          <div style={{ background:"#F9FAFB",borderRadius:16,padding:16,marginBottom:16 }}>
            <div style={{ fontSize:13,fontWeight:700,color:"#374151",fontFamily:"'DM Sans',sans-serif",marginBottom:12 }}>Atualizar Status</div>
            <div style={{ display:"flex",flexWrap:"wrap",gap:8,marginBottom:12 }}>
              {[{value:"executada",label:"✅ Executada"},{value:"impedimento_cto_cheia",label:"🚫 CTO Cheia"},{value:"impedimento_cliente_ausente",label:"🏠 Cliente Ausente"}].map(opt=>(
                <button key={opt.value} onClick={()=>setSelectedStatus(opt.value)} style={{ padding:"8px 14px",borderRadius:12,border:selectedStatus===opt.value?"2px solid #0EA5E9":"1px solid #E5E7EB",background:selectedStatus===opt.value?"#F0F9FF":"#fff",fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",color:selectedStatus===opt.value?"#0369A1":"#6B7280" }}>{opt.label}</button>
              ))}
            </div>
            {isImp&&<textarea value={obs} onChange={e=>setObs(e.target.value)} placeholder="Motivo do impedimento (obrigatório)..." style={{ width:"100%",padding:12,borderRadius:12,border:"1px solid #E5E7EB",fontSize:13,fontFamily:"'DM Sans',sans-serif",resize:"vertical",minHeight:80,outline:"none",background:"#fff",color:"#374151" }}/>}
          </div>
        )}
      </div>
      {(showPegar||showAtualizar)&&(
        <div style={{ position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,padding:"12px 20px 16px",background:"#fff",borderTop:"1px solid #E5E7EB",zIndex:210 }}>
          {showPegar&&<button onClick={()=>onAction("pegar")} disabled={loading} style={{ width:"100%",padding:16,background:loading?"#9CA3AF":"linear-gradient(135deg,#0EA5E9,#06B6D4)",color:"#fff",border:"none",borderRadius:16,fontSize:16,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:loading?"wait":"pointer",boxShadow:"0 4px 16px rgba(14,165,233,0.4)" }}>{loading?"Processando...":`Pegar OS #${os.id}${valor!=null?` — R$ ${Number(valor).toFixed(0)}`:""}`}</button>}
          {showAtualizar&&<button onClick={()=>onAction("atualizar",{status:selectedStatus,observacao:obs})} disabled={loading||!selectedStatus||(isImp&&!obs.trim())} style={{ width:"100%",padding:16,background:(!selectedStatus||loading)?"#D1D5DB":"linear-gradient(135deg,#10B981,#059669)",color:"#fff",border:"none",borderRadius:16,fontSize:16,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:(!selectedStatus||loading)?"not-allowed":"pointer",boxShadow:selectedStatus?"0 4px 16px rgba(16,185,129,0.4)":"none" }}>{loading?"Processando...":selectedStatus?`Marcar como ${STATUS_LABELS[selectedStatus]}`:"Selecione um status"}</button>}
        </div>
      )}
    </div>
  );
}

function SuccessModal({ message, sub, onClose }) {
  return <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)" }}>
    <div style={{ background:"#fff",borderRadius:24,padding:32,textAlign:"center",maxWidth:340,width:"100%",animation:"popIn .3s ease" }}>
      <div style={{ width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,#10B981,#059669)",display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:16 }}><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
      <h3 style={{ fontSize:20,fontWeight:800,color:"#111827",margin:"0 0 8px",fontFamily:"'DM Sans',sans-serif" }}>{message}</h3>
      <p style={{ fontSize:12,color:"#9CA3AF",margin:"0 0 24px",fontFamily:"'DM Sans',sans-serif",lineHeight:1.6 }}>{sub}</p>
      <button onClick={onClose} style={{ width:"100%",padding:14,background:"#111827",color:"#fff",border:"none",borderRadius:14,fontSize:14,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer" }}>OK</button>
    </div>
  </div>;
}

// ─── Pages ─────────────────────────────────────────────────
function HomePage({ ordens, loading, onTapOS, search, setSearch, category, setCategory, user }) {
  const filtered = ordens.filter(os => { if(category==="all") return true; if(category==="impedimento") return os.status?.startsWith("impedimento"); return os.status===category; }).filter(os => { if(!search) return true; const q=search.toLowerCase(); return (os.cidade||"").toLowerCase().includes(q)||(os.cto||"").toLowerCase().includes(q)||(TIPO_LABELS[os.tipo_servico||os.tipoServico]||"").toLowerCase().includes(q)||String(os.id).includes(q)||(os.cliente_nome||"").toLowerCase().includes(q); });
  const disp=ordens.filter(o=>o.status==="disponivel").length;
  const exec=ordens.filter(o=>o.status==="em_execucao").length;
  return (
    <div style={{ paddingBottom:80 }}>
      <div style={{ background:"linear-gradient(135deg,#0C4A6E 0%,#0369A1 50%,#0EA5E9 100%)",padding:"16px 16px 20px",borderRadius:"0 0 24px 24px" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
          <div><div style={{ fontSize:12,color:"rgba(255,255,255,0.7)",fontFamily:"'DM Sans',sans-serif" }}>Olá, {user?.nome} 👋</div><div style={{ fontSize:20,fontWeight:800,color:"#fff",fontFamily:"'Space Mono',monospace",letterSpacing:-1 }}>Lampejo</div></div>
          {loading&&<div style={{ width:24,height:24,border:"3px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 1s linear infinite" }}/>}
        </div>
        <div style={{ position:"relative" }}><svg style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por cidade, CTO, cliente..." style={{ width:"100%",padding:"12px 16px 12px 42px",borderRadius:14,border:"none",background:"rgba(255,255,255,0.15)",color:"#fff",fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none" }}/></div>
      </div>
      <div style={{ display:"flex",gap:8,padding:"16px 16px 0" }}>{[{label:"Total",value:ordens.length,color:"#6B7280"},{label:"Disponíveis",value:disp,color:"#0EA5E9"},{label:"Em Execução",value:exec,color:"#F59E0B"}].map((s,i)=>(<div key={i} style={{ flex:1,background:"#fff",borderRadius:14,padding:12,textAlign:"center",border:"1px solid #F3F4F6" }}><div style={{ fontSize:20,fontWeight:800,color:s.color,fontFamily:"'Space Mono',monospace" }}>{s.value}</div><div style={{ fontSize:10,color:"#9CA3AF",fontFamily:"'DM Sans',sans-serif",fontWeight:600 }}>{s.label}</div></div>))}</div>
      <div style={{ display:"flex",gap:8,padding:"16px 16px 4px",overflowX:"auto" }}>{CATEGORIES.map(cat=>(<button key={cat.id} onClick={()=>setCategory(cat.id)} style={{ flexShrink:0,padding:"8px 14px",borderRadius:12,border:"none",background:category===cat.id?"#0EA5E9":"#fff",color:category===cat.id?"#fff":"#6B7280",fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",display:"flex",alignItems:"center",gap:4,transition:"all .2s",boxShadow:category===cat.id?"0 2px 8px rgba(14,165,233,0.3)":"0 1px 3px rgba(0,0,0,0.05)" }}><span>{cat.icon}</span>{cat.label}</button>))}</div>
      <div style={{ padding:"12px 16px 0" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}><span style={{ fontSize:16,fontWeight:800,color:"#111827",fontFamily:"'DM Sans',sans-serif" }}>Ordens de Serviço</span><span style={{ fontSize:12,color:"#9CA3AF",fontFamily:"'DM Sans',sans-serif" }}>{filtered.length} encontrada{filtered.length!==1?"s":""}</span></div>
        {loading&&ordens.length===0&&<div style={{ textAlign:"center",padding:"40px 20px" }}><div style={{ width:32,height:32,border:"3px solid #E5E7EB",borderTopColor:"#0EA5E9",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 12px" }}/><div style={{ fontSize:13,color:"#9CA3AF",fontFamily:"'DM Sans',sans-serif" }}>Carregando...</div></div>}
        {filtered.map((os,i)=><OSCard key={os.id} os={os} onTap={onTapOS} delay={i*80} user={user}/>)}
        {filtered.length===0&&!loading&&<div style={{ textAlign:"center",padding:"40px 20px" }}><div style={{ fontSize:40,marginBottom:8 }}>🔍</div><div style={{ fontSize:14,fontWeight:600,color:"#6B7280",fontFamily:"'DM Sans',sans-serif" }}>Nenhuma OS encontrada</div></div>}
      </div>
    </div>
  );
}

function MyJobsPage({ ordens, user }) {
  const my=ordens.filter(os=>os.tecnico_id===user?.id);
  const groups=[{title:"⏳ Em Execução",items:my.filter(o=>o.status==="em_execucao")},{title:"✅ Executadas",items:my.filter(o=>o.status==="executada")},{title:"🚫 Impedimentos",items:my.filter(o=>o.status?.startsWith("impedimento"))}];
  return (
    <div style={{ padding:"0 16px 100px" }}>
      <h2 style={{ fontSize:20,fontWeight:800,color:"#111827",margin:"20px 0 16px",fontFamily:"'DM Sans',sans-serif" }}>Meus Jobs</h2>
      {my.length===0?<div style={{ textAlign:"center",padding:"60px 20px" }}><div style={{ fontSize:48,marginBottom:12 }}>📋</div><div style={{ fontSize:16,fontWeight:700,color:"#374151",fontFamily:"'DM Sans',sans-serif",marginBottom:4 }}>Nenhum job ainda</div><div style={{ fontSize:13,color:"#9CA3AF",fontFamily:"'DM Sans',sans-serif" }}>Pegue OS na página inicial</div></div>:groups.map((g,gi)=>(
        <div key={gi} style={{ marginBottom:20 }}><div style={{ fontSize:14,fontWeight:700,color:"#374151",fontFamily:"'DM Sans',sans-serif",marginBottom:8 }}>{g.title} ({g.items.length})</div>
          {g.items.length===0?<div style={{ fontSize:12,color:"#D1D5DB",fontStyle:"italic",fontFamily:"'DM Sans',sans-serif",padding:"4px 0" }}>Nenhuma</div>:g.items.map(os=>{const sc=STATUS_COLORS[os.status]||STATUS_COLORS.disponivel;const val=os.valor_liquido||os.valorPagamento;return(
            <div key={os.id} style={{ background:"#fff",borderRadius:14,padding:14,marginBottom:8,border:"1px solid #F3F4F6" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}><span style={{ fontSize:13,fontWeight:700,color:"#111827",fontFamily:"'DM Sans',sans-serif" }}>{TIPO_ICONS[os.tipo]} {TIPO_LABELS[os.tipo_servico||os.tipoServico]||(os.tipo_servico||os.tipoServico)}</span><span style={{ fontSize:10,fontWeight:700,color:sc.color,background:sc.bg,padding:"3px 8px",borderRadius:20,fontFamily:"'DM Sans',sans-serif" }}>{STATUS_LABELS[os.status]}</span></div>
              <div style={{ fontSize:11,color:"#9CA3AF",fontFamily:"'DM Sans',sans-serif" }}>OS #{os.id} · {os.cidade} · CTO {os.cto||"—"}</div>
              {val!=null&&<div style={{ marginTop:8,fontSize:17,fontWeight:800,color:"#111827",fontFamily:"'Space Mono',monospace" }}>R$ {Number(val).toFixed(2)}</div>}
            </div>);})}
        </div>))}
    </div>
  );
}

function CriarOSPage({ onCreated, setToast }) {
  const [form,setForm]=useState({cliente_cpf:"",cliente_nome:"",cliente_telefone:"",cidade:"",endereco:"",tipo:"instalacao",tipo_servico:"instalacao",cto:"",observacao:""});
  const [loading,setLoading]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const inputStyle={ width:"100%",padding:"14px 16px",borderRadius:14,border:"1px solid #E5E7EB",fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",background:"#F9FAFB",color:"#111827" };

  const handleCreate=async()=>{
    if(!form.cidade||!form.tipo){setToast({message:"Cidade e tipo são obrigatórios",type:"error"});return;}
    setLoading(true);
    const res=await api("/os",{method:"POST",body:JSON.stringify(form)});
    if(res.ok){onCreated();setToast({message:"OS criada com sucesso!",type:"success"});setForm({cliente_cpf:"",cliente_nome:"",cliente_telefone:"",cidade:"",endereco:"",tipo:"instalacao",tipo_servico:"instalacao",cto:"",observacao:""});}
    else setToast({message:res.error,type:"error"});
    setLoading(false);
  };

  return (
    <div style={{ padding:"0 16px 100px" }}>
      <h2 style={{ fontSize:20,fontWeight:800,color:"#111827",margin:"20px 0 16px",fontFamily:"'DM Sans',sans-serif" }}>Nova Ordem de Serviço</h2>
      <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
        <input placeholder="Nome do cliente" value={form.cliente_nome} onChange={e=>set("cliente_nome",e.target.value)} style={inputStyle}/>
        <input placeholder="CPF do cliente" value={form.cliente_cpf} onChange={e=>set("cliente_cpf",e.target.value)} style={inputStyle}/>
        <input placeholder="Telefone do cliente" value={form.cliente_telefone} onChange={e=>set("cliente_telefone",e.target.value)} style={inputStyle}/>
        <input placeholder="Cidade *" value={form.cidade} onChange={e=>set("cidade",e.target.value)} style={inputStyle}/>
        <input placeholder="Endereço" value={form.endereco} onChange={e=>set("endereco",e.target.value)} style={inputStyle}/>
        <select value={form.tipo} onChange={e=>{set("tipo",e.target.value);set("tipo_servico",e.target.value);}} style={{...inputStyle,appearance:"auto"}}>
          <option value="instalacao">Instalação</option>
          <option value="reparo">Reparo</option>
        </select>
        <select value={form.tipo_servico} onChange={e=>set("tipo_servico",e.target.value)} style={{...inputStyle,appearance:"auto"}}>
          <option value="instalacao">Instalação</option>
          <option value="reparo_sem_conexao">Reparo - Sem Conexão</option>
          <option value="reparo_lentidao">Reparo - Lentidão</option>
          <option value="reparo_intermitente">Reparo - Intermitente</option>
          <option value="migracao">Migração</option>
        </select>
        <input placeholder="CTO (ex: F09-C01)" value={form.cto} onChange={e=>set("cto",e.target.value)} style={inputStyle}/>
        <textarea placeholder="Observações" value={form.observacao} onChange={e=>set("observacao",e.target.value)} style={{...inputStyle,minHeight:80,resize:"vertical"}}/>
        <button onClick={handleCreate} disabled={loading} style={{ width:"100%",padding:16,background:loading?"#9CA3AF":"linear-gradient(135deg,#0EA5E9,#06B6D4)",color:"#fff",border:"none",borderRadius:16,fontSize:16,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:loading?"wait":"pointer",boxShadow:"0 4px 16px rgba(14,165,233,0.4)" }}>{loading?"Criando...":"Criar OS"}</button>
      </div>
    </div>
  );
}

function StatsPage({ ordens, user }) {
  const [stats,setStats]=useState(null);const [indicadores,setIndicadores]=useState(null);const [ld,setLd]=useState(true);
  useEffect(()=>{(async()=>{setLd(true);const[s,ind]=await Promise.all([user?.tipo==="tecnico"?api(`/os/estatisticas/tecnico/${user.id}`):Promise.resolve({ok:false}),api("/indicadores")]);if(s.ok)setStats(s.data);if(ind.ok)setIndicadores(ind.data);setLd(false);})();},[ordens,user]);
  const ganho=ordens.filter(os=>os.tecnico_id===user?.id&&(os.valor_liquido||os.valorPagamento)!=null).reduce((s,os)=>s+Number(os.valor_liquido||os.valorPagamento||0),0);
  return (
    <div style={{ padding:"0 16px 100px" }}>
      <h2 style={{ fontSize:20,fontWeight:800,color:"#111827",margin:"20px 0 16px",fontFamily:"'DM Sans',sans-serif" }}>Indicadores</h2>
      {user?.tipo==="tecnico"&&<div style={{ background:"linear-gradient(135deg,#0C4A6E,#0369A1)",borderRadius:20,padding:24,marginBottom:20,color:"#fff" }}><div style={{ fontSize:12,opacity:.8,fontFamily:"'DM Sans',sans-serif",marginBottom:4 }}>Ganho total</div><div style={{ fontSize:36,fontWeight:800,fontFamily:"'Space Mono',monospace" }}>R$ {ganho.toFixed(2)}</div></div>}
      {ld?<div style={{ textAlign:"center",padding:30 }}><div style={{ width:28,height:28,border:"3px solid #E5E7EB",borderTopColor:"#0EA5E9",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 10px" }}/></div>:stats&&(
        <div style={{ background:"#fff",borderRadius:16,padding:16,marginBottom:20,border:"1px solid #F3F4F6" }}><div style={{ fontSize:14,fontWeight:700,color:"#374151",fontFamily:"'DM Sans',sans-serif",marginBottom:12 }}>Suas Estatísticas</div><div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>{[{label:"Total OS",value:stats.totalOS,color:"#6B7280"},{label:"Executadas",value:stats.executadas,color:"#10B981"},{label:"Taxa Sucesso",value:stats.taxaSucesso,color:"#0EA5E9"},{label:"Impedimentos",value:stats.impedidas,color:"#EF4444"}].map((s,i)=>(<div key={i} style={{ background:"#F9FAFB",borderRadius:12,padding:12,textAlign:"center" }}><div style={{ fontSize:20,fontWeight:800,color:s.color,fontFamily:"'Space Mono',monospace" }}>{s.value}</div><div style={{ fontSize:10,color:"#9CA3AF",fontFamily:"'DM Sans',sans-serif",fontWeight:600 }}>{s.label}</div></div>))}</div></div>
      )}
      {indicadores&&indicadores.length>0&&<div style={{ background:"#fff",borderRadius:16,padding:16,border:"1px solid #F3F4F6" }}><div style={{ fontSize:14,fontWeight:700,color:"#374151",fontFamily:"'DM Sans',sans-serif",marginBottom:12 }}>Ranking Técnicos</div>{indicadores.map((t,i)=>(<div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<indicadores.length-1?"1px solid #F3F4F6":"none" }}><div style={{ display:"flex",alignItems:"center",gap:10 }}><div style={{ width:32,height:32,borderRadius:10,background:t.tecnico===user?.nome?"#F0F9FF":"#F9FAFB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:t.tecnico===user?.nome?"#0EA5E9":"#9CA3AF",fontFamily:"'Space Mono',monospace" }}>{i+1}</div><div><div style={{ fontSize:13,fontWeight:600,color:"#374151",fontFamily:"'DM Sans',sans-serif" }}>{t.tecnico} {t.tecnico===user?.nome&&"⭐"}</div><div style={{ fontSize:11,color:"#9CA3AF",fontFamily:"'DM Sans',sans-serif" }}>{t.executadas}/{t.totalOS} executadas</div></div></div><span style={{ fontSize:12,fontWeight:700,color:parseFloat(t.percentualImpedimento)>30?"#EF4444":"#10B981",fontFamily:"'Space Mono',monospace" }}>{t.percentualImpedimento}%</span></div>))}</div>}
    </div>
  );
}

function ProfilePage({ user, onLogout }) {
  return (
    <div style={{ padding:"0 16px 100px" }}>
      <div style={{ textAlign:"center",padding:"30px 0 20px" }}>
        <div style={{ width:80,height:80,borderRadius:"50%",background:"linear-gradient(135deg,#0EA5E9,#06B6D4)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:800,color:"#fff",fontFamily:"'Space Mono',monospace",marginBottom:12 }}>{user?.nome?.charAt(0)||"?"}</div>
        <div style={{ fontSize:18,fontWeight:800,color:"#111827",fontFamily:"'DM Sans',sans-serif" }}>{user?.nome}</div>
        <div style={{ fontSize:13,color:"#6B7280",fontFamily:"'DM Sans',sans-serif" }}>{user?.tipo==="empresa"?"Empresa":"Técnico FTTH"} · {user?.cidade||""}</div>
        <div style={{ fontSize:12,color:"#9CA3AF",fontFamily:"'DM Sans',sans-serif",marginTop:4 }}>{user?.email}</div>
      </div>
      <div style={{ background:"#fff",borderRadius:16,overflow:"hidden",border:"1px solid #F3F4F6" }}>
        {(user?.tipo==="empresa"?["Dados da empresa","Tabela de preços","Configurar IXC","Técnicos","Configurações"]:["Dados pessoais","Certificações","Equipamentos","Área de atuação","Configurações"]).map((item,i,arr)=>(
          <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",borderBottom:i<arr.length-1?"1px solid #F3F4F6":"none",cursor:"pointer" }}>
            <span style={{ fontSize:14,color:"#374151",fontFamily:"'DM Sans',sans-serif" }}>{item}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        ))}
      </div>
      <button onClick={onLogout} style={{ width:"100%",padding:14,marginTop:16,background:"none",border:"2px solid #EF4444",borderRadius:16,color:"#EF4444",fontSize:14,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer" }}>Sair da conta</button>
    </div>
  );
}

// ─── Map Page (Leaflet + OpenStreetMap) ────────────────────
function MapPage({ ordens, onTapOS, user }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [filter, setFilter] = useState("all");
  const [leafletReady, setLeafletReady] = useState(false);

  // Load Leaflet dynamically
  useEffect(() => {
    if (window.L) { setLeafletReady(true); return; }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLeafletReady(true);
    document.head.appendChild(script);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!leafletReady || !mapRef.current || mapInstanceRef.current) return;
    const L = window.L;
    const map = L.map(mapRef.current, { zoomControl: false }).setView([-22.6569, -43.3707], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);
    L.control.zoom({ position: "topright" }).addTo(map);
    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, [leafletReady]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !leafletReady) return;
    const L = window.L;
    const map = mapInstanceRef.current;

    // Clear old markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    const osComCoords = ordens.filter(os => os.latitude && os.longitude).filter(os => {
      if (filter === "all") return true;
      if (filter === "disponivel") return os.status === "disponivel";
      if (filter === "meus") return os.tecnico_id === user?.id;
      return true;
    });

    const statusMarkerColors = {
      disponivel: "#0EA5E9",
      em_execucao: "#F59E0B",
      executada: "#10B981",
      impedimento_cto_cheia: "#EF4444",
      impedimento_cliente_ausente: "#EF4444",
    };

    const bounds = [];

    osComCoords.forEach(os => {
      const lat = Number(os.latitude);
      const lng = Number(os.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const color = statusMarkerColors[os.status] || "#6B7280";
      const icon = L.divIcon({
        className: "os-marker",
        html: `<div class="os-marker-inner" style="background:${color}">${TIPO_ICONS[os.tipo] || "📄"}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const valor = os.valor_liquido || os.valorPagamento;
      const popup = L.popup({ className: "os-popup", offset: [0, -10] }).setContent(`
        <div style="padding:12px;font-family:'DM Sans',sans-serif">
          <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:4px">${TIPO_LABELS[os.tipo_servico || os.tipoServico] || os.tipo_servico}</div>
          <div style="font-size:11px;color:#9CA3AF;margin-bottom:6px">OS #${os.id} · CTO ${os.cto || "—"}</div>
          <div style="font-size:12px;color:#6B7280;margin-bottom:4px">📍 ${os.cidade}${os.endereco ? " · " + os.endereco : ""}</div>
          ${os.cliente_nome ? `<div style="font-size:11px;color:#9CA3AF;margin-bottom:6px">👤 ${os.cliente_nome}</div>` : ""}
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
            <span style="font-size:10px;font-weight:700;color:${color};background:${color}18;padding:2px 8px;border-radius:10px;text-transform:uppercase">${STATUS_LABELS[os.status] || os.status}</span>
            ${valor != null ? `<span style="font-size:16px;font-weight:800;color:#111827;font-family:'Space Mono',monospace">R$ ${Number(valor).toFixed(0)}</span>` : ""}
          </div>
        </div>
      `);

      const marker = L.marker([lat, lng], { icon }).addTo(map).bindPopup(popup);
      marker.on("click", () => marker.openPopup());
      markersRef.current.push(marker);
      bounds.push([lat, lng]);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [ordens, filter, leafletReady, user]);

  const osComCoords = ordens.filter(os => os.latitude && os.longitude);
  const dispCount = osComCoords.filter(o => o.status === "disponivel").length;
  const meusCount = osComCoords.filter(o => o.tecnico_id === user?.id).length;

  return (
    <div style={{ position: "relative", height: "calc(100vh - 60px)", overflow: "hidden" }}>
      {/* Filter bar */}
      <div style={{ position: "absolute", top: 12, left: 12, right: 12, zIndex: 10, display: "flex", gap: 6 }}>
        {[
          { id: "all", label: `Todas (${osComCoords.length})` },
          { id: "disponivel", label: `Disponíveis (${dispCount})` },
          ...(user?.tipo === "tecnico" ? [{ id: "meus", label: `Meus (${meusCount})` }] : []),
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: "8px 12px", borderRadius: 12, border: "none",
            background: filter === f.id ? "#0EA5E9" : "#fff",
            color: filter === f.id ? "#fff" : "#6B7280",
            fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans',sans-serif",
            cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            whiteSpace: "nowrap",
          }}>{f.label}</button>
        ))}
      </div>

      {/* Legend */}
      <div style={{ position: "absolute", bottom: 16, left: 12, zIndex: 10, background: "#fff", borderRadius: 12, padding: "8px 12px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", display: "flex", gap: 10, fontSize: 10, fontFamily: "'DM Sans',sans-serif" }}>
        {[
          { color: "#0EA5E9", label: "Disponível" },
          { color: "#F59E0B", label: "Execução" },
          { color: "#10B981", label: "Executada" },
          { color: "#EF4444", label: "Impedida" },
        ].map((l, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: l.color }} />
            <span style={{ color: "#6B7280", fontWeight: 600 }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* No coords warning */}
      {osComCoords.length === 0 && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 10, background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📍</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#374151", fontFamily: "'DM Sans',sans-serif", marginBottom: 4 }}>Sem coordenadas</div>
          <div style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "'DM Sans',sans-serif" }}>As OS precisam de latitude/longitude para aparecer no mapa</div>
        </div>
      )}

      {/* Map container */}
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────
export default function App() {
  const [user,setUser]=useState(getUser());
  const [page,setPage]=useState("home");
  const [ordens,setOrdens]=useState([]);
  const [loading,setLoading]=useState(false);
  const [actionLoading,setActionLoading]=useState(false);
  const [detail,setDetail]=useState(null);
  const [toast,setToast]=useState(null);
  const [successModal,setSuccessModal]=useState(null);
  const [search,setSearch]=useState("");
  const [category,setCategory]=useState("all");

  const loadOrdens=useCallback(async()=>{
    if(!getToken())return;
    setLoading(true);
    const res=await api("/os");
    if(res.ok)setOrdens(res.data);
    else if(res.error?.includes("Token"))handleLogout();
    else setToast({message:`Erro: ${res.error}`,type:"error"});
    setLoading(false);
  },[]);

  useEffect(()=>{if(user)loadOrdens();},[user,loadOrdens]);

  const handleLogin=(u)=>{setUser(u);setPage("home");};
  const handleLogout=()=>{localStorage.removeItem("lampejo_token");localStorage.removeItem("lampejo_user");setUser(null);setOrdens([]);setPage("home");};

  const handleAction=async(action,extra={})=>{
    if(!detail)return;
    setActionLoading(true);
    if(action==="pegar"){
      const res=await api(`/os/${detail.id}/pegar`,{method:"POST",body:JSON.stringify({tecnicoId:user.id})});
      if(res.ok){setDetail(null);setSuccessModal({message:"OS Atribuída!",sub:`Você pegou a OS #${detail.id}.`});await loadOrdens();}
      else setToast({message:res.error,type:"error"});
    }
    if(action==="atualizar"){
      const res=await api(`/os/${detail.id}`,{method:"PUT",body:JSON.stringify({status:extra.status,observacao:extra.observacao||null,tecnicoId:user.id})});
      if(res.ok){setDetail(null);setSuccessModal({message:"OS Atualizada!",sub:`Status: ${STATUS_LABELS[extra.status]}`});await loadOrdens();}
      else setToast({message:res.error,type:"error"});
    }
    setActionLoading(false);
  };

  const myJobCount=ordens.filter(os=>os.tecnico_id===user?.id&&os.status==="em_execucao").length;

  if(!user) return <LoginPage onLogin={handleLogin} toast={toast} setToast={setToast}/>;

  return (
    <div style={{ maxWidth:480,margin:"0 auto",background:"#FAFBFC",minHeight:"100vh",fontFamily:"'DM Sans',sans-serif",position:"relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
        @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}body{margin:0;background:#F0F2F5}
        input::placeholder,textarea::placeholder{color:#9CA3AF}::-webkit-scrollbar{display:none}
        @keyframes popIn{from{transform:scale(0.8);opacity:0}to{transform:scale(1);opacity:1}}
        @keyframes slideDown{from{transform:translate(-50%,-20px);opacity:0}to{transform:translate(-50%,0);opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .leaflet-container{width:100%;height:100%;z-index:1}
        .os-marker{background:none;border:none}
        .os-marker-inner{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:3px solid #fff;cursor:pointer;transition:transform .2s}
        .os-marker-inner:hover{transform:scale(1.2)}
        .os-popup .leaflet-popup-content-wrapper{border-radius:14px;padding:0;overflow:hidden}
        .os-popup .leaflet-popup-content{margin:0;min-width:200px}
      `}</style>
      {toast&&<Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)}/>}
      {successModal&&<SuccessModal message={successModal.message} sub={successModal.sub} onClose={()=>{setSuccessModal(null);if(user?.tipo==="tecnico")setPage("myjobs");else setPage("home");}}/>}
      {detail&&<OSDetail os={detail} onBack={()=>setDetail(null)} onAction={handleAction} loading={actionLoading} user={user}/>}
      {page==="home"&&<HomePage ordens={ordens} loading={loading} onTapOS={setDetail} search={search} setSearch={setSearch} category={category} setCategory={setCategory} user={user}/>}
      {page==="mapa"&&<MapPage ordens={ordens} onTapOS={setDetail} user={user}/>}
      {page==="myjobs"&&<MyJobsPage ordens={ordens} user={user}/>}
      {page==="criar"&&<CriarOSPage onCreated={()=>{loadOrdens();setPage("home");}} setToast={setToast}/>}
      {page==="stats"&&<StatsPage ordens={ordens} user={user}/>}
      {page==="profile"&&<ProfilePage user={user} onLogout={handleLogout}/>}
      <BottomNav active={page} onNavigate={setPage} jobCount={myJobCount} userType={user?.tipo}/>
    </div>
  );
}
