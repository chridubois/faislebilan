// web/src/api/http.ts
export const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

function parseErrorBody(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function request<T>(
  path: string,
  init: RequestInit = {},
  opts?: { timeoutMs?: number; bearer?: string }
): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), opts?.timeoutMs ?? 15000);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (opts?.bearer) headers['Authorization'] = `Bearer ${opts.bearer}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(id);
  }

  const text = await res.text();
  if (!text) {
  // pas de body -> on retourne undefined
  return undefined as unknown as T
}
  const maybeJson = text ? parseErrorBody(text) : null;

  if (!res.ok) {
    const err: ApiError = {
      status: res.status,
      message:
        (maybeJson && (maybeJson.message || maybeJson.error || maybeJson.detail)) ||
        res.statusText ||
        'Request failed',
      details: maybeJson,
    };
    throw err;
  }

  return (maybeJson as T) ?? ({} as T);
}

// Helpers
export const get = <T>(path: string, bearer?: string) =>
  request<T>(path, { method: 'GET' }, { bearer });

export const post = <T>(path: string, body?: unknown, bearer?: string) =>
  request<T>(
    path,
    { method: 'POST', body: body ? JSON.stringify(body) : undefined },
    { bearer }
  );

export const patch = <T>(path: string, body?: unknown, bearer?: string) =>
  request<T>(
    path,
    { method: 'PATCH', body: body ? JSON.stringify(body) : undefined },
    { bearer }
  );

export const put = <T>(path: string, body?: unknown, bearer?: string) =>
  request<T>(
    path,
    { method: 'PUT', body: body ? JSON.stringify(body) : undefined },
    { bearer }
  );

export const del = <T>(path: string, bearer?: string) =>
  request<T>(path, { method: 'DELETE' }, { bearer });
