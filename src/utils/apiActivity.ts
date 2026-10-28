import axios, { type AxiosAdapter, type InternalAxiosRequestConfig } from "axios";

// ─── In-flight request tracking ──────────────────────────────────────────────
// Powers the global loading bar. Pages still show their own local loading UI;
// this is the always-on signal that "something is talking to the server".

let pending = 0;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

export const apiActivity = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => pending,
};

// ─── Duplicate request guard ─────────────────────────────────────────────────
// If an identical request (same method, URL, params and body) is already in
// flight, reuse its promise instead of sending a second one. This is the
// safety net against double-clicks creating duplicate records, on top of the
// per-button guards in the UI.

const inflight = new Map<string, ReturnType<AxiosAdapter>>();

const serializeBody = (data: unknown): string => {
  if (data == null) return "";
  if (typeof data === "string") return data;
  if (typeof FormData !== "undefined" && data instanceof FormData) {
    const parts: string[] = [];
    data.forEach((value, key) => {
      parts.push(
        value instanceof File
          ? `${key}=file:${value.name}:${value.size}:${value.lastModified}`
          : `${key}=${String(value)}`
      );
    });
    return parts.join("&");
  }
  try {
    return JSON.stringify(data);
  } catch {
    return String(Math.random()); // unserializable: never treat as duplicate
  }
};

const requestKey = (config: InternalAxiosRequestConfig) =>
  [
    (config.method || "get").toUpperCase(),
    config.baseURL || "",
    config.url || "",
    JSON.stringify(config.params ?? null),
    serializeBody(config.data),
    String(config.headers?.Authorization ?? ""),
  ].join("|");

let installed = false;

export const installApiActivity = () => {
  if (installed) return;
  installed = true;

  const baseAdapter = axios.getAdapter(axios.defaults.adapter);

  axios.defaults.adapter = (config) => {
    const key = requestKey(config);
    const existing = inflight.get(key);
    if (existing) return existing;

    pending += 1;
    emit();

    const request = baseAdapter(config).finally(() => {
      inflight.delete(key);
      pending = Math.max(0, pending - 1);
      emit();
    });

    inflight.set(key, request);
    return request;
  };
};
