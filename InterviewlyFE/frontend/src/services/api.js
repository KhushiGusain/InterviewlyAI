/**
 * API base URL from environment (Vite injects at build time).
 * - Local: set VITE_API_BASE_URL in .env or rely on dev default below.
 * - Production: set VITE_API_BASE_URL on the host (e.g. Vercel) to your deployed backend origin, no trailing slash.
 */
function resolveApiBaseUrl() {
  const fromEnv =
    import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  const trimmed = fromEnv != null ? String(fromEnv).trim().replace(/\/+$/, "") : "";
  if (trimmed) {
    return trimmed;
  }
  if (import.meta.env.DEV) {
    return "http://localhost:8080";
  }
  throw new Error(
    "Missing VITE_API_BASE_URL. Set it in your environment before building for production."
  );
}

const API_BASE_URL = resolveApiBaseUrl();

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("token");
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(options.headers || {}),
  };

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let responseData = null;
  const isJson = response.headers.get("content-type")?.includes("application/json");
  if (isJson) {
    responseData = await response.json();
  }

  if (!response.ok) {
    const error = new Error(responseData?.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return responseData;
}

export async function startInterview(interviewId) {
  const response = await apiRequest(`/interview/${interviewId}/start`, {
    method: "GET",
  });

  return response?.firstQuestion ?? response?.question ?? response;
}
