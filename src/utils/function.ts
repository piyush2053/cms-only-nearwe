export const getToken = (): string | null => {
  return window.localStorage.getItem("token");
};

export const setToken = (token: string): void => {
  window.localStorage.setItem("token", token);
};

export const removeToken = (): void => {
  window.localStorage.removeItem("token");
};
