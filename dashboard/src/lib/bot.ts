// Cliente server-side para la API admin del bot. NUNCA se importa en
// componentes de cliente: BOT_API_KEY es un secreto.

export class BotApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'BotApiError';
  }
}

function baseUrl(): string {
  const raw = process.env.BOT_API_URL;
  if (!raw) throw new Error('BOT_API_URL no está definida en el entorno.');
  return raw.replace(/\/+$/, '');
}

function apiKey(): string {
  const key = process.env.BOT_API_KEY;
  if (!key) throw new Error('BOT_API_KEY no está definida en el entorno.');
  return key;
}

const REQUEST_TIMEOUT_MS = 12_000;

async function botFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${baseUrl()}/api/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    cache: 'no-store',
    // Sin tope, una página queda colgada hasta que Vercel corta la función.
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = (await res.json()) as { message?: string };
      if (data?.message) message = data.message;
    } catch {
      // cuerpo no-JSON: nos quedamos con el status
    }
    throw new BotApiError(res.status, message);
  }
  return (await res.json()) as T;
}

export const botGet = <T>(path: string) => botFetch<T>(path);

export const botPatch = <T>(path: string, body: unknown) =>
  botFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) });

export type BotGuild = { id: string; name: string; icon: string | null; memberCount: number | null };
export type BotGuildsResponse = { guilds: BotGuild[] };
