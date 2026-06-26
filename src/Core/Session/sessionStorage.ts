import type { LoginResponseDTO } from "../../Features/Users/Data/Models/LoginResponseDTO";

const USER_SESSION_KEY = "after.user.session";

export function getStoredUser() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(USER_SESSION_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as LoginResponseDTO;
  } catch {
    window.localStorage.removeItem(USER_SESSION_KEY);
    return null;
  }
}

export function persistUser(user: LoginResponseDTO) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(USER_SESSION_KEY);
}