import { getCurrentIdToken } from './authService';

// Default backend URL fallback if environment variable is not set
const DEFAULT_BACKEND_URL = 'http://localhost:5001/api';
const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || DEFAULT_BACKEND_URL;

/**
 * Custom Error class for API network and HTTP failures
 */
export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Core HTTP request handler
 *
 * @param {string} endpoint - Relative API endpoint (e.g., '/health')
 * @param {object} options - Fetch options (method, body, headers, requiresAuth)
 */
export const request = async (endpoint, options = {}) => {
  const {
    method = 'GET',
    body = null,
    headers = {},
    requiresAuth = false,
    timeoutMs = 15000,
  } = options;

  const url = `${BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

  const requestHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...headers,
  };

  // Attach Firebase ID token if authenticated or requested
  if (requiresAuth) {
    try {
      const token = await getCurrentIdToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    } catch (tokenErr) {
      console.warn('[API] Could not retrieve Firebase ID token:', tokenErr.message);
    }
  }

  const fetchConfig = {
    method,
    headers: requestHeaders,
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    fetchConfig.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  // Set up abort controller for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  fetchConfig.signal = controller.signal;

  try {
    const response = await fetch(url, fetchConfig);
    clearTimeout(timeoutId);

    // Parse JSON response safely
    let responseData = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      responseData = { message: text };
    }

    if (!response.ok) {
      const errorMessage =
        (responseData && responseData.message) ||
        `HTTP Error ${response.status}: ${response.statusText}`;
      throw new ApiError(errorMessage, response.status, responseData);
    }

    return responseData;
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof ApiError) {
      throw err;
    }

    // Check if the request was aborted due to timeout (AbortError, signal.aborted, or native Android fetch cancellation)
    const isTimeout =
      controller.signal.aborted ||
      err.name === 'AbortError' ||
      (err.message && (
        err.message.toLowerCase().includes('aborted') ||
        err.message.toLowerCase().includes('timeout') ||
        err.message.toLowerCase().includes('timed out')
      ));

    if (isTimeout) {
      const seconds = Math.round(timeoutMs / 1000);
      throw new ApiError(
        `Request timed out after ${seconds} seconds. Operations like AI checklist generation and live weather retrieval may take up to 30-45 seconds. Please try again.`,
        408
      );
    }

    // Network / connection refused error
    console.error(`[API Network Error] URL: ${url}`, err.message);
    throw new ApiError(
      `Unable to connect to PackWise server at ${url}. If testing on a physical device, ensure EXPO_PUBLIC_BACKEND_URL uses your computer's local IP address and port 5001.`,
      0
    );
  }
};

/**
 * Convenience HTTP GET
 */
export const get = (endpoint, options = {}) => {
  return request(endpoint, { ...options, method: 'GET' });
};

/**
 * Convenience HTTP POST
 */
export const post = (endpoint, body, options = {}) => {
  return request(endpoint, { ...options, method: 'POST', body });
};

/**
 * Health check helper to verify backend connectivity
 */
export const checkBackendHealth = async () => {
  try {
    const result = await get('health', { requiresAuth: false, timeoutMs: 5000 });
    return {
      connected: true,
      data: result,
      url: BASE_URL,
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
      status: error.status,
      url: BASE_URL,
    };
  }
};

export default {
  request,
  get,
  post,
  checkBackendHealth,
  BASE_URL,
};

