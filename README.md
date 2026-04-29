# Travel Planner — Projeto de Recomendação de Viagem

Aplicação full-stack de planejamento e recomendação de viagens desenvolvida como projeto acadêmico na UNDB. Permite criar roteiros completos com itinerário dia a dia, exploração de pontos de interesse em mapa interativo, previsão do tempo e conversão de moedas para o destino.

---

## Stack

| Camada | Tecnologias |
|--------|-------------|
| Frontend | React 19, React Router 7, Vite 8, CSS Modules |
| Mapas | Leaflet + React-Leaflet 5, Overpass API (OpenStreetMap) |
| Backend | FastAPI, SQLAlchemy 2, Alembic, Python 3.11+ |
| Banco de dados | PostgreSQL (produção) / SQLite (dev) |
| Autenticação | JWT (python-jose) + bcrypt (passlib) |
| ML / IA | LangGraph, LangChain + Google Generative AI, scikit-learn (joblib) |
| APIs externas | OpenWeatherMap, Unsplash, ExchangeRate API, REST Countries |

---

## Estrutura do projeto

```
projeto-recomendacao-viagem-undb/
├── backend/
│   ├── app/
│   │   ├── api/routes/       # Rotas FastAPI
│   │   ├── core/             # config, security (JWT/bcrypt), logging, paginação
│   │   ├── middleware/       # JWTMiddleware
│   │   ├── models/           # ORM SQLAlchemy (User, Trip, Place, ItineraryItem)
│   │   └── services/         # Serviço de predição ML
│   └── tests/
├── frontend/
│   └── src/
│       ├── components/       # Layout, UI, Map compartilhados
│       ├── constants/        # URLs de API, rotas, enums
│       ├── features/         # Módulos por domínio (auth, trips, itinerary, map…)
│       ├── pages/            # Páginas do roteador
│       ├── router/           # Definição de rotas + ProtectedRoute
│       └── services/api/     # backendClient + integrações externas
└── db/
```

### Módulos do frontend (`src/features/`)

| Módulo | Componentes | Hooks | Serviço |
|--------|-------------|-------|---------|
| `auth` | — | `useAuth` | `authService` (mock + HTTP) |
| `trips` | TripCard, TripForm | useTrips, useTripDetail, useCreateTrip, useDestinationPhoto | `tripsRepository` (cache local ou HTTP) |
| `itinerary` | ActivityCard, ActivityForm, DayColumn | `useItinerary` | `itineraryCache` |
| `places` | PlaceCard | usePlaces, usePlacesByDestination | `placesCache` |
| `map` | — | useGeocode, useOverpassPlaces | Overpass API direto |
| `weather` | WeatherForecast, WeatherWidget | `useWeather` | OpenWeatherMap |
| `country` | CountryInfo | `useCountry` | REST Countries |

---

## Funcionalidades implementadas

### Frontend
- **Home** — listagem de viagens com filtro por status (planejando, confirmado, em andamento, concluído)
- **Criar viagem** — formulário com destino, datas, orçamento, moeda, notas e foto de capa automática (Unsplash)
- **Detalhe da viagem** — foto hero, previsão do tempo, dados do país, lugares por categoria (atrações, restaurantes, hospedagens)
- **Itinerário** — quadro kanban dia a dia com adição, edição e remoção de atividades
- **Mapa interativo** — mapa Leaflet com POIs do Overpass API, filtro por categoria, destaque de lugar selecionado
- **Autenticação** — páginas de login e cadastro com validação; `AuthContext` persiste token no `localStorage`; `ProtectedRoute` redireciona para `/login` se não autenticado
- **Modo mock** — variável `VITE_MOCK_AUTH=true` simula auth sem backend; `VITE_USE_BACKEND=true` ativa as chamadas reais para trips

### Backend
- **Modelos ORM** — `User`, `Trip`, `Place`, `ItineraryItem` mapeados para PostgreSQL
- **Segurança** — `hash_password`, `verify_password`, `create_access_token`, `verify_token` em `core/security.py`
- **JWT Middleware** — `JWTMiddleware` rejeita requisições sem token válido; paths públicos definidos em `PUBLIC_PATHS`
- **Rota de predição ML** — `POST /api/v1/predict` e `GET /api/v1/health` (modelo sklearn via joblib)

---

## Configuração

### Pré-requisitos
- Python 3.11+ com [uv](https://github.com/astral-sh/uv)
- Node.js 20+
- PostgreSQL (ou use SQLite para desenvolvimento local)

### Backend

```bash
cd backend

# criar ambiente e instalar dependências
uv venv && uv pip install -e ".[dev]"

# copiar e preencher variáveis de ambiente
cp .env.example .env

# rodar servidor de desenvolvimento
uvicorn app.main:app --reload --port 8000
```

Documentação interativa disponível em `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend

npm install

# copiar e preencher variáveis de ambiente
cp .env.example .env   # ou edite o .env existente

npm run dev   # http://localhost:5173
```

---

## Variáveis de ambiente

### Backend — `backend/.env`

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `SECRET_KEY` | Sim | Chave para assinar os JWTs |
| `DATABASE_URL` | Sim | Ex.: `postgresql://user:pass@localhost:5432/travel` |
| `DEBUG` | Não | `True` em desenvolvimento |
| `JWT_ALGORITHM` | Sim | Algoritmo JWT (ex.: `HS256`) |
| `ACCESS_TOKEN_EXPIRE_DAYS` | Sim | Validade do token em dias |

### Frontend — `frontend/.env`

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `VITE_API_BASE_URL` | Sim | URL base do backend (ex.: `http://localhost:8000`) |
| `VITE_MOCK_AUTH` | Não | `true` para usar auth em memória sem backend |
| `VITE_USE_BACKEND` | Não | `true` para buscar trips do backend (padrão: `localStorage`) |
| `VITE_OPENWEATHER_API_KEY` | Sim | Chave da API OpenWeatherMap |
| `VITE_UNSPLASH_ACCESS_KEY` | Sim | Chave da API Unsplash |
| `VITE_EXCHANGERATE_API_KEY` | Não | Chave da ExchangeRate API |

---

## Contrato de API

### Rotas públicas (sem autenticação)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/v1/auth/register` | Cadastro — `{ name, email, password }` |
| POST | `/api/v1/auth/login` | Login — `{ email, password }` |
| GET | `/api/v1/external/weather` | Proxy clima |
| GET | `/api/v1/external/places` | Proxy lugares |
| GET | `/api/v1/external/country` | Proxy dados do país |
| GET | `/api/v1/external/exchange` | Proxy câmbio |
| GET | `/api/v1/external/images` | Proxy Unsplash |
| GET | `/health` | Health check |

### Resposta de autenticação esperada

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "user": { "id": "<uuid>", "name": "...", "email": "..." }
}
```

### Rotas protegidas (requerem `Authorization: Bearer <token>`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/trips` | Listar viagens do usuário |
| POST | `/api/v1/trips` | Criar viagem |
| GET | `/api/v1/trips/:id` | Detalhe da viagem |
| PUT | `/api/v1/trips/:id` | Atualizar viagem |
| DELETE | `/api/v1/trips/:id` | Remover viagem |

### Modelos de dados (banco)

**Trip** — `id`, `user_id`, `name`, `destination`, `country`, `start_date`, `end_date`, `budget`, `currency` (padrão `BRL`), `status` (`planning` | `confirmed` | `ongoing` | `completed` | `cancelled`), `notes`, `cover_photo`

**Place** — `id`, `trip_id`, `user_id`, `name`, `address`, `lat`, `lng`, `category` (`tourist_attraction` | `restaurant` | `lodging` | `other`), `place_id` (ID do OSM/Google)

**ItineraryItem** — `id`, `trip_id`, `user_id`, `place_id?`, `date`, `time` (HH:mm), `title`, `description`, `order`

---

## Status de desenvolvimento

### Concluído
- [x] Estrutura monorepo backend/frontend
- [x] Modelos ORM (User, Trip, Place, ItineraryItem)
- [x] Infraestrutura JWT (security.py + JWTMiddleware)
- [x] Páginas de autenticação (Login, Register) com mock e modo HTTP
- [x] CRUD de viagens no frontend (com cache em `localStorage`)
- [x] Itinerário dia a dia (cache local)
- [x] Mapa interativo com Overpass API
- [x] Widgets de clima, info do país, conversão de moeda
- [x] `backendClient` com injeção automática de token e interceptor de 401

### Pendente no backend
- [ ] Adicionar `JWT_ALGORITHM` e `ACCESS_TOKEN_EXPIRE_DAYS` ao `config.py`
- [ ] Registrar `JWTMiddleware` no `main.py`
- [ ] Implementar rotas de autenticação (`/auth/register`, `/auth/login`)
- [ ] Implementar rotas CRUD de trips, places e itinerary items
- [ ] Migrations Alembic

### Pendente no frontend
- [ ] Ativar `VITE_USE_BACKEND=true` e conectar trips ao backend quando rotas estiverem prontas
- [ ] Serviço HTTP para itinerary items (atualmente só cache local)
- [ ] Serviço HTTP para places salvos por viagem

---

## Equipe

- Augusto Cesar Rodrigues Xavier — backend, modelos, infraestrutura
- Stephanie Adriane — frontend, autenticação, UI/UX
