# Strava integration

BETTER uses Strava OAuth 2.0. A user must explicitly authorise the application; a Strava account password is never collected by BETTER.

## Security requirement

The Strava Client Secret and athlete refresh tokens must only exist on a trusted server. Do not put them in browser JavaScript, GitHub Pages files, commits, or app configuration shipped to users. The Strava documentation states that the client secret must never be shared. Access tokens are short-lived and refresh tokens can rotate, so the server must persist the newest refresh token after every refresh.

## Required server endpoints

The browser integration expects same-origin endpoints:

- GET /api/strava/auth — create a random, one-time OAuth state value, store it server-side, and redirect to Strava authorization.
- GET /api/strava/callback — validate and consume state, exchange the code on the server, verify granted scopes, store tokens securely, and return the user to Athlete setup.
- POST /api/strava/sync — refresh an expired token if required, fetch the authenticated athlete's recent activities, and return a JSON object with an activities array.
- POST /api/strava/disconnect — revoke the token and delete stored credentials.

The sync response should include each activity's id, name, type, start_date_local and moving_time. BETTER uses the activity id to avoid duplicate imports. Imported activities have an estimated RPE until the athlete edits it; duration alone is not enough to infer physiological training load.

## Strava developer setup

1. Register BETTER at https://www.strava.com/settings/api.
2. Set the Authorization Callback Domain to the production host that serves the backend.
3. Configure the exact callback URL in the server environment.
4. Store STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET as server-side secrets, never in this repository.
5. Deploy the backend and a private token store before enabling the Connect button.
6. Request only the scopes required for activity reading. Check the scopes actually granted after authorisation.
7. Test authorisation, refresh-token rotation, denied consent, disconnect and duplicate-safe sync with a test account.

## Current repository status

The planner UI and local activity model are being built for this integration, but the Strava connection is not live until the secure endpoints above are deployed and configured. Do not describe it as connected before OAuth succeeds.

## Official references

- https://developers.strava.com/docs/authentication/
- https://developers.strava.com/docs/reference/
- https://developers.strava.com/docs/rate-limits/
