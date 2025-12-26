from __future__ import annotations

from typing import Any

from browser_use import ActionResult, Tools


def build_tools() -> Tools:
    tools = Tools()

    @tools.action("Ask the human a question in the terminal (for 2FA codes, confirmations, etc.)")
    def ask_human(question: str, default: str | None = None) -> ActionResult:
        prompt = f"{question}"
        if default is not None:
            prompt = f"{prompt} (default: {default})"
        prompt = f"{prompt}\n> "
        answer = input(prompt).strip()  # noqa: S322
        if not answer and default is not None:
            answer = default
        return ActionResult(extracted_content=answer)

    @tools.action("Request a 2FA/verification code from the human")
    def get_2fa_code(service: str = "") -> ActionResult:
        label = service.strip() or "the service"
        code = input(f"Enter 2FA code for {label}:\n> ").strip()  # noqa: S322
        return ActionResult(extracted_content=code)

    @tools.action("Save text content to a local file")
    def save_text_file(path: str, content: str) -> ActionResult:
        from pathlib import Path

        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content, encoding="utf-8")
        return ActionResult(extracted_content=str(p))

    return tools
