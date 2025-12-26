import { Box, Button, Stack, Typography } from "@mui/material";

type Props = {
  lines: string[];
  onClear: () => void;
};

export function LogViewer({ lines, onClear }: Props) {
  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        p: 1,
        height: 360,
        overflow: "auto",
        bgcolor: "background.paper",
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: 12,
        whiteSpace: "pre-wrap",
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1 }}
      >
        <Typography variant="subtitle2">Live Logs</Typography>
        <Button size="small" onClick={onClear} sx={{ textTransform: "none" }}>
          Clear
        </Button>
      </Stack>
      {lines.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No logs yet.
        </Typography>
      ) : (
        <Box component="pre" sx={{ m: 0 }}>
          {lines.join("\n")}
        </Box>
      )}
    </Box>
  );
}
