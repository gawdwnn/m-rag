import { Authorization } from '@/constants/authorization';
import authorizationUtil, {
  getAuthorization,
  redirectToLogin,
} from '@/utils/authorization-util';

type RequestOptions = {
  method?: string;
  data?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
};

type ApiData<T> = {
  data: T;
};

type ApiPayload<T> = ApiData<T> & ApiError;

export type RequestResult<T> = {
  data: ApiPayload<T>;
  response: Response;
};

type ApiError = {
  code?: number;
  error?: string;
  message?: string;
};

function withParams(url: string, params?: RequestOptions['params']) {
  if (!params) {
    return url;
  }
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `${url}?${query}` : url;
}

export async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { data } = await requestWithResponse<T>(url, options);
  return data.data;
}

async function requestWithResponse<T>(
  url: string,
  options: RequestOptions = {},
): Promise<RequestResult<T>> {
  const isFormData = options.data instanceof FormData;
  let body: BodyInit | undefined;
  if (isFormData) {
    body = options.data as FormData;
  } else if (options.data !== undefined) {
    body = JSON.stringify(options.data);
  }
  const headers = new Headers();
  const authorization = getAuthorization();
  if (authorization) {
    headers.set(Authorization, authorization);
  }
  if (options.data !== undefined && !isFormData) {
    headers.set('Content-Type', 'application/json');
  }

  const controller = options.timeoutMs ? new AbortController() : undefined;
  const timeoutId = options.timeoutMs
    ? window.setTimeout(() => controller?.abort(), options.timeoutMs)
    : undefined;
  let response: Response;
  try {
    response = await fetch(withParams(url, options.params), {
      method: options.method ?? 'GET',
      headers,
      body,
      signal: controller?.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out. Check API and Elasticsearch logs.');
    }
    throw error;
  } finally {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
  }

  if (response.status === 204) {
    return { data: { code: 0, data: undefined as T }, response };
  }

  const payload = (await response.json()) as ApiPayload<T>;

  if (!response.ok) {
    if (response.status === 401) {
      authorizationUtil.removeAll();
      redirectToLogin();
    }
    throw new Error(payload.error ?? `Request failed with ${response.status}`);
  }

  if (payload.code === 401) {
    authorizationUtil.removeAll();
    redirectToLogin();
    throw new Error(payload.message ?? payload.error ?? 'Authentication required.');
  }

  if (typeof payload.code === 'number' && payload.code !== 0) {
    throw new Error(payload.message ?? payload.error ?? `Request failed with code ${payload.code}`);
  }

  return { data: payload, response };
}

const requestClient = Object.assign(requestWithResponse, {
  get: <T>(url: string, options?: Omit<RequestOptions, 'method' | 'data'>) =>
    requestWithResponse<T>(url, { ...options, method: 'GET' }),
  post: <T>(url: string, options?: Omit<RequestOptions, 'method'>) =>
    requestWithResponse<T>(url, { ...options, method: 'POST' }),
  patch: <T>(url: string, options?: Omit<RequestOptions, 'method'>) =>
    requestWithResponse<T>(url, { ...options, method: 'PATCH' }),
  delete: <T>(url: string, options?: Omit<RequestOptions, 'method'>) =>
    requestWithResponse<T>(url, { ...options, method: 'DELETE' }),
});

export default requestClient;
