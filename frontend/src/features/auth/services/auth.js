// Auth API service
// Endpoints esperados no backend:
//   POST /api/v1/auth/register  → { name, email, password }
//   POST /api/v1/auth/login     → { email, password }
// Resposta esperada: { access_token: string, token_type: "bearer", user: { id, name, email } }

import { API_BASE_URL } from '@/constants';

const AUTH_BASE = `${API_BASE_URL}/api/v1/auth`;
const USE_MOCK = import.meta.env.VITE_MOCK_AUTH === 'true';

// ── Mock (sem backend) ────────────────────────────────────────────────────────
// Simula registro e login em memória. Usuários criados ficam apenas na sessão.
const mockUsers = [];

function mockDelay() {
  return new Promise((resolve) => setTimeout(resolve, 400));
}

function makeMockToken(userId) {
  // Token falso só para satisfazer o fluxo — não é um JWT real.
  return `mock-token-${userId}-${Date.now()}`;
}

const mockService = {
  async register({ name, email, password }) {
    await mockDelay();
    if (mockUsers.find((u) => u.email === email)) {
      throw new Error('E-mail já cadastrado.');
    }
    const user = { id: crypto.randomUUID(), name, email };
    mockUsers.push({ ...user, password });
    return { access_token: makeMockToken(user.id), token_type: 'bearer', user };
  },

  async login({ email, password }) {
    await mockDelay();
    const found = mockUsers.find((u) => u.email === email && u.password === password);
    if (!found) throw new Error('E-mail ou senha incorretos.');
    const user = { id: found.id, name: found.name, email: found.email };
    return { access_token: makeMockToken(user.id), token_type: 'bearer', user };
  },
};

// ── Real HTTP service ─────────────────────────────────────────────────────────
async function authRequest(path, body) {
  const response = await fetch(`${AUTH_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail ?? data.message ?? `Erro ${response.status}`);
  }

  return data;
}

const httpService = {
  register: (payload) => authRequest('/register', payload),
  login: (payload) => authRequest('/login', payload),
};

// ── Export ────────────────────────────────────────────────────────────────────
export const authService = USE_MOCK ? mockService : httpService;
