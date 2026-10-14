const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let currentToken: string | null = null;

export function setApiToken(token: string | null) {
  currentToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('varta_token', token);
    } else {
      localStorage.removeItem('varta_token');
    }
  }
}

export function getApiToken(): string | null {
  if (currentToken) return currentToken;
  if (typeof window !== 'undefined') {
    currentToken = localStorage.getItem('varta_token');
  }
  return currentToken;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getApiToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // for HttpOnly refresh cookies
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      // not json
    }
    const message = errorData.message || response.statusText || 'Request failed';
    throw new ApiError(response.status, Array.isArray(message) ? message[0] : message, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
