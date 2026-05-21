Original prompt: cải thiện tách code refactor code

## Notes
- Initial project shape: almost all game UI, styling, and JavaScript logic live in `index.html`; `server.py` serves the static app and settings endpoint.
- Current goal: split code into clearer assets and make low-risk refactors while preserving gameplay behavior.
- Extracted inline CSS to `assets/css/game.css` and inline JavaScript to `assets/js/game.js`.
- Rebuilt extracted files with explicit UTF-8 handling after detecting mojibake from the first PowerShell extraction.
- Consolidated duplicated CSS rules into `assets/css/game.css` with shared CSS variables.
- Split game script into ES modules under `assets/js/`: config, state, entities, dungeon/FOV, UI, renderer, input, and gameplay orchestration.
- Removed runtime CDN dependencies by replacing Tailwind usage with the local utility subset used by this page and adding a data favicon.
- Validation passed: JS module syntax check, `python -m py_compile server.py`, and Playwright smoke test through Edge with keyboard movement plus `render_game_to_text`.
- Follow-up fix: restored combat/XP visual feedback after module split by queueing damage, hit, and XP effects until after the board re-renders.
- Follow-up validation passed: browser test injected adjacent enemies and confirmed damage text, hit/attack animations, floating XP text, XP bar pulse, and no console errors.

## TODO
- [x] Extract inline styles into a stylesheet.
- [x] Extract inline game script into a JavaScript file.
- [x] Refactor repeated DOM/item logic where safe.
- [x] Run syntax/static checks and a browser smoke test.
