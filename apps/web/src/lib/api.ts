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

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) {
        setApiToken(null);
        return null;
      }
      const data = await res.json();
      if (data?.accessToken) {
        setApiToken(data.accessToken);
        return data.accessToken;
      }
      return null;
    } catch {
      setApiToken(null);
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  return refreshPromise;
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
    // Automatically attempt silent refresh on 401 Unauthorized if not an auth endpoint
    if (
      response.status === 401 &&
      !endpoint.includes('/auth/refresh') &&
      !endpoint.includes('/auth/login') &&
      !endpoint.includes('/auth/register')
    ) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        headers.set('Authorization', `Bearer ${newToken}`);
        const retryResponse = await fetch(url, {
          ...options,
          headers,
          credentials: 'include',
        });
        if (retryResponse.ok) {
          if (retryResponse.status === 204) {
            return {} as T;
          }
          return retryResponse.json();
        }
      } else {
        // Session expired, redirect to login
        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/register')
        ) {
          window.location.href = '/login?expired=true';
        }
      }
    }

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
