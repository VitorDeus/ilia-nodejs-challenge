let token: string | null = null;

export function getToken(): string | null {
  if (token) return token;
  return sessionStorage.getItem("token");
}

export function setToken(value: string): void {
  token = value;
  sessionStorage.setItem("token", value);
}

export function clearToken(): void {
  token = null;
  sessionStorage.removeItem("token");
}
