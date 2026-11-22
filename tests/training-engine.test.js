"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const engine=require("../js/training-engine.js");
const today="2026-11-22";
function fixture(){return {sessions:[],checkins:[],plan:{}};}
test("training load is duration multiplied by bounded RPE",()=>{assert.equal(engine.sessionLoad({minutes:30,rpe:7}),210);assert.equal(engine.sessionLoad({minutes:30,rpe:99}),300);});
test("two recent recovery flags recommend recovery focus",()=>{const d=fixture();d.checkins=[{date:today,fatigue:5,sleep:2,legs:2}];assert.equal(engine.analyse(d,today).status,"Recovery focus");});
test("stale check-ins do not drive current recommendations",()=>{const d=fixture();d.checkins=[{date:"2026-11-01",fatigue:5,sleep:1,legs:1}];assert.notEqual(engine.analyse(d,today).status,"Recovery focus");});
test("checkbox completion without actual feedback is excluded",()=>{const d=fixture();d.sessions=[{date:today,rpe:9,plannedRpe:5,actualRecorded:false},{date:"2026-11-21",rpe:9,plannedRpe:5,actualRecorded:false}];assert.equal(engine.analyse(d,today).harderCount,0);});
test("repeated high actual RPE recommends reviewing intensity",()=>{const d=fixture();d.sessions=[{date:today,rpe:9,plannedRpe:5,actualRecorded:true},{date:"2026-11-21",rpe:8,plannedRpe:5,actualRecorded:true}];assert.equal(engine.analyse(d,today).status,"Effort running high");});
test("four weekly buckets and intensity distribution are returned",()=>{const d=fixture();d.sessions=[{date:today,minutes:40,rpe:2},{date:today,minutes:20,rpe:5},{date:today,minutes:10,rpe:8}];const a=engine.analyse(d,today);assert.equal(a.weeks.length,4);assert.deepEqual(a.distribution,{easy:1,moderate:1,hard:1});});
test("planner parses and all static DOM references exist",()=>{const js=fs.readFileSync("js/planner.js","utf8");new Function(js);const html=fs.readFileSync("index.html","utf8");const ids=new Set(html.split('id="').slice(1).map(x=>x.split('"')[0]));const refs=js.split('$("').slice(1).map(x=>x.split('"')[0]);const missing=Array.from(new Set(refs.filter(id=>!ids.has(id))));assert.deepEqual(missing,[],"Missing HTML ids: "+missing.join(", "));});

test("service worker precaches planner, training engine and library assets",()=>{const sw=fs.readFileSync("sw.js","utf8");new Function(sw);for(const asset of ["./js/planner.js","./js/training-engine.js","./css/planner.css","./workouts.html","./js/workouts.js"])assert.ok(sw.includes(asset),"Missing offline asset: "+asset);});
