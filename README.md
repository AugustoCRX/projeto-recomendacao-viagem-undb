# Smart Travel Planner ✈️

Sistema completo de planejamento de viagens com inteligência artificial, comparação de destinos, conversão de câmbio e gestão de roteiros.

## Visão Geral

O Smart Travel Planner é uma aplicação full-stack que permite criar e gerenciar viagens com auxílio de IA. O usuário pode planejar roteiros, salvar lugares de interesse, comparar destinos e converter moedas — tudo em uma interface moderna e responsiva.

## Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| **Autenticação** | Cadastro, login, sessão persistente via JWT, troca de senha |
| **Gestão de Viagens** | Criar, editar, excluir e visualizar viagens com foto de capa e detalhes |
| **Planejador com IA** | Geração de roteiro completo via Gemini + LangGraph com base em preferências |
| **Lugares Salvos** | Marcar e gerenciar pontos de interesse por tipo (restaurante, hotel, atrativo…) |
| **Comparador de Destinos** | Comparar dois destinos lado a lado (clima, custo, idioma, fuso etc.) |
| **Conversor de Câmbio** | Conversão em tempo real entre moedas via API externa |
| **Mapa Interativo** | Visualização de lugares no mapa com React Leaflet |
| **Perfil do Usuário** | Página de configurações para alterar senha |

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE                              │
│  React 19 + Vite  ──  CSS Modules  ──  React Router v7      │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS / REST
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                              │
│  FastAPI + SQLAlchemy  ──  JWT Auth  ──  LangGraph Agent    │
│                        │                                    │
│         Gemini API ◄───┘                                    │
└──────────────────────────┬──────────────────────────────────┘
                           │ PostgreSQL (Supabase)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      BANCO DE DADOS                         │
│  users · trips · places · itinerary_items                   │
└─────────────────────────────────────────────────────────────┘
```

**Deploy:**
- **Frontend** → Vercel (build estático + SPA routing via `vercel.json`)
- **Backend** → Render (container Python)
- **Banco** → Supabase (PostgreSQL gerenciado)

---

## Stack Tecnológica

### Frontend

| Tecnologia | Versão | Uso |
|---|---|---|
| React | 19 | UI framework |
| Vite | 8 | Build tool |
| React Router | v7 | Roteamento SPA |
| React Leaflet | latest | Mapas interativos |
| CSS Modules | — | Estilização escopada |
| Inter (Google Fonts) | — | Tipografia |

### Backend

| Tecnologia | Versão | Uso |
|---|---|---|
| Python | 3.11+ | Runtime |
| FastAPI | latest | API REST |
| SQLAlchemy | latest | ORM |
| Alembic | latest | Migrações |
| LangGraph | latest | Orquestração do agente IA |
| LangChain Google GenAI | latest | Integração com Gemini |
| python-jose | latest | JWT |
| passlib + bcrypt | latest | Hash de senha |
| psycopg2 | latest | Driver PostgreSQL |

---

## Estrutura do Projeto

```
projeto-recomendacao-viagem-undb/
├── backend/
│   ├── app/
│   │   ├── main.py                  # Entry point FastAPI
│   │   ├── database.py              # Configuração SQLAlchemy
│   │   ├── models.py                # Modelos ORM
│   │   ├── schemas.py               # Schemas Pydantic
│   │   ├── auth.py                  # Lógica JWT e hashing
│   │   ├── dependencies.py          # get_current_user
│   │   ├── urls.py                  # Registro de routers
│   │   └── routers/
│   │       ├── auth.py              # /api/v1/auth/*
│   │       ├── trips.py             # /api/v1/trips/*
│   │       ├── places.py            # /api/v1/places/*
│   │       ├── itinerary.py         # /api/v1/itinerary/*
│   │       └── ai_planner.py        # /api/v1/ai/*
│   ├── .env                         # Variáveis de ambiente (não commitado)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/              # Header, Layout, Sidebar
│   │   │   └── ui/                  # Button, Badge, Spinner, PlaceCard…
│   │   ├── features/
│   │   │   ├── auth/                # AuthContext, serviços, hooks
│   │   │   ├── trips/               # TripCard, TripForm, hooks
│   │   │   ├── places/              # PlaceCard, PlaceForm
│   │   │   ├── currency/            # CurrencyConverter
│   │   │   └── ai-planner/          # AIPlannerForm, resultado
│   │   ├── pages/
│   │   │   ├── Home/                # Lista de viagens
│   │   │   ├── Login/               # Autenticação
│   │   │   ├── Register/            # Cadastro
│   │   │   ├── TripDetail/          # Detalhe da viagem
│   │   │   ├── Comparator/          # Comparação de destinos
│   │   │   └── Profile/             # Configurações do usuário
│   │   ├── router/                  # ProtectedRoute, index.jsx
│   │   ├── constants/               # ROUTES, API URLs
│   │   └── styles/                  # index.css, tokens CSS
│   ├── nginx.conf                   # Config nginx para Docker
│   ├── vercel.json                  # Rewrite SPA para Vercel
│   └── Dockerfile
└── docker-compose.yml               # Orquestração local (sem banco — usa Supabase)
```

---

## Banco de Dados

### Tabelas

#### `users`

| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID (PK) | Identificador único |
| name | VARCHAR | Nome do usuário |
| email | VARCHAR (unique) | E-mail de login |
| hashed_password | VARCHAR | Senha com bcrypt |
| created_at | TIMESTAMP | Data de criação |

#### `trips`

| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID (PK) | Identificador único |
| user_id | UUID (FK → users) | Dono da viagem |
| name | VARCHAR | Nome da viagem |
| destination | VARCHAR | Destino principal |
| start_date | DATE | Data de início |
| end_date | DATE | Data de término |
| budget | NUMERIC | Orçamento estimado |
| status | VARCHAR | `planning`, `ongoing`, `completed` |
| cover_image_url | VARCHAR | URL da imagem de capa |
| notes | TEXT | Anotações livres |
| created_at | TIMESTAMP | Data de criação |

#### `places`

| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID (PK) | Identificador único |
| trip_id | UUID (FK → trips) | Viagem relacionada |
| name | VARCHAR | Nome do lugar |
| type | VARCHAR | `restaurant`, `hotel`, `attraction`, `other` |
| address | VARCHAR | Endereço |
| latitude | FLOAT | Coordenada lat |
| longitude | FLOAT | Coordenada lng |
| notes | TEXT | Observações |
| created_at | TIMESTAMP | Data de criação |

#### `itinerary_items`

| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID (PK) | Identificador único |
| trip_id | UUID (FK → trips) | Viagem relacionada |
| day | INTEGER | Dia do roteiro (1, 2, 3…) |
| time | VARCHAR | Horário sugerido |
| activity | TEXT | Descrição da atividade |
| place_id | UUID (FK → places) | Lugar vinculado (opcional) |
| created_at | TIMESTAMP | Data de criação |

---

## API Endpoints

### Autenticação — `/api/v1/auth`

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/register` | Cadastrar novo usuário | — |
| POST | `/login` | Login, retorna JWT | — |
| GET | `/me` | Retorna usuário logado | ✅ |
| PUT | `/change-password` | Alterar senha | ✅ |

### Viagens — `/api/v1/trips`

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/` | Listar viagens do usuário | ✅ |
| POST | `/` | Criar viagem | ✅ |
| GET | `/{trip_id}` | Detalhe da viagem | ✅ |
| PUT | `/{trip_id}` | Editar viagem | ✅ |
| DELETE | `/{trip_id}` | Excluir viagem | ✅ |

### Lugares — `/api/v1/places`

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/trip/{trip_id}` | Lugares de uma viagem | ✅ |
| POST | `/` | Adicionar lugar | ✅ |
| PUT | `/{place_id}` | Editar lugar | ✅ |
| DELETE | `/{place_id}` | Remover lugar | ✅ |

### Roteiro — `/api/v1/itinerary`

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/trip/{trip_id}` | Roteiro de uma viagem | ✅ |
| POST | `/` | Adicionar item | ✅ |
| PUT | `/{item_id}` | Editar item | ✅ |
| DELETE | `/{item_id}` | Remover item | ✅ |

### IA — `/api/v1/ai`

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/plan` | Gerar roteiro com IA (Gemini) | ✅ |

---

## Variáveis de Ambiente

### Backend (`backend/.env`)

```env
# Banco de dados (Supabase)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# JWT
SECRET_KEY=sua-chave-secreta-de-64-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Google Gemini
GOOGLE_API_KEY=sua-chave-gemini

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost,https://seu-frontend.vercel.app
```

### Frontend (`.env` ou variáveis Vercel)

```env
# URL do backend (vazio para Docker com nginx proxy, URL completa para Vercel)
VITE_API_BASE_URL=https://smart-travel-planner-api-4sx8.onrender.com

# Desativar mock e usar backend real
VITE_USE_BACKEND=true
VITE_MOCK_AUTH=false
```

> **Nota:** No ambiente Docker, `VITE_API_BASE_URL` deve ser vazio (`""`). O nginx faz o proxy de `/api/` para o container do backend internamente. No Vercel, deve conter a URL completa do Render.

---

## Como Executar

### Opção 1 — Docker (recomendado)

Requer Docker Desktop instalado e `backend/.env` configurado.

```bash
# Build e iniciar todos os serviços
docker compose up --build

# Acessar em http://localhost
```

Para reconstruir após mudanças:

```bash
docker compose down && docker compose up --build
```

### Opção 2 — Desenvolvimento Local

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt

# Configurar .env com DATABASE_URL, SECRET_KEY, GOOGLE_API_KEY
uvicorn app.main:app --reload --port 8000
```

Documentação interativa disponível em `http://localhost:8000/docs`.

**Frontend:**
```bash
cd frontend
npm install

# Criar .env.local
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_BACKEND=true
VITE_MOCK_AUTH=false

npm run dev
# Acessa em http://localhost:5173
```

### Opção 3 — Modo Demo (sem backend)

O frontend possui um mock completo. Todas as funcionalidades funcionam com dados simulados — sem necessidade de banco ou backend.

```bash
cd frontend
npm install
npm run dev
# VITE_MOCK_AUTH e VITE_USE_BACKEND omitidos = modo demo ativo
```

---

## Deploy

### Backend → Render

1. Criar um **Web Service** no Render apontando para o repositório
2. **Root Directory:** `backend`
3. **Build command:** `pip install -r requirements.txt`
4. **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Adicionar as variáveis de ambiente no painel: `DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `GOOGLE_API_KEY`, `CORS_ORIGINS`

### Frontend → Vercel

1. Importar o repositório no Vercel
2. **Root Directory:** `frontend`
3. Adicionar variáveis de ambiente:
   - `VITE_API_BASE_URL` = URL do serviço no Render (ex.: `https://smart-travel-planner-api-4sx8.onrender.com`)
   - `VITE_USE_BACKEND` = `true`
   - `VITE_MOCK_AUTH` = `false`
4. O arquivo `vercel.json` já está configurado com o rewrite necessário para SPA routing

---

## Fluxo do Planejador com IA

```
Usuário preenche preferências (destino, datas, interesses, orçamento)
        │
        ▼
POST /api/v1/ai/plan
        │
        ▼
LangGraph Agent
  ├── Node: parse_preferences    ← interpreta entrada do usuário
  ├── Node: research_destination ← Gemini pesquisa sobre o destino
  ├── Node: build_itinerary      ← Gemini monta roteiro dia a dia
  └── Node: format_response      ← estrutura JSON padronizado
        │
        ▼
JSON com dias, atividades, horários, dicas e sugestões
        │
        ▼
Frontend renderiza roteiro interativo com edição e salvamento
```

---

## APIs Externas

| Serviço | Uso |
|---|---|
| Google Gemini (gemini-2.0-flash) | Geração de roteiros com IA |
| ExchangeRate API | Taxas de câmbio em tempo real para o conversor |
| OpenStreetMap / Leaflet | Mapas interativos e visualização de lugares |
| Supabase | PostgreSQL gerenciado em produção |
| Unsplash (opcional) | Fotos de capa automáticas para viagens |

---

## Equipe

- **Augusto Cesar Rodrigues Xavier** — backend, modelos, infraestrutura
- **Stephanie Adriane** — frontend, autenticação, UI/UX
