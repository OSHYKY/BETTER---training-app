/*
BETTER Version 1 Logic

This file currently performs a simple proof-of-concept calculation.

Why:
The objective is to validate the workflow before building advanced
training generation systems.

Future versions:
- Base phase calculation
- Build phase calculation
- Peak phase calculation
- Taper calculation
- Fatigue balancing
- Calendar generation
*/

document.getElementById('generateBtn').addEventListener('click', () => {
const raceDate = new Date(document.getElementById('raceDate').value);
const today = new Date();
const diff = raceDate - today;
const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));

let phase = 'Base';

if (weeks <= 2) {
phase = 'Taper';
} else if (weeks <= 6) {
phase = 'Race Specific';
} else if (weeks <= 12) {
phase = 'Build';
}

document.getElementById('output').innerHTML =
'Weeks until race: ' + weeks + '<br>' +
'Suggested phase: ' + phase;
});