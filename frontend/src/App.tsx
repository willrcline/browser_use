import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { CredentialManager } from "./components/CredentialManager";
import { LogViewer } from "./components/LogViewer";
import { runTaskStream, stopTask } from "./api";
import { useLocalStorage } from "./hooks/useLocalStorage";
import type { Credential, RunState } from "./types";

function sanitizeCredentials(creds: Credential[]) {
  return creds
    .map((c) => ({ ...c, key: c.key.trim() }))
    .filter((c) => c.key.length > 0);
}

function App() {
  const [task, setTask] = useState("");
  const [runState, setRunState] = useState<RunState>("idle");
  const [logLines, setLogLines] = useState<string[]>([]);

  const [credentials, setCredentials] = useLocalStorage<Credential[]>(
    "credentials",
    []
  );

  const [runHandle, setRunHandle] = useState<{ abort: () => void } | null>(
    null
  );

  const canRun = runState === "idle";
  const canStop = runState === "running";

  const trimmedTask = task.trim();
  const taskValid = trimmedTask.length > 0;

  const credentialPreview = useMemo(() => {
    const cleaned = sanitizeCredentials(credentials);
    if (cleaned.length === 0) return "No credentials saved.";
    return `Saved keys: ${cleaned.map((c) => c.key).join(", ")}`;
  }, [credentials]);

  const appendLog = (line: string) => {
    setLogLines((prev) => [...prev, line]);
  };

  const handleRun = async () => {
    if (!canRun) return;
    if (!taskValid) return;

    setRunState("running");
    setLogLines([]);

    const creds = sanitizeCredentials(credentials);
    appendLog(`Starting task: ${trimmedTask}`);
    appendLog(credentialPreview);

    const handle = runTaskStream({
      task: trimmedTask,
      credentials: creds,
      onEvent: (evt) => {
        if (evt.type === "status") {
          appendLog(`[status] ${evt.data}`);
        } else {
          appendLog(evt.data);
        }
      },
      onError: (err) => {
        appendLog(`[error] ${String((err as any)?.message ?? err)}`);
      },
      onDone: () => {
        setRunHandle(null);
        setRunState("idle");
      },
    });

    setRunHandle(handle);
  };

  const handleStop = async () => {
    if (!canStop) return;
    setRunState("stopping");

    appendLog("Stopping...");
    try {
      await stopTask();
    } catch (e) {
      appendLog(`[error] ${String((e as any)?.message ?? e)}`);
    }
    runHandle?.abort();
    setRunHandle(null);
    setRunState("idle");
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <Typography variant="h4" fontWeight={700}>
          Merry Christmas Kira
        </Typography>

        <Box>
          <TextField
            label="Task"
            placeholder='e.g. "Go to transform9.com and tell me what they sell"'
            value={task}
            onChange={(e) => setTask(e.target.value)}
            fullWidth
            multiline
            minRows={3}
          />
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button
              variant="contained"
              disabled={!canRun || !taskValid}
              onClick={handleRun}
            >
              Run Task
            </Button>
            <Button
              variant="outlined"
              color="error"
              disabled={!canStop}
              onClick={handleStop}
            >
              Stop
            </Button>
          </Stack>
        </Box>

        <CredentialManager
          credentials={credentials}
          setCredentials={setCredentials}
        />

        <LogViewer lines={logLines} onClear={() => setLogLines([])} />
      </Stack>
    </Container>
  );
}

export default App;
