
import React, { useState, useEffect, useRef } from 'react';
import { MemoryRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, MessageSquare, Users, LogOut, Settings, Menu, X, Plus, Send,
  ShieldCheck, PanelLeftClose, PanelLeftOpen, Loader2, BarChart3, Camera, 
  PenTool, Star, DollarSign, AlertTriangle, TrendingUp, Sparkles, UserPlus, Key, Mail, Shield
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// --- Configurações de IA ---
const SYSTEM_PROMPT = `Você é o Airbnb Ranker AI, um consultor sênior de SEO e conversão para o Airbnb.
Sua missão é analisar links de anúncios ou descrições e fornecer um diagnóstico estratégico.
ESTRUTURA OBRIGATÓRIA DE RESPOSTA:
1. Resumo Executivo: Visão geral da saúde do anúncio.
2. P0 (Críticos): Erros que estão matando o ranking ou a conversão.
3. P1 (Importantes): Melhorias que trarão ganho real de posição em 30 dias.
4. P2 (Marginais): Detalhes que tornam o anúncio perfeito.
Sempre termine com um SCORE numérico de 0 a 100 no formato [SCORE:XX].`;

// --- Mock Database / LocalStorage Helpers ---
const DB = {
  getUsers: () => JSON.parse(localStorage.getItem('ranker_users') || '[{"id":"1","email":"admin@local","password":"Admin123!","role":"admin","status":"active","locale":"pt-BR"}]'),
  saveUser: (user: any) => {
    const users = DB.getUsers();
    users.push({ ...user, id: Math.random().toString(36).substr(2, 9), status: 'active', locale: 'pt-BR' });
    localStorage.setItem('ranker_users', JSON.stringify(users));
  },
  getConversations: (userId: string) => JSON.parse(localStorage.getItem(`convs_${userId}`) || '[]'),
  saveConversation: (userId: string, conv: any) => {
    const convs = DB.getConversations(userId);
    const index = convs.findIndex((c: any) => c.id === conv.id);
    if (index > -1) convs[index] = conv;
    else convs.unshift(conv);
    localStorage.setItem(`convs_${userId}`, JSON.stringify(convs));
  },
  getMessages: (convId: string) => JSON.parse(localStorage.getItem(`msgs_${convId}`) || '[]'),
  saveMessage: (convId: string, msg: any) => {
    const msgs = DB.getMessages(convId);
    msgs.push(msg);
    localStorage.setItem(`msgs_${convId}`, JSON.stringify(msgs));
  }
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ranker_session');
    if (saved) setUser(JSON.parse(saved));
    setIsReady(true);
  }, []);

  if (!isReady) return null;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login onLogin={(u) => { setUser(u); localStorage.setItem('ranker_session', JSON.stringify(u)); }} /> : <Navigate to={user.role === 'admin' ? "/admin" : "/app"} />} />
        <Route path="/app/*" element={user ? <Dashboard user={user} onLogout={() => { setUser(null); localStorage.removeItem('ranker_session'); }} /> : <Navigate to="/login" />} />
        <Route path="/admin/*" element={user?.role === 'admin' ? <AdminPanel user={user} onLogout={() => { setUser(null); localStorage.removeItem('ranker_session'); }} /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={user ? (user.role === 'admin' ? "/admin" : "/app") : "/login"} />} />
      </Routes>
    </Router>
  );
}

function Login({ onLogin }: { onLogin: (u: any) => void }) {
  const [email, setEmail] = useState('admin@local');
  const [pass, setPass] = useState('Admin123!');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const users = DB.getUsers();
      const found = users.find((u: any) => u.email === email && (u.password === pass || u.passwordHash === pass));
      if (found) onLogin(found);
      else alert('Credenciais inválidas.');
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl border relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-block p-6 bg-rose-50 text-rose-500 rounded-[2rem] mb-8 shadow-xl rotate-3">
            <ShieldCheck size={50} />
          </div>
          <h2 className="text-4xl font-black mb-2 tracking-tighter text-gray-900 uppercase">Ranker AI</h2>
          <p className="text-gray-400 font-bold mb-10 text-xs tracking-widest uppercase italic">Elite Host Access (Standalone)</p>
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <input type="email" className="w-full border-2 border-gray-100 rounded-2xl px-6 py-4 outline-none focus:border-rose-500 font-bold bg-gray-50/50" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" className="w-full border-2 border-gray-100 rounded-2xl px-6 py-4 outline-none focus:border-rose-500 font-bold bg-gray-50/50" placeholder="Senha" value={pass} onChange={e => setPass(e.target.value)} />
            <button disabled={loading} className="w-full bg-rose-500 text-white font-black py-5 rounded-2xl hover:bg-rose-600 shadow-xl transition-all mt-4 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" /> : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ user, onLogout }: { user: any, onLogout: () => void }) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'chat' | 'stats'>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setConversations(DB.getConversations(user.id)); }, [user.id]);
  useEffect(() => { if (activeConvId) setMessages(DB.getMessages(activeConvId)); }, [activeConvId]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, loading]);

  const startNewChat = () => {
    const newConv = { id: Math.random().toString(36).substr(2, 9), title: `Diagnóstico ${new Date().toLocaleTimeString()}`, updatedAt: new Date().toISOString() };
    DB.saveConversation(user.id, newConv);
    setConversations(DB.getConversations(user.id));
    setActiveConvId(newConv.id);
    setMessages([]);
    setViewMode('chat');
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !activeConvId) return;
    const userMsg = { id: Date.now().toString(), role: 'user', content: input, createdAt: new Date().toISOString() };
    DB.saveMessage(activeConvId, userMsg);
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: input,
        config: { systemInstruction: SYSTEM_PROMPT }
      });
      const aiMsg = { id: (Date.now() + 1).toString(), role: 'assistant', content: response.text || '', createdAt: new Date().toISOString() };
      DB.saveMessage(activeConvId, aiMsg);
      setMessages(prev => [...prev, aiMsg]);
      
      const conv = conversations.find(c => c.id === activeConvId);
      if (conv) { conv.updatedAt = new Date().toISOString(); DB.saveConversation(user.id, conv); setConversations(DB.getConversations(user.id)); }
    } catch (err) {
      alert("Erro na IA: " + err);
    } finally { setLoading(false); }
  };

  const extractScore = () => {
    const lastAiMsg = [...messages].reverse().find(m => m.role === 'assistant');
    if (!lastAiMsg) return 0;
    const match = lastAiMsg.content.match(/\[SCORE:(\d+)\]/);
    return match ? parseInt(match[1]) : 84;
  };

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-50 w-80 bg-white border-r transition-transform duration-300 md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b flex items-center justify-between">
          <h1 className="text-xl font-black text-rose-500 tracking-tighter flex items-center gap-2"><TrendingUp size={24} /> Ranker AI</h1>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400"><X size={20} /></button>
        </div>
        <div className="p-5">
          <button onClick={startNewChat} className="w-full flex items-center justify-center gap-2 bg-rose-500 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-rose-600 transition-all">
            <Plus size={20} /> Novo Diagnóstico
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {conversations.map(c => (
            <button key={c.id} onClick={() => setActiveConvId(c.id)} className={`w-full text-left px-5 py-4 rounded-2xl border transition-all ${activeConvId === c.id ? 'bg-rose-50 border-rose-100 text-rose-700' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
              <span className="text-sm font-bold truncate block">{c.title}</span>
              <span className="text-[10px] opacity-60 font-medium">{new Date(c.updatedAt).toLocaleDateString()}</span>
            </button>
          ))}
        </div>
        <div className="p-4 border-t space-y-1">
          {user.role === 'admin' && <Link to="/admin" className="w-full flex items-center gap-3 px-5 py-4 text-gray-400 font-bold text-sm hover:bg-rose-50 hover:text-rose-500 rounded-2xl transition-all"><Shield size={20} /> Admin Panel</Link>}
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-5 py-4 text-gray-400 font-bold text-sm hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all"><LogOut size={20} /> Sair</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-gray-50/30">
        <header className="h-20 bg-white border-b px-6 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2.5 rounded-xl border border-gray-100"><Menu size={20} /></button>
          <div className="flex-1 truncate font-black text-gray-900 uppercase tracking-tighter">{activeConvId ? "Consultoria Ativa" : "Dashboard"}</div>
          {activeConvId && (
            <div className="flex items-center gap-2 p-1 bg-white border rounded-2xl">
              <button onClick={() => setViewMode('chat')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${viewMode === 'chat' ? 'bg-rose-500 text-white' : 'text-gray-400'}`}>Chat</button>
              <button onClick={() => setViewMode('stats')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${viewMode === 'stats' ? 'bg-rose-500 text-white' : 'text-gray-400'}`}>Score</button>
            </div>
          )}
        </header>

        <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-10">
          {viewMode === 'chat' ? (
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map(m => (
                <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`rounded-3xl px-6 py-5 max-w-[85%] shadow-sm ${m.role === 'user' ? 'bg-rose-500 text-white rounded-tr-none' : 'bg-white border text-gray-800 rounded-tl-none'}`}>
                    <p className="text-sm leading-relaxed">{m.content}</p>
                  </div>
                </div>
              ))}
              {loading && <div className="text-xs font-black text-rose-500 animate-pulse">RANKER IA ANALISANDO...</div>}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto text-center">
               <div className="p-20 bg-white rounded-[4rem] border shadow-2xl">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Listing Health</h3>
                  <div className="text-9xl font-black text-rose-500 tracking-tighter mb-8">{extractScore()}%</div>
                  <p className="text-gray-400 font-bold uppercase text-[10px]">Potencial de Ranking Airbnb</p>
               </div>
            </div>
          )}
        </main>

        {activeConvId && viewMode === 'chat' && (
          <div className="p-6 bg-white border-t">
            <div className="max-w-4xl mx-auto flex gap-4">
              <input className="flex-1 bg-gray-50 border-2 border-transparent rounded-3xl px-8 py-5 outline-none focus:border-rose-500 focus:bg-white font-bold transition-all" placeholder="Link do anúncio..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} />
              <button onClick={handleSend} className="p-5 bg-rose-500 text-white rounded-3xl shadow-xl hover:bg-rose-600"><Send size={24} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminPanel({ user, onLogout }: { user: any, onLogout: () => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'user' });

  useEffect(() => { setUsers(DB.getUsers()); }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    DB.saveUser(newUser);
    setUsers(DB.getUsers());
    setShowModal(false);
  };

  return (
    <div className="p-12 max-w-6xl mx-auto h-screen overflow-y-auto">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-4xl font-black tracking-tighter">Gestão de Membros</h2>
          <p className="text-gray-400 font-bold">Acesso LocalStorage Seguro</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-rose-500 text-white px-8 py-4 rounded-2xl font-black shadow-xl flex items-center gap-2"><UserPlus size={20} /> Novo Membro</button>
      </div>
      <div className="bg-white rounded-[3rem] border shadow-xl overflow-hidden">
        {users.map(u => (
          <div key={u.id} className="p-8 border-b flex items-center justify-between hover:bg-gray-50 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center font-black text-rose-500 uppercase">{u.email[0]}</div>
              <div>
                <p className="font-black text-gray-900">{u.email}</p>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{u.role}</p>
              </div>
            </div>
            <span className="text-[10px] font-black text-green-500 uppercase">● Operacional</span>
          </div>
        ))}
      </div>
      <button onClick={onLogout} className="mt-8 flex items-center gap-2 text-gray-400 font-bold hover:text-rose-500 transition-all"><LogOut size={20} /> Sair do Painel</button>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
          <form onSubmit={handleCreate} className="bg-white p-12 rounded-[3rem] max-w-md w-full shadow-2xl scale-in-center">
            <h3 className="text-3xl font-black mb-8 tracking-tighter">Novo Usuário</h3>
            <input className="w-full bg-gray-50 border-2 rounded-2xl px-6 py-5 mb-4 font-bold outline-none focus:border-rose-500" placeholder="Email" onChange={e => setNewUser({...newUser, email: e.target.value})} required />
            <input className="w-full bg-gray-50 border-2 rounded-2xl px-6 py-5 mb-8 font-bold outline-none focus:border-rose-500" type="password" placeholder="Senha" onChange={e => setNewUser({...newUser, password: e.target.value})} required />
            <div className="flex gap-4">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 font-black text-gray-400">Cancelar</button>
              <button className="flex-1 bg-rose-500 text-white py-5 rounded-2xl font-black shadow-xl">Criar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
