
# 🚀 Guia de Produção - Airbnb Ranker AI

Siga este checklist para mover a aplicação do ambiente de teste para produção.

## 1. Banco de Dados (Cloud)
- Crie um banco MySQL (Recomendado: **Railway.app** ou **PlanetScale**).
- Pegue a `DATABASE_URL` (ex: `mysql://user:pass@host:port/db`).

## 2. Backend (Deploy)
1. Conecte seu repositório ao **Railway** ou **Render**.
2. Configure as Variáveis de Ambiente (Environment Variables):
   - `DATABASE_URL`: URL do seu banco cloud.
   - `API_KEY`: Sua chave do Google Gemini Studio.
   - `JWT_SECRET`: Uma string aleatória longa para segurança dos tokens.
   - `NODE_ENV`: `production`.
3. O comando de build deve ser: `npm install && npx prisma generate && npx prisma migrate deploy`.
4. O comando de start deve ser: `npm run server`.

## 3. Frontend (Deploy)
1. Faça o deploy na **Vercel** ou **Netlify**.
2. Configure as Variáveis de Ambiente no Painel:
   - `VITE_API_URL`: A URL do seu backend recém-criado (ex: `https://meu-api.railway.app`).
3. O comando de build é: `npm run build`.

## 4. Checklist de Segurança
- [ ] Mudar a senha de admin inicial (`Admin123!`) no primeiro acesso.
- [ ] Verificar se o CORS no `backend/server.ts` está apontando apenas para o seu domínio de frontend.
- [ ] Certificar-se que a API KEY não está exposta no código frontend (ela deve ficar apenas no backend).

## 5. Manutenção
- Use `npx prisma studio` localmente apontando para o banco de produção (com cautela) para gerenciar usuários manualmente se necessário.
