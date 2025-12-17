## 🚀 DEPLOY NO CLOUDFLARE

Seu sistema está **100% pronto** para funcionar sem servidor local. Siga os passos abaixo:

### 1️⃣ Obter Google Sheets API Key

```bash
# Acesse Google Cloud Console
https://console.cloud.google.com/

# 1. Crie um novo projeto
# 2. Ative "Google Sheets API"
# 3. Vá em Credenciais → Criar credencial → Chave de API
# 4. Copie a chave
```

### 2️⃣ Instalar Wrangler

```bash
npm install -g @cloudflare/wrangler
```

### 3️⃣ Fazer Login no Cloudflare

```bash
wrangler login
# Abre navegador para autenticação
```

### 4️⃣ Adicionar Secrets do Google Sheets

```bash
# Adicionar chave da API
wrangler secret put GOOGLE_SHEETS_API_KEY
# Cole a chave quando solicitado

# Adicionar ID da planilha
wrangler secret put GOOGLE_SHEETS_ID
# Cole: 1H3qFr2if6MdNN4ZZnrMidTq9kNpOdb6OY8ICAS9Gsj4

# Adicionar nome da aba (opcional)
wrangler secret put GOOGLE_SHEET_NAME
# Cole: Visão geral
```

### 5️⃣ Deploy do Worker

```bash
wrangler deploy
```

Você verá uma URL como:
```
✨ Successfully published your Worker to
  https://dados-ooh-worker.seu-username.workers.dev
```

**Copie essa URL!**

### 6️⃣ Configurar Frontend para usar o Worker

Você tem 2 opções:

#### Opção A: Via localStorage (para teste rápido)
```javascript
// No console do navegador (F12)
localStorage.setItem('API_BASE', 'https://dados-ooh-worker.seu-username.workers.dev/api');
location.reload();
```

#### Opção B: Atualizar wrangler.toml para servir frontend

Modifique `wrangler.toml`:
```toml
name = "dados-ooh-worker"
main = "src/index.js"
compatibility_date = "2025-12-16"
compatibility_flags = ["nodejs_compat"]

# Servir frontend do Cloudflare Pages
[env.production]
name = "dados-ooh-worker-prod"
```

E deploy do frontend via Cloudflare Pages:
```bash
wrangler pages deploy ./
```

#### Opção C: Deploy via GitHub + Cloudflare Pages (RECOMENDADO)

1. Commit e push para GitHub:
```bash
git add .
git commit -m "Deploy Cloudflare"
git push origin main
```

2. Em https://dash.cloudflare.com/:
   - Vá em **Workers & Pages → Pages**
   - Clique em **Conectar GitHub**
   - Selecione seu repositório `Dados-OOH`
   - **Build command**: (deixe em branco)
   - **Output directory**: `.` (raiz)
   - Clique em **Deploy**

3. Cloudflare criará uma URL como:
```
https://dados-ooh-seu-username.pages.dev
```

4. No `index.html`, atualize a variável (ou use localStorage):
```javascript
// Automaticamente detecta a URL do worker ao carregar
```

### 7️⃣ Testar

Acesse:
- **Frontend local**: http://localhost:3001 (com API apontando para worker)
- **Frontend Pages**: https://dados-ooh-seu-username.pages.dev
- **API Worker**: https://dados-ooh-worker.seu-username.workers.dev/api/dados

### ✅ Verificar Logs

```bash
# Ver logs do worker em tempo real
wrangler tail

# Ver histórico de deploys
wrangler deployments list
```

### 🔄 Atualizar após mudanças

```bash
# Depois de fazer alterações:
git add .
git commit -m "Suas mudanças"
git push origin main

# Se usando wrangler deploy direto:
wrangler deploy
```

### 📝 Estrutura Final

```
Dados-OOH/
├── src/
│   └── index.js           ← Worker (deploy no Cloudflare Workers)
├── index.html             ← Frontend
├── script.js              ← Frontend logic
├── style.css              ← Estilos
├── wrangler.toml          ← Config Cloudflare
├── package.json
└── README.md
```

### 🎯 Resultado Final

- **Zero dependência** de servidor local
- **Autoscaling automático** no Cloudflare
- **Latência global** reduzida (CDN Cloudflare)
- **Sem custos** mensais (plano free do Cloudflare cobre bem)

---

**Dúvidas?** Verifique os logs com `wrangler tail`
