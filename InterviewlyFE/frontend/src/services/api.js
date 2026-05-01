const API_BASE_URL = import.meta.env.VITE_API_URL;
export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

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
    throw new Error(responseData?.message || `Request failed with status ${response.status}`);
  }

  return responseData;
}
