from __future__ import annotations

import asyncio
import os
import signal
import sys
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field


load_dotenv()

app = FastAPI(title="Browser Use UI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"] ,
    allow_headers=["*"],
)


class Credential(BaseModel):
    key: str
    value: str


class RunRequest(BaseModel):
    task: str
    credentials: list[Credential] = Field(default_factory=list)


class StopResponse(BaseModel):
    stopped: bool


@dataclass
class RunnerState:
    process: asyncio.subprocess.Process | None = None


STATE = RunnerState()


def _sse(data: str, event: str | None = None) -> str:
    lines: list[str] = []
    if event:
        lines.append(f"event: {event}")
    for part in data.splitlines() or [""]:
        lines.append(f"data: {part}")
    lines.append("")
    return "\n".join(lines) + "\n"


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/stop", response_model=StopResponse)
async def stop() -> StopResponse:
    proc = STATE.process
    if not proc or proc.returncode is not None:
        STATE.process = None
        return StopResponse(stopped=False)

    try:
        proc.send_signal(signal.SIGINT)
    except ProcessLookupError:
        STATE.process = None
        return StopResponse(stopped=False)

    return StopResponse(stopped=True)


@app.post("/run")
async def run(req: RunRequest):
    if STATE.process and STATE.process.returncode is None:
        raise HTTPException(status_code=409, detail="Task already running")

    task = req.task.strip()
    if not task:
        raise HTTPException(status_code=400, detail="task is required")

    # For now: pass all creds (LLM selection will be added next)
    sensitive_env: dict[str, str] = {}
    for c in req.credentials:
        k = c.key.strip()
        if not k:
            continue
        sensitive_env[k] = c.value

    async def stream():
        yield _sse("starting", event="status")

        env = os.environ.copy()
        # Make credentials available to run_task via environment for now
        # (we'll switch to Agent(sensitive_data=...) once we refactor run_task.py)
        for k, v in sensitive_env.items():
            env[f"CRED_{k}"] = v

        repo_root = Path(__file__).resolve().parents[1]
        run_task_path = repo_root / "run_task.py"
        repo_python = repo_root / ".venv" / "bin" / "python"
        python_exe = str(repo_python) if repo_python.exists() else sys.executable
        cmd = [python_exe, str(run_task_path), task]
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            env=env,
            cwd=str(repo_root),
        )
        STATE.process = proc

        assert proc.stdout is not None
        try:
            while True:
                line = await proc.stdout.readline()
                if not line:
                    break
                yield _sse(line.decode(errors="replace").rstrip("\n"), event="log")
        finally:
            await proc.wait()
            STATE.process = None

        yield _sse(f"exit:{proc.returncode}", event="status")

    return StreamingResponse(stream(), media_type="text/event-stream")
