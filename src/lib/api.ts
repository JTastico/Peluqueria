// URL de la API: se define al compilar con VITE_API_URL (ver .env.example)
export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000/api";

const SESSION_KEYS = ["token", "user", "isAuthenticated", "userRole", "username", "localId", "trabajadorId"];

export const getToken = () => localStorage.getItem("token");

export const clearSession = () => SESSION_KEYS.forEach(k => localStorage.removeItem(k));

// Lee la fecha de expiración (claim `exp`) del JWT, solo para decidir en la interfaz si
// la sesión sigue vigente. La validación real la hace siempre el backend.
export const tokenExpirado = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

// Envuelve window.fetch: añade "Authorization: Bearer <token>" a las peticiones hacia la API
// y, si el servidor responde 401 (token vencido o inválido), cierra la sesión y manda al login.
export function installAuthFetch() {
  const original = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (!url.startsWith(API_URL)) return original(input, init);

    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await original(input, { ...init, headers });

    const esAuthPublica = url.includes("/auth/login") || url.includes("/auth/cambiar-password");
    if (res.status === 401 && !esAuthPublica && getToken()) {
      clearSession();
      window.location.assign("/login?expired=1");
    }

    return res;
  };
}
