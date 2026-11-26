# BETTER Training App

BETTER is a local-first training planner designed around real-life sport commitments, event goals and individual training sessions.

## Features

- Weekly calendar with week navigation and editable daily agendas.
- Athlete setup for target events, available training days, weekly hours and fixed sport commitments.
- Suggested sessions with an event-focused build and taper.
- Custom workout designer: create reusable sessions with exercises, sets, reps/time, notes, duration and RPE; schedule saved workouts directly into the calendar.
- Workout reference library covering cycling, strength, skills and recovery.
- Session logging with duration, perceived effort (RPE), notes and planned-versus-actual feedback.
- Recovery check-ins for fatigue, sleep quality, leg freshness and actual sleep duration in hours.
- Fourteen-day fatigue and sleep-duration trend graphs in Analytics; missing days are not interpolated.
- Descriptive 7-day and 28-day workload trends and conservative training-response prompts. These are not validated medical or injury-risk scores.
- Browser-local storage and JSON backup export/import.
- Offline app shell through the service worker.
- Existing interval timer remains available at interval.html.

## Run locally

Serve the repository over HTTP (for example, use VS Code Live Server or Python's local HTTP server), then open the root page. Browser storage is local to that browser and device. Export a backup before clearing browser data or moving devices.

## Data and privacy

BETTER stores training data in this browser's local storage. There is no Strava connection or external account sync. Export a JSON backup to move data between devices.

## Training intelligence

- Session load is estimated as duration in minutes multiplied by session RPE.
- Recovery prompts use self-reported fatigue, sleep and leg-freshness check-ins alongside recent logged workload.
- A recovery adjustment is user-triggered, reduces only the next uncompleted quality session by 20%, and can be reversed.
- Marking a planned activity complete without entering actual effort records estimated load; editing a completed activity with actual duration/RPE records explicit feedback.
- Generated plans are scheduling aids, not individualized coaching prescriptions. Adjust for health, experience, other sport and how you actually feel.

## Project structure

- index.html — dashboard, athlete setup, weekly calendar and session log
- workout-builder.html — custom workout designer and calendar scheduling
- workouts.html — searchable workout reference library
- interval.html — interval timer
- js/planner.js — calendar, logging, recovery and local persistence
- js/workout-builder.js — reusable workout templates and scheduling
- js/training-engine.js — training-load and recovery analysis
- js/app.js — interval timer logic
- css/planner.css — planner styles
- css/builder.css — workout designer styles
- css/styles.css — interval timer styles
- sw.js — offline app-shell caching

## Automated checks

Run npm test with Node.js 20 or newer. Training and fatigue indicators are tracking aids, not medical advice or injury predictions.
