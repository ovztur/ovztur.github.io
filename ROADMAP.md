# MCU Tracker Ultimate — Roadmap

Current stable line: v1.6.x

## Release principles

- No EXE updater dependency for normal content/features.
- Keep `ovztur` as permanent primary admin.
- Admin Panel stays inside MCU Tracker.
- Never re-enable legacy publishers that can overwrite current app content.
- Prefer small modular JavaScript files for new features instead of repeatedly editing the core app body.
- Every release must include cache-busting version changes and a manifest update.
- Stability fixes have priority over new features.

## v1.6.14 — Stability & maintenance

Goal: freeze the current working Admin/account structure before larger features.

- Remove/retire obsolete one-off release workflows and temporary patch scripts.
- Remove unused legacy scripts from the app runtime.
- Add duplicate-module guards so a feature script cannot initialize twice.
- Add a small internal diagnostics/version panel for the primary admin.
- Keep account deletion rules unchanged:
  - normal users/admins may delete only their own account;
  - `ovztur` may delete other local accounts;
  - `ovztur` cannot be deleted.

## v1.7.0 — Home Dashboard

Goal: make the app feel like a real personal MCU hub rather than only a title list.

Planned dashboard cards:

- Continue Watching
- Recently Completed
- Favorites shortcut
- Overall MCU completion percentage
- Current level / rank / XP progress
- Latest earned trophy
- Infinity Stone progress

The dashboard should be the first screen after login and must not change existing progress data.

## v1.7.1 — Custom Watchlist

- Add “Watch Later” list independent of Favorites.
- One-click add/remove from movie and series cards.
- Separate Watchlist menu section.
- Optional manual ordering.

## v1.7.2 — Activity History

- Local timeline of meaningful actions:
  - movie completed
  - season completed
  - trophy unlocked
  - rating changed
  - favorite/watchlist changes
- Clear-history option.
- History remains local and private.

## v1.8.0 — Release Calendar

- Upcoming MCU movies and series view.
- Release-date countdowns.
- Filters for Movie / Series / Disney+ / Cinema.
- Data stored in a small remote JSON so dates can be updated without shipping an EXE.
- Avoid changing core app code when only release dates change.

## v1.8.1 — Notifications inside the app

- “Releases soon” badge.
- Optional reminder banner for titles approaching release.
- No operating-system notification permission required initially.

## v1.9.0 — Achievements 2.0

- More hidden trophies.
- Saga-completion trophies.
- Phase-completion trophies.
- Franchise-specific trophy chains.
- Trophy rarity indicator.
- Keep existing XP permanent/non-repeatable rules.

## v1.9.1 — Profile customization

- Local avatar selection.
- Profile banner/background.
- Favorite MCU character/title field.
- Showcase up to 3 trophies on profile.
- Theme selection per account.

## v1.9.2 — Advanced statistics

- Movies vs series completion split.
- Completion by Phase and Saga.
- Personal IMDb-rating distribution.
- Favorite franchises.
- Monthly/local activity summary when enough activity history exists.

## v2.0.0 — Optional cross-device accounts

This is intentionally postponed.

Only build this if true cross-device account management is wanted later. It would require a central backend/auth model instead of the current local-account architecture.

Potential features:

- Same account on multiple PCs.
- Synced progress, trophies, ratings and notes.
- Primary admin can manage users globally rather than only accounts stored on the current device.
- Cloud backup and restore.

This must be opt-in and designed separately from anonymous aggregate telemetry.

## Admin roadmap

### Near term

- Search/filter local accounts.
- Show app/content version and loaded modules.
- Safer admin action confirmations.
- One consistent admin UI implementation.

### Later, only with central accounts

- Global user directory.
- Remote ban/disable account.
- Remote password-reset flow.
- Cross-device role management.
- Global user counts instead of device-local counts.

## Priority order

1. v1.6.14 Stability & maintenance
2. v1.7.0 Home Dashboard
3. v1.7.1 Custom Watchlist
4. v1.7.2 Activity History
5. v1.8.0 Release Calendar
6. v1.8.1 In-app release reminders
7. v1.9.0 Achievements 2.0
8. v1.9.1 Profile customization
9. v1.9.2 Advanced statistics
10. v2.0.0 Optional cross-device architecture
