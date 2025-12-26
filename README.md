# Browser Automation (Browser-Use)

General-purpose browser automation runner using [browser-use](https://github.com/browser-use/browser-use).

## Setup

1. Create / activate your venv (you already have `.venv`).
2. Install deps (you already did):

```bash
source .venv/bin/activate
uv pip install browser-use python-dotenv pydantic
uvx browser-use install
```

3. Put your API key in `.env`:

```env
BROWSER_USE_API_KEY=...
```

## Run

```bash
source .venv/bin/activate

python run_task.py "Search for best practices for prompt engineering and summarize 5 key bullets"
```

### Authenticated tasks (Google Drive)

This project defaults to using your **local Chrome profile** so you can stay logged in.

On macOS the defaults are:

- `CHROME_EXECUTABLE_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- `CHROME_USER_DATA_DIR=~/Library/Application Support/Google/Chrome`
- `CHROME_PROFILE_DIRECTORY=Default`

You can override via env vars in `.env` or via CLI flags:

```bash
python run_task.py \
  --chrome-user-data-dir "~/Library/Application Support/Google/Chrome" \
  --chrome-profile-directory "Profile 2" \
  "Go to Google Drive and create a Google Doc titled 'Research: X' and add a short summary with 3 sources"
```

### Switching computers / profiles later

Yes—it's easy:

- On a different computer, update the two values:
  - `CHROME_USER_DATA_DIR`
  - `CHROME_PROFILE_DIRECTORY`
- Or just pass `--chrome-user-data-dir` and `--chrome-profile-directory`.

Tip: on Chrome, open `chrome://version` to see the **Profile Path**.

### Cloud browser option

If you want to run with Browser-Use Cloud (fast/stealth), use:

```bash
python run_task.py --cloud "Your task"
```
