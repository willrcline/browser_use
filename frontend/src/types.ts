export type Credential = {
  id: string;
  key: string;
  value: string;
};

export type RunState = "idle" | "running" | "stopping";
