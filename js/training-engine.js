(function(root){
"use strict";
function day(value){var p=String(value||"").split("-").map(Number);return p.length===3?Date.UTC(p[0],p[1]-1,p[2]):NaN;}
function score(s){return Math.max(0,Number(s.minutes||s.duration||0))*Math.max(1,Math.min(10,Number(s.rpe||5)));}
function analyse(data,todayISO){
 var now=day(todayISO),sessions=Array.isArray(data.sessions)?data.sessions:[],checkins=Array.isArray(data.checkins)?data.checkins:[],plan=data.plan||{};
 var valid=sessions.filter(function(s){var d=day(s.date);return Number.isFinite(d)&&d<=now&&d>=now-27*86400000;});
 var last7=valid.filter(function(s){return day(s.date)>=now-6*86400000;});
 var acute=last7.reduce(function(n,s){return n+score(s);},0),total28=valid.reduce(function(n,s){return n+score(s);},0),weeklyAverage=total28/4;
 var recent=checkins.filter(function(c){var d=day(c.date);return Number.isFinite(d)&&d<=now&&d>=now-2*86400000;}).sort(function(a,b){return day(b.date)-day(a.date);});
 var check=recent[0]||null,flags=check?[Number(check.fatigue)>=4,Number(check.sleep)<=2,Number(check.legs)<=2].filter(Boolean).length:0;
 var feedback=sessions.filter(function(s){return s.actualRecorded===true&&s.plannedRpe!=null&&Number.isFinite(Number(s.plannedRpe))&&Number.isFinite(Number(s.rpe))&&day(s.date)>=now-27*86400000&&day(s.date)<=now;}).sort(function(a,b){return day(b.date)-day(a.date);}).slice(0,6);
 var harder=feedback.filter(function(s){return Number(s.rpe)-Number(s.plannedRpe)>=2;}).length;
 var weeks=[3,2,1,0].map(function(w){var start=now-(w*7+6)*86400000,end=now-w*7*86400000;var group=sessions.filter(function(s){var d=day(s.date);return Number.isFinite(d)&&d>=start&&d<=end&&d<=now;});return {label:w===0?"This week":w+" wk ago",load:Math.round(group.reduce(function(n,s){return n+score(s);},0)),minutes:group.reduce(function(n,s){return n+Number(s.minutes||s.duration||0);},0),sessions:group.length};});
 var distribution={easy:0,moderate:0,hard:0},minutes={easy:0,moderate:0,hard:0};
 last7.forEach(function(s){var r=Number(s.rpe||5),k=r<=3?"easy":r<=6?"moderate":"hard";distribution[k]++;minutes[k]+=Number(s.minutes||s.duration||0);});
 var upcoming=[];Object.keys(plan).forEach(function(k){(plan[k]||[]).forEach(function(s){if(!s.completed&&s.date>=todayISO&&s.type==="Quality")upcoming.push(s);});});
 upcoming.sort(function(a,b){return a.date.localeCompare(b.date);});
 var status="Building baseline",message="Log a few sessions and recovery check-ins to establish a useful pattern.",reason="Not enough recent information for a meaningful recommendation.";
 if(flags>=2){status="Recovery focus";message="Your latest check-in shows several recovery warning signs. Consider replacing the next demanding session with rest or genuinely easy movement.";reason="At least two of fatigue, sleep quality and leg freshness are currently low.";}
 else if(harder>=2){status="Effort running high";message="At least two recent sessions felt much harder than planned. Review intensity and recovery before adding more work.";reason="Recent, explicitly recorded session feedback shows actual RPE at least 2 points above planned RPE.";}
 else if(flags===1){status="Monitor recovery";message="One recovery indicator is outside the preferred range. Keep the next session flexible and reassess before starting.";reason="One self-reported recovery indicator is currently low.";}
 else if(valid.length>=3){status="No clear warning";message="Recent records do not show a strong reason to change the plan. Keep following it while monitoring how sessions feel.";reason="Recent load and available recovery feedback do not trigger the conservative review rules.";}
 var readiness={label:"Building baseline",message:"Record recent check-ins to establish your normal pattern."};if(check){var lows=[Number(check.fatigue)>=4,Number(check.sleep)<=2,Number(check.legs)<=2].filter(Boolean).length;if(lows>=2)readiness={label:"Recovery first",message:"Several self-reported recovery indicators are low. Consider rest or easy movement rather than forcing intensity."};else if(lows===1)readiness={label:"Be flexible",message:"One recovery indicator is low. Reassess how you feel before committing to intensity."};else readiness={label:"No obvious warning",message:"Your latest check-in has no low recovery flags. This is not proof of full recovery; use how you feel."};}return {readiness:readiness,status:status,message:message,reason:reason,acute:Math.round(acute),weeklyAverage:Math.round(weeklyAverage),loadRatio:weeklyAverage>0?Math.round(acute/weeklyAverage*100)/100:null,sessionCount:last7.length,feedbackCount:feedback.length,harderCount:harder,flags:flags,distribution:distribution,minutes:minutes,weeks:weeks,nextQuality:upcoming[0]||null};
}
var api={analyse:analyse,sessionLoad:score};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.BETTERTrainingEngine=api;
})(typeof window!=="undefined"?window:globalThis);