from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ChromeProfileConfig:
    executable_path: str | None
    user_data_dir: str | None
    profile_directory: str | None


@dataclass(frozen=True)
class AppConfig:
    use_cloud_browser: bool
    chrome: ChromeProfileConfig

