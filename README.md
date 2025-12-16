# 📊 Gerenciador de Dados OOH

Sistema web para gerenciar dados de campanhas OOH (Out of Home) via **Google Sheets API** + **Cloudflare Workers**.

## 🚀 Funcionalidades

- ✅ **Listar** todos os registros
- ✅ **Criar** novos registros
- ✅ **Editar** registros existentes
- ✅ **Deletar** registros
- ✅ **Buscar/Filtrar** por qualquer campo
- ✅ **Integração com Google Sheets**
- ✅ **Interface responsiva e intuitiva**

## 📋 Estrutura de Dados

A planilha contém 20 colunas:

| Campo | Tipo | Exemplo |
|-------|------|---------|
| Cliente | Texto | Madeira Madeira |
| Status Cliente | Select | Ativo/Inativo |
| Campanha | Texto | julho 2025 |
| Tipo de OOH | Select | Outdoor, Dooh, etc |
| Status Campanha | Select | Ativa/Inativa |
| Região | Texto | Sudeste |
| Estado | Texto | SP |
| Cidade | Texto | São Paulo, SP |
| Exibidora | Texto | Helloo |
| URL logo exibidora | URL | (opcional) |
| Mês de exibição | Texto | Julho |
| Início da campanha | Data | 07/07 |
| Término da campanha | Data | 06/08 |
| Impactos Total | Número | 179712 |
| Investimento | Texto | R$ 5.700,00 |
| Mídia Coin | Número | 40714.29 |
| (NOTA) Bonificação | Número 0-10 | 10 |
| (NOTA) Flexibilidade | Número 0-10 | 5 |
| (NOTA) Atendimento | Número 0-10 | 9 |
| (NOTA) Processos ADM e FIN | Número 0-10 | 10 |

## 🛠️ Setup (Cloudflare)

### 1. Obter Google Sheets API Key

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto
3. Ative a API do Google Sheets
4. Crie uma chave de API (API Key) em Credenciais
5. Copie a chave gerada

### 2. Deploy Worker no Cloudflare

```bash
# Instalar Wrangler (CLI do Cloudflare)
npm install -g @cloudflare/wrangler

# Fazer login
wrangler login

# Adicionar variáveis de ambiente
wrangler secret put GOOGLE_SHEETS_API_KEY
# Cole sua API Key quando solicitado

wrangler secret put GOOGLE_SHEETS_ID
# Cole o ID da planilha: 1H3qFr2if6MdNN4ZZnrMidTq9kNpOdb6OY8ICAS9Gsj4

# Deploy
wrangler deploy
```

### 3. Deploy Frontend no Cloudflare Pages

```bash
# Opção 1: Via GitHub (recomendado)
# - Push para GitHub
# - Conecte ao Cloudflare Pages
# - Selecione pasta 'frontend'

# Opção 2: Via Wrangler
wrangler pages deploy frontend
```

### 4. Atualizar URL do Worker

No arquivo `frontend/script.js`, atualize:
```javascript
const API_BASE = 'https://seu-worker.seu-subdominio.workers.dev/api';
```

## 📡 APIs

As APIs rodam no **Cloudflare Worker** (sem servidor local necessário).

### GET `/api/dados`
Retorna todos os registros
```bash
curl https://seu-worker.workers.dev/api/dados
```

### GET `/api/dados/:id`
Retorna um registro específico
```bash
curl https://seu-worker.workers.dev/api/dados/0
```

### POST `/api/dados`
Cria um novo registro
```bash
curl -X POST https://seu-worker.workers.dev/api/dados \
  -H "Content-Type: application/json" \
  -d '{
    "Cliente": "Novo Cliente",
    "Campanha": "Nova Campanha",
    ...
  }'
```

### PUT `/api/dados/:id`
Atualiza um registro
```bash
curl -X PUT https://seu-worker.workers.dev/api/dados/0 \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### DELETE `/api/dados/:id`
Deleta um registro
```bash
curl -X DELETE https://seu-worker.workers.dev/api/dados/0
```

## 🔐 Segurança

✅ **Vantagens do Cloudflare:**
- Sem servidor próprio para gerenciar
- DDoS protection automático
- SSL/TLS por padrão
- Rate limiting configurável
- Secrets seguros (environment variables)

⚠️ **Notas de Segurança:**
- Use apenas API Key (não credentials JSON)
- A API Key fica protegida no Cloudflare Workers
- Configure CORS se necessário
- Considere adicionar autenticação se público

## 🌍 Deployment

### Frontend: Cloudflare Pages
```bash
# Via GitHub (recomendado)
1. Push para GitHub
2. Conecte repo ao Cloudflare Pages
3. Branch: main | Build command: npm run build | Output: frontend

# Via CLI
wrangler pages deploy frontend
```

### Backend: Cloudflare Workers
```bash
wrangler deploy
```

**Resultado:**
- Frontend: `https://seu-projeto.pages.dev`
- Worker API: `https://seu-worker.seu-subdominio.workers.dev`

## 📝 Notas

- Dados de exemplo são usados se Google Sheets não estiver configurado
- Busca funciona em tempo real
- Modal com validação de campos
- Design responsivo para mobile

## 🐛 Troubleshooting

**Erro: "API Key inválida"**
- Verifique se a API Key foi gerada corretamente no Google Cloud
- Confirme que a API do Google Sheets está ativada
- Use `wrangler secret put` para adicionar novamente

**Erro: "Spreadsheet not found"**
- Verifique se o GOOGLE_SHEETS_ID está correto
- Confirme que a planilha está acessível

**Erro: CORS error**
- Normalmente não ocorre com Cloudflare Workers
- Se ocorrer, verifique headers CORS no worker

**Frontend não carrega API**
- Atualize `script.js` com URL correta do worker
- Verifique se o worker foi deployado: `wrangler deploy`
- Teste direto a URL do worker no navegador

**Deploy falha**
```bash
# Verificar status
wrangler status

# Reinstalar dependências
npm install

# Deploy forçado
wrangler deploy --force
```

## 📞 Suporte

Qualquer dúvida, consulte os logs no console do navegador e do servidor.

---

**Status:** ✅ Funcional | **Última atualização:** Dezembro 2025
