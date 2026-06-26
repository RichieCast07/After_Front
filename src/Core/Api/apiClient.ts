type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: RequestMethod;
  body?: unknown;
  auth?: boolean;
}

function normalizeBaseUrl() {
  const configured = import.meta.env.VITE_API_URL ?? "http://localhost:8000/";
  return configured.endsWith("/") ? configured : `${configured}/`;
}

function buildUrl(path: string) {
  return new URL(path.replace(/^\//, ""), normalizeBaseUrl()).toString();
}

function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawSession = window.localStorage.getItem("after.user.session");
    if (!rawSession) {
      return null;
    }

    const parsed = JSON.parse(rawSession) as { token?: string };
    return parsed.token ?? null;
  } catch {
    return null;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null
        ? (() => {
            const typedPayload = payload as {
              error?: string;
              message?: string;
              details?: string[];
            };
            const baseMessage =
              typedPayload.error ??
              typedPayload.message ??
              "No fue posible completar la solicitud.";
            if (Array.isArray(typedPayload.details) && typedPayload.details.length > 0) {
              return `${baseMessage}: ${typedPayload.details.join(" | ")}`;
            }
            return baseMessage;
          })()
        : "No fue posible completar la solicitud.";

    throw new Error(message);
  }

  return payload as T;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const { method = "GET", body, auth = true } = options;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  return parseResponse<T>(response);
}