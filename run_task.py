from __future__ import annotations

import argparse
import asyncio
import os

from browser_use import Agent, Browser, ChatBrowserUse
from dotenv import load_dotenv
from browser_automation.config import AppConfig, ChromeProfileConfig
from browser_automation.tools import build_tools


def _ensure_browser_use_models_ready() -> None:
    """Work around Pydantic forward-ref initialization ordering in some installs."""

    try:
        from browser_use.tools.registry.service import Registry

        action_model = Registry().create_action_model()
        action_model.model_rebuild()
    except Exception:
        pass


def _parse_bool_env(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "y", "on"}


def load_config(args: argparse.Namespace) -> AppConfig:
    use_cloud_browser = _parse_bool_env("USE_CLOUD_BROWSER", False)
    if args.cloud:
        use_cloud_browser = True

    chrome = ChromeProfileConfig(
        executable_path=args.chrome_executable_path
        or os.getenv("CHROME_EXECUTABLE_PATH")
        or "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        user_data_dir=args.chrome_user_data_dir
        or os.getenv("CHROME_USER_DATA_DIR")
        or "~/Library/Application Support/Google/Chrome",
        profile_directory=args.chrome_profile_directory
        or os.getenv("CHROME_PROFILE_DIRECTORY")
        or "Default",
    )

    return AppConfig(use_cloud_browser=use_cloud_browser, chrome=chrome)


def build_browser(cfg: AppConfig) -> Browser:
    if cfg.use_cloud_browser:
        return Browser(use_cloud=True)

    return Browser(
        headless=False,
        executable_path=cfg.chrome.executable_path,
        user_data_dir=cfg.chrome.user_data_dir,
        profile_directory=cfg.chrome.profile_directory,
        window_size={"width": 1200, "height": 900},
    )


async def main_async() -> None:
    load_dotenv()
    _ensure_browser_use_models_ready()

    parser = argparse.ArgumentParser(description="General-purpose Browser-Use task runner")
    parser.add_argument("task", help="Natural language task to execute")
    parser.add_argument(
        "--cloud",
        action="store_true",
        help="Use Browser-Use Cloud browser (overrides USE_CLOUD_BROWSER)",
    )
    parser.add_argument("--chrome-executable-path")
    parser.add_argument("--chrome-user-data-dir")
    parser.add_argument("--chrome-profile-directory")
    parser.add_argument("--max-steps", type=int, default=80)
    args = parser.parse_args()

    cfg = load_config(args)
    tools = build_tools()
    browser = build_browser(cfg)

    llm = ChatBrowserUse()

    agent = Agent(
        task=args.task,
        llm=llm,
        browser=browser,
        tools=tools,
        max_steps=args.max_steps,
        use_vision="auto",
    )

    history = await agent.run()

    print("\n=== DONE ===")
    print(history.final_result())


def main() -> None:
    asyncio.run(main_async())


if __name__ == "__main__":
    main()
