# MCU Tracker publishing safety

Maintenance completed on 2026-08-12.

- All version-specific one-off v1.6.x publishing workflows were removed.
- Legacy app publisher remains disabled/manual-only and does not publish content.
- Bootstrap and v1.5.2 updater build workflows are manual-only; they do not run on push.
- Current app content is managed directly in `app/` and the active manifest remains `app/latest.json`.
- Do not reintroduce workflows that reconstruct or overwrite `app/index.html` from old payload files.
