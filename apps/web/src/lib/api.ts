export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

let inMemoryToken: string | null = null;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export function getAccessToken(): string | null {
  return inMemoryToken;
}

export function setAccessToken(token: string | null) {
  inMemoryToken = token;
}

export function clearAccessToken() {
  inMemoryToken = null;
}

export async function refreshAccessToken(): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Phiên đăng nhập đã hết hạn.');
    }

    const data = await res.json();
    setAccessToken(data.accessToken);
    return data.accessToken;
  } catch (err) {
    clearAccessToken();
    throw err;
  }
}

export interface ApiOptions {
  headers?: Record<string, string>;
  skipAuth?: boolean;
  retryOn401?: boolean;
}

export async function api(
  path: string,
  method = 'GET',
  body?: any,
  options: ApiOptions = { retryOn401: true },
): Promise<any> {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const url = cleanPath.startsWith('http') ? cleanPath : `${API_BASE}/${cleanPath}`;

  const headers: Record<string, string> = {
    ...(options.headers || {}),
  };

  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (inMemoryToken && !options.skipAuth) {
    headers['Authorization'] = `Bearer ${inMemoryToken}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    credentials: 'include',
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
  };

  let response: Response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (networkError: any) {
    throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.');
  }

  // Handle 401 Unauthorized with token refresh and retry
  if (response.status === 401 && options.retryOn401 !== false && !cleanPath.startsWith('auth/login') && !cleanPath.startsWith('auth/refresh')) {
    if (isRefreshing) {
      // Queue this request until refresh is done
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: async (newToken: string) => {
            headers['Authorization'] = `Bearer ${newToken}`;
            try {
              const retryRes = await fetch(url, { ...fetchOptions, headers });
              const retryData = await retryRes.json();
              if (!retryRes.ok) {
                return reject(new Error(retryData.message || retryData.error || 'Thao tác thất bại.'));
              }
              resolve(retryData);
            } catch (retryErr) {
              reject(retryErr);
            }
          },
          reject: (err: any) => reject(err),
        });
      });
    }

    isRefreshing = true;

    try {
      const newToken = await refreshAccessToken();
      processQueue(null, newToken);
      headers['Authorization'] = `Bearer ${newToken}`;
      const retryRes = await fetch(url, { ...fetchOptions, headers });
      const retryData = await retryRes.json();
      if (!retryRes.ok) {
        throw new Error(retryData.message || retryData.error || 'Thao tác thất bại.');
      }
      return retryData;
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      throw refreshErr;
    } finally {
      isRefreshing = false;
    }
  }

  // Parse response
  let data: any;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg =
      (data && typeof data === 'object' && (data.message || data.error)) ||
      (typeof data === 'string' && data) ||
      `Yêu cầu thất bại (${response.status})`;
    throw new Error(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
  }

  return data;
}

export async function uploadFile(file: File, purpose: 'license' | 'evidence' | 'avatar'): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('purpose', purpose);

  return api('files', 'POST', formData);
}
