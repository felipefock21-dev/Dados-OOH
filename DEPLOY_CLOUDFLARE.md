📘 GUIA RÁPIDO - DEPLOY CLOUDFLARE
═══════════════════════════════════════════════════════════

✨ Seu projeto está pronto para Cloudflare!

## ⚡ 3 PASSOS PARA DEPLOY

### 1️⃣ OBTER GOOGLE SHEETS API KEY
```bash
# Acesse Google Cloud Console
https://console.cloud.google.com/

# 1. Crie um novo projeto
# 2. Ative "Google Sheets API"
# 3. Vá em Credenciais → Criar credencial → Chave de API
# 4. Copie a chave (API Key)
```

### 2️⃣ DEPLOY DO WORKER
```bash
# Instalar Wrangler
npm install -g @cloudflare/wrangler

# Fazer login (abre navegador)
wrangler login

# Adicionar secrets
wrangler secret put GOOGLE_SHEETS_API_KEY
# Cole a API Key quando solicitado

wrangler secret put GOOGLE_SHEETS_ID
# Cole: 1H3qFr2if6MdNN4ZZnrMidTq9kNpOdb6OY8ICAS9Gsj4

# Deploy do Worker
wrangler deploy

# Teste a URL que aparecer na mensagem
```

### 3️⃣ DEPLOY DO FRONTEND

#### Opção A: GitHub + Cloudflare Pages (RECOMENDADO)
```bash
# 1. Push para GitHub
git add .
git commit -m "Deploy Cloudflare"
git push origin main

# 2. Vá em https://dash.cloudflare.com/
# 3. Workers & Pages → Pages → Conectar GitHub
# 4. Selecione seu repositório
# 5. Build command: (deixe em branco)
# 6. Output directory: frontend
# 7. Deploy!
```

#### Opção B: Via CLI Wrangler
```bash
wrangler pages deploy frontend
```

## 🔗 ATUALIZAR FRONTEND

Depois do deploy, edite `frontend/script.js`:

```javascript
const API_BASE = 'https://seu-worker.seu-subdominio.workers.dev/api';
```

Substitua pela URL real do seu worker (aparece após `wrangler deploy`)

## ✅ PRONTO!

- **Frontend:** https://seu-projeto.pages.dev
- **API Worker:** https://seu-worker.seu-subdominio.workers.dev

## 📝 ESTRUTURA FINAL

```
Dados-OOH/
├── frontend/          ← Deploy em Pages
│   ├── index.html
│   ├── style.css
│   └── script.js
├── src/               ← Deploy em Workers
│   └── index.js
├── wrangler.toml      ← Configuração Cloudflare
├── README.md
└── .gitignore
```

## 🚀 COMANDOS ÚTEIS

```bash
# Testar Worker localmente
wrangler dev

# Ver logs do Worker
wrangler tail

# Atualizar secrets
wrangler secret list
wrangler secret put CHAVE

# Deletar deployment
wrangler delete
```

## 💡 DICAS

✓ Workers são grátis até 100k requisições/dia
✓ Pages é grátis para repos públicos/privados
✓ Use secrets para dados sensíveis
✓ APIs sempre protegidas por HTTPS

## ⚠️ CHECKLIST ANTES DE DEPLOY

- [ ] Cloudflare account criada
- [ ] Google Sheets API Key obtida
- [ ] GOOGLE_SHEETS_ID verificado
- [ ] GitHub repo criado
- [ ] wrangler.toml revisado
- [ ] script.js com URL correta do worker

---

Qualquer dúvida: Consulte README.md ou Cloudflare docs
