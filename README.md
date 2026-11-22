# BETTER Training App

BETTER is a local-first training planner for XC mountain bikers, with a separate interval-coach route.

## Current implementation

- Weekly calendar with week navigation.
- Athlete setup: event date, available weekly hours and training days.
- Existing sport commitments can be added to the calendar.
- Suggested sessions across quality, endurance, skills, strength and recovery.
- Session logging with duration and perceived effort (RPE).
- Simple workload estimate: duration in minutes × RPE.
- Fatigue indicators compare the last 7 days with the 28-day weekly average and include self-reported fatigue, sleep and leg freshness.
- Browser-local storage plus JSON backup export/import.
- Existing interval timer remains available at interval.html and continues to use js/app.js and css/styles.css.

## Run locally

Serve the repository over HTTP (for example, use the VS Code Live Server extension or Python's local HTTP server), then open the root page. Browser storage is local to that browser and device. Export a backup before clearing browser data or moving devices.

## Strava

The app-side sync client and integration contract are documented in docs/strava-integration.md. Live Strava authorisation is not enabled until a secure server implements the documented OAuth endpoints and stores tokens privately. Never put STRAVA_CLIENT_SECRET or athlete refresh tokens in this repository or browser code.

Official developer documentation: https://developers.strava.com/docs/authentication/

## Important limitations

The generated plan is a basic scheduling aid, not an individualized coaching prescription. The fatigue indicators are simple estimates, not validated medical or injury-risk measures. Imported Strava activities do not contain a reliable perceived-effort value, so BETTER assigns a provisional RPE that the athlete should edit. No Garmin integration or AI coach is claimed.

## Project structure

- index.html — training dashboard and weekly calendar
- interval.html — interval timer interface
- js/planner.js — planning, session logging, local persistence and Strava client
- js/app.js — existing interval timer logic
- css/planner.css — planner styles
- css/styles.css — interval timer styles
- docs/strava-integration.md — secure OAuth integration contract
