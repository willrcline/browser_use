import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Collapse,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import type { Credential } from "../types";

type Props = {
  credentials: Credential[];
  setCredentials: (next: Credential[]) => void;
};

function newId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function CredentialManager({ credentials, setCredentials }: Props) {
  const [open, setOpen] = useState(false);
  const [showValues, setShowValues] = useState(false);

  const hasAny = credentials.length > 0;
  const header = useMemo(() => {
    if (!hasAny) return "Saved Credentials (none)";
    return `Saved Credentials (${credentials.length})`;
  }, [credentials.length, hasAny]);

  const addRow = () => {
    setCredentials([...credentials, { id: newId(), key: "", value: "" }]);
  };

  const updateRow = (id: string, patch: Partial<Credential>) => {
    setCredentials(
      credentials.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
  };

  const deleteRow = (id: string) => {
    setCredentials(credentials.filter((c) => c.id !== id));
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Button
          onClick={() => setOpen((v) => !v)}
          endIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          sx={{ textTransform: "none" }}
        >
          {header}
        </Button>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton
            size="small"
            onClick={() => setShowValues((v) => !v)}
            aria-label={
              showValues ? "Hide credential values" : "Show credential values"
            }
          >
            {showValues ? (
              <VisibilityOffOutlinedIcon />
            ) : (
              <VisibilityOutlinedIcon />
            )}
          </IconButton>
          <Button variant="outlined" size="small" onClick={addRow}>
            Add
          </Button>
        </Stack>
      </Stack>

      <Collapse in={open} timeout="auto" unmountOnExit>
        <Stack spacing={1} sx={{ mt: 1 }}>
          {!hasAny ? (
            <Typography variant="body2" color="text.secondary">
              Add credentials as key/value pairs (e.g. GOOGLE_EMAIL,
              GOOGLE_PASSWORD). Values are stored in localStorage.
            </Typography>
          ) : null}

          {credentials.map((cred) => (
            <Stack
              key={cred.id}
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems="center"
            >
              <TextField
                label="Key"
                size="small"
                value={cred.key}
                onChange={(e) => updateRow(cred.id, { key: e.target.value })}
                fullWidth
              />
              <TextField
                label="Value"
                size="small"
                type={showValues ? "text" : "password"}
                value={cred.value}
                onChange={(e) => updateRow(cred.id, { value: e.target.value })}
                fullWidth
              />
              <IconButton
                size="small"
                onClick={() => deleteRow(cred.id)}
                aria-label="Delete credential"
              >
                <DeleteOutlineIcon />
              </IconButton>
            </Stack>
          ))}
        </Stack>
      </Collapse>
    </Box>
  );
}
