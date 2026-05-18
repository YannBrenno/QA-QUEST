# 🐛 QA Quest

> Jogo educativo multiplayer sobre Quality Assurance — encontre bugs em páginas web simuladas enquanto outros jogadores estão online ao mesmo tempo.

---

## 🚀 Stack

| Camada       | Tecnologia                    |
|--------------|-------------------------------|
| Frontend     | HTML + CSS + JavaScript (ESM) |
| Build        | Vite 5                        |
| Multiplayer  | Supabase Realtime             |
| Deploy       | Vercel                        |
| Persistência | localStorage + Supabase       |

---

## 📁 Estrutura

```
qa-quest/
├── src/
│   ├── assets/            # Imagens, sons (futuros)
│   ├── styles/
│   │   └── global.css     # Design system completo
│   ├── components/
│   │   ├── Toast.js       # Notificações
│   │   ├── Modal.js       # Modais genéricos
│   │   └── PlayerSprite.js # Renderizador de personagem
│   ├── screens/
│   │   ├── MenuScreen.js
│   │   ├── CharacterCreationScreen.js
│   │   ├── WorldScreen.js
│   │   ├── ChallengeScreen.js
│   │   ├── EndingScreen.js
│   │   └── CreditsScreen.js
│   ├── game/
│   │   └── WorldEngine.js  # Motor top-down canvas
│   ├── services/
│   │   ├── supabase.js     # Client Supabase
│   │   └── storage.js      # localStorage abstraction
│   ├── multiplayer/
│   │   ├── presence.js     # Online presence & heartbeat
│   │   └── nameValidator.js
│   ├── utils/
│   │   ├── uuid.js
│   │   └── throttle.js
│   └── main.js             # App router
├── public/
├── index.html
├── vite.config.js
├── vercel.json
├── package.json
├── .env.example
└── README.md
```

---

## ⚙️ Setup Local

```bash
# 1. Clone
git clone https://github.com/SEU_USUARIO/qa-quest.git
cd qa-quest

# 2. Instalar dependências
npm install

# 3. Configurar variáveis
cp .env.example .env
# Edite .env com suas credenciais do Supabase

# 4. Rodar
npm run dev
```

Abra http://localhost:5173

---

## 🗄️ Supabase — Setup

### 1. Criar projeto
- Acesse https://app.supabase.com
- Crie um novo projeto

### 2. Criar tabela

Execute no **SQL Editor**:

```sql
-- Tabela de jogadores online
create table if not exists players_online (
  id           text primary key,
  nickname     text not null,
  color        text not null default '#00e5ff',
  accessory    text not null default 'none',
  x            float8 not null default 200,
  y            float8 not null default 200,
  direction    float8 not null default 0,
  currentArea  text not null default 'lobby',
  lastSeen     timestamptz not null default now()
);

-- Index para buscas por área
create index if not exists idx_players_area on players_online(currentArea);
create index if not exists idx_players_seen on players_online(lastSeen);

-- RLS: acesso público (anon)
alter table players_online enable row level security;

create policy "Leitura pública" on players_online
  for select using (true);

create policy "Inserção pública" on players_online
  for insert with check (true);

create policy "Atualização do próprio" on players_online
  for update using (true);

create policy "Deleção do próprio" on players_online
  for delete using (true);
```

### 3. Habilitar Realtime

No Supabase Dashboard:
- Database → Replication → Realtime
- Habilite a tabela `players_online`

### 4. Copiar credenciais

Settings → API:
- `VITE_SUPABASE_URL` = Project URL
- `VITE_SUPABASE_ANON_KEY` = anon/public key

---

## 🌍 Deploy — Vercel

### Primeira vez

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Definir variáveis de ambiente
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

### Via GitHub (recomendado)

1. Faça push do projeto para GitHub
2. Acesse https://vercel.com/new
3. Importe o repositório
4. Adicione as variáveis de ambiente
5. Clique Deploy ✅

O `vercel.json` já está configurado com build e SPA rewrites.

---

## 🎮 Fluxo do Jogo

```
Menu → Criação de Personagem → Lobby (multiplayer)
                                    ↓
                              Mapa de Desafios
                                    ↓
                    ┌──────────────────────────────┐
                    │  5 Desafios de QA             │
                    │  (cada um sozinho)            │
                    │  1. Login Bugado (⭐)          │
                    │  2. Loja Virtual (⭐⭐)         │
                    │  3. Dashboard (⭐⭐⭐)           │
                    │  4. Formulário (⭐⭐⭐⭐)         │
                    │  5. Bug Final (⭐⭐⭐⭐⭐)         │
                    └──────────────────────────────┘
                                    ↓
                           Área Final (multiplayer)
                        "Novas aventuras em breve"
```

---

## 🔑 Regras de Presença

- Heartbeat a cada **20s**
- Jogador considerado online se `lastSeen < 5 minutos`
- Jogadores inativos somem automaticamente
- Nicknames livres após 5 minutos offline
- Jogadores só se enxergam na **mesma área**

---

## 📜 GitHub

```bash
git init
git add .
git commit -m "feat: QA Quest v1.0 — multiplayer QA game"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/qa-quest.git
git push -u origin main
```
