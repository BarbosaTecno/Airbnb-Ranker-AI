
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
// Fix: @ts-ignore used to bypass export member check for PrismaClient when generated types might not be present
// @ts-ignore
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { GoogleGenAI } from "@google/genai";
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'ranker_master_secret_2024';
const MAX_MESSAGES_PER_DAY = parseInt(process.env.MAX_MESSAGES_PER_DAY || '50');

// Inicialização do Gemini conforme diretrizes
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Fix: Cast helmet middleware to any to avoid PathParams type mismatch
app.use(helmet({ contentSecurityPolicy: false }) as any);
app.use(cors({ 
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173', 
  credentials: true 
}));
// Fix: Cast express.json to any to resolve overload resolution issues
app.use(express.json() as any);
// Fix: Cast cookieParser to any to resolve overload resolution issues
app.use(cookieParser() as any);

// Middleware de Autenticação
const authenticate = async (req: any, res: any, next: any) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ message: 'Não autorizado' });

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || user.status !== 'active') return res.status(403).json({ message: 'Acesso negado' });
    req.user = user;
    next();
  } catch (e) {
    res.status(403).json({ message: 'Sessão inválida' });
  }
};

// --- Autenticação ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    // Fix: Cast cookie options to any because 'sameSite' may not be present in the provided type definitions
    res.cookie('auth_token', token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      maxAge: 7 * 24 * 60 * 60 * 1000, 
      sameSite: 'lax' 
    } as any);
    res.json({ user: { id: user.id, email: user.email, role: user.role, status: user.status, locale: user.locale } });
  } catch (err) {
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
});

app.post('/api/auth/logout', (req, res) => res.clearCookie('auth_token').sendStatus(200));

app.get('/api/auth/me', authenticate, (req: any, res) => {
  const { passwordHash, ...safeUser } = req.user;
  res.json(safeUser);
});

// --- Conversas ---
app.get('/api/conversations', authenticate, async (req: any, res) => {
  const convs = await prisma.conversation.findMany({
    where: { userId: req.user.id },
    orderBy: { updatedAt: 'desc' }
  });
  res.json(convs);
});

app.post('/api/conversations', authenticate, async (req: any, res) => {
  const { title } = req.body;
  const conv = await prisma.conversation.create({
    data: { title: title || 'Nova Análise', userId: req.user.id }
  });
  res.json(conv);
});

app.get('/api/conversations/:id/messages', authenticate, async (req: any, res) => {
  const messages = await prisma.message.findMany({
    where: { conversationId: req.params.id, conversation: { userId: req.user.id } },
    orderBy: { createdAt: 'asc' }
  });
  res.json(messages);
});

// --- Chat com Gemini 3 Pro ---
app.post('/api/chat', authenticate, async (req: any, res) => {
  const { conversationId, message } = req.body;
  const today = new Date();
  today.setHours(0,0,0,0);

  try {
    const usage = await prisma.dailyUsage.upsert({
      where: { userId_day: { userId: req.user.id, day: today } },
      update: {},
      create: { userId: req.user.id, day: today }
    });

    if (usage.messagesCount >= MAX_MESSAGES_PER_DAY) {
      return res.status(429).json({ message: 'Limite diário de mensagens atingido.' });
    }

    // Chamada ao Gemini 3 Pro
    const result = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: message,
      config: {
        systemInstruction: `Você é o Airbnb Ranker AI, um consultor sênior de SEO e conversão para o Airbnb.
Sua missão é analisar links de anúncios ou descrições e fornecer um diagnóstico estratégico.
Siga rigorosamente esta estrutura:
1. Resumo Executivo: Visão geral da saúde do anúncio.
2. P0 (Críticos): Erros que estão matando o ranking ou a conversão (fotos ruins, falta de descrição, preços errados).
3. P1 (Importantes): Melhorias que trarão ganho real de posição no ranking em 30 dias.
4. P2 (Marginais): Detalhes que tornam o anúncio perfeito (copywriting, tags extras).
Mantenha um tom profissional, direto e acionável.`,
      }
    });

    const aiText = result.text || "Desculpe, não consegui processar a análise deste anúncio no momento.";
    
    // Persistir histórico
    await prisma.message.create({ data: { conversationId, role: 'user', content: message } });
    const aiMsg = await prisma.message.create({ 
      data: { conversationId, role: 'assistant', content: aiText } 
    });

    await prisma.conversation.update({ 
      where: { id: conversationId }, 
      data: { updatedAt: new Date() } 
    });

    await prisma.dailyUsage.update({ 
      where: { id: usage.id }, 
      data: { messagesCount: { increment: 1 } } 
    });

    res.json(aiMsg);
  } catch (err) {
    console.error('Gemini Error:', err);
    res.status(500).json({ message: 'Erro ao conectar com o motor de inteligência artificial.' });
  }
});

app.listen(PORT, () => console.log(`🚀 Ranker API rodando na porta ${PORT}`));
