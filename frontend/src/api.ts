import type { Credential } from "./types";

export const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export type RunEvents =
  | { type: "status"; data: string }
  | { type: "log"; data: string };

export async function stopTask(): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/stop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) return false;
  const json = (await res.json()) as { stopped?: boolean };
  return Boolean(json.stopped);
}

export function runTaskStream(args: {
  task: string;
  credentials: Credential[];
  onEvent: (evt: RunEvents) => void;
  onError: (err: unknown) => void;
  onDone: () => void;
}) {
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: args.task,
          credentials: args.credentials,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        throw new Error(`Run failed: ${res.status} ${text}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";

      const emit = (rawEvent: string) => {
        const lines = rawEvent.split("\n");
        let eventType = "message";
        const dataLines: string[] = [];

        for (const line of lines) {
          if (line.startsWith("event:")) {
            eventType = line.slice("event:".length).trim();
          } else if (line.startsWith("data:")) {
            dataLines.push(line.slice("data:".length).trimEnd());
          }
        }

        const data = dataLines.join("\n");
        if (eventType === "log") args.onEvent({ type: "log", data });
        else if (eventType === "status") args.onEvent({ type: "status", data });
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        while (true) {
          const idx = buffer.indexOf("\n\n");
          if (idx === -1) break;
          const raw = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          if (raw.trim().length === 0) continue;
          emit(raw);
        }
      }

      args.onDone();
    } catch (e) {
      if ((e as any)?.name === "AbortError") {
        args.onDone();
        return;
      }
      args.onError(e);
      args.onDone();
    }
  })();

  return {
    abort: () => controller.abort(),
  };
}
