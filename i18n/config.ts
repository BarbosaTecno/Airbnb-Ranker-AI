
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const ptBR = {
  "login.title": "Ranker AI",
  "login.sub": "Otimização Elite Host",
  "login.button": "Entrar no Painel",
  "nav.dashboard": "Dashboard",
  "nav.users": "Usuários",
  "nav.logs": "Logs de Auditoria",
  "nav.chat": "Chat AI",
  "nav.profile": "Minha Conta",
  "nav.logout": "Sair da Conta",
  "chat.new": "Nova Consultoria",
  "chat.history": "Histórico de Análises",
  "chat.placeholder": "Link do anúncio ou pergunta estratégica...",
  "chat.typing": "Escrevendo...",
  "chat.empty": "Inicie seu Diagnóstico",
  "chat.empty.sub": "Escolha uma conversa ou comece uma nova consultoria estratégica.",
  "score.overall": "Score Geral",
  "score.cat.visuals": "Impacto Visual",
  "score.cat.copy": "Copy & Títulos",
  "score.cat.trust": "Confiança & Reviews",
  "score.cat.strategy": "Estratégia & Preço",
  "score.status.elite": "Anúncio Elite",
  "score.status.good": "Bom Potencial",
  "score.status.critical": "Risco de Ranking",
  "score.view.chat": "Ver Conversa",
  "score.view.stats": "Ver Score",
  "profile.title": "Minha Conta",
  "profile.language": "Idioma da Plataforma",
  "profile.security": "Segurança da Conta",
  "profile.update": "Atualizar Segurança",
  "admin.title": "Central de Comando",
  "admin.users.title": "Membros da Plataforma",
  "status.active": "Operacional",
  "status.paused": "Suspenso",
  "common.save": "Salvar",
  "common.loading": "Carregando..."
};

const enUS = {
  "login.title": "Ranker AI",
  "login.sub": "Elite Host Optimization",
  "login.button": "Enter Dashboard",
  "nav.dashboard": "Dashboard",
  "nav.users": "Users",
  "nav.logs": "Audit Logs",
  "nav.chat": "AI Chat",
  "nav.profile": "My Account",
  "nav.logout": "Logout",
  "chat.new": "New Consulting",
  "chat.history": "Analysis History",
  "chat.placeholder": "Listing link or strategic question...",
  "chat.typing": "Writing...",
  "chat.empty": "Start Your Diagnosis",
  "chat.empty.sub": "Choose a conversation or start a new strategic consultation.",
  "score.overall": "Overall Score",
  "score.cat.visuals": "Visual Impact",
  "score.cat.copy": "Copy & Titles",
  "score.cat.trust": "Trust & Reviews",
  "score.cat.strategy": "Strategy & Pricing",
  "score.status.elite": "Elite Listing",
  "score.status.good": "Good Potential",
  "score.status.critical": "Ranking Risk",
  "score.view.chat": "View Chat",
  "score.view.stats": "View Score",
  "profile.title": "My Account",
  "profile.language": "Platform Language",
  "profile.security": "Account Security",
  "profile.update": "Update Security",
  "admin.title": "Command Center",
  "admin.users.title": "Platform Members",
  "status.active": "Operational",
  "status.paused": "Suspended",
  "common.save": "Save",
  "common.loading": "Loading..."
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      'pt-BR': { translation: ptBR },
      'en-US': { translation: enUS },
    },
    lng: 'pt-BR',
    fallbackLng: 'en-US',
    interpolation: { escapeValue: false },
  });

export default i18n;
