const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'request_failed' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function getFriendlyMessage(status) {
  if (status === 401) return 'Invalid email or password. Please try again.';
  if (status === 403) return 'This account cannot access this feature right now.';
  if (status === 409) return 'An account with these details already exists.';
  if (status === 422) return 'Some submitted details could not be accepted. Please review them and try again.';
  if (status >= 500) return 'Yoga Yen is temporarily unavailable. Please try again shortly.';
  return 'Unable to complete your request. Please check your details and try again.';
}

function getNetworkError(error, timeoutMessage = 'The request timed out. Please try again.') {
  if (error?.name === 'AbortError') {
    return new ApiError(timeoutMessage, { code: 'timeout' });
  }
  return new ApiError(
    'Unable to reach the Yoga Yen server. Make sure the backend is running, then try again.',
    { code: 'network_error' },
  );
}

async function parseJson(response) {
  if (response.status === 204 || !response.headers.get('content-type')?.includes('application/json')) return null;
  try {
    return await response.json();
  } catch {
    throw new ApiError('The server returned an unreadable response. Please try again.', {
      status: response.status,
      code: 'invalid_response',
    });
  }
}

export async function apiRequest(path, options = {}) {
  const { headers: requestHeaders = {}, ...requestOptions } = options;
  const isPublicAuthRequest = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
  ].includes(path);
  const storedToken = isPublicAuthRequest
    ? ''
    : sessionStorage.getItem('yoga-yen-token') || localStorage.getItem('yoga-yen-token');
  const requestToken = requestHeaders.Authorization || (storedToken ? `Bearer ${storedToken}` : '');
  const isMultipart = typeof FormData !== 'undefined' && requestOptions.body instanceof FormData;
  const headers = {
    ...(!isMultipart ? { 'Content-Type': 'application/json' } : {}),
    ...(requestToken ? { Authorization: requestToken } : {}),
    ...requestHeaders,
  };
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...requestOptions,
      headers,
      signal: controller.signal,
    });
    const payload = await parseJson(response);

    if (!response.ok) {
      if (response.status === 401 && requestToken) {
        sessionStorage.removeItem('yoga-yen-token');
        localStorage.removeItem('yoga-yen-token');
        window.location.assign('/login?session=expired');
        throw new ApiError('Your session expired. Please sign in again.', {
          status: 401,
          code: 'session_expired',
        });
      }
      throw new ApiError(getFriendlyMessage(response.status), {
        status: response.status,
        code: response.status === 401 ? 'invalid_credentials' : 'request_failed',
      });
    }

    return { ok: true, status: response.status, json: async () => payload };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw getNetworkError(error);
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function apiDownload(path) {
  const token = sessionStorage.getItem('yoga-yen-token') || localStorage.getItem('yoga-yen-token');
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new ApiError(
        response.status >= 500
          ? 'Yoga Yen is temporarily unavailable. Please try again shortly.'
          : 'Unable to download this report right now.',
        { status: response.status, code: 'download_failed' },
      );
    }
    return {
      blob: await response.blob(),
      filename: response.headers.get('content-disposition')?.match(/filename="?([^";]+)"?/i)?.[1]
        || 'yoga-yen-weekly-report.pdf',
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw getNetworkError(error, 'The report download timed out. Please try again.');
  } finally {
    window.clearTimeout(timeout);
  }
}
