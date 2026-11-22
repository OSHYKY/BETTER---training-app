/* BETTER Training: weekly calendar, session log and recovery/load monitors. */
(function(){
"use strict";
var KEY="better.training.v1", $=function(id){return document.getElementById(id);};
var today=function(){var d=new Date();return new Date(d.getFullYear(),d.getMonth(),d.getDate());};
var iso=function(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");};
var date=function(s){var a=s.split("-").map(Number);return new Date(a[0],a[1]-1,a[2]);};
var plus=function(d,n){var x=new Date(d);x.setDate(x.getDate()+n);return x;};
var monday=function(d){return plus(d,-((d.getDay()+6)%7));};
var fresh=function(){return {profile:{event:"",eventDate:"",hours:6,days:[1,3,5,6],activities:[]},sessions:[],checkins:[],plan:{}};};
var data;try{data=Object.assign(fresh(),JSON.parse(localStorage.getItem(KEY)||"{}"));data.profile=Object.assign(fresh().profile,data.profile);}catch(e){data=fresh();}
var offset=0;
function save(){localStorage.setItem(KEY,JSON.stringify(data));$("saveState").textContent="Saved on this device";}
function msg(s){$("toast").textContent=s;$("toast").classList.add("show");setTimeout(function(){$("toast").classList.remove("show");},2400);}
function esc(s){return String(s||"").replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function load(s){return Number(s.minutes||s.duration||0)*Math.max(1,Number(s.rpe||5));}
function weekSessions(start,end){return data.sessions.filter(function(s){var d=date(s.date);return d>=start&&d<end;});}
function weekLoad(){var t=today(),a=weekSessions(plus(t,-6),plus(t,1)).reduce(function(n,s){return n+load(s);},0),b=weekSessions(plus(t,-27),plus(t,1)).reduce(function(n,s){return n+load(s);},0)/4;return {acute:a,base:b,ratio:b?a/b:null};}
function recovery(){var c=data.checkins.slice().sort(function(a,b){return b.date.localeCompare(a.date);})[0],w=weekLoad();if(c&&(c.fatigue>=5||c.sleep<=1||c.legs<=1))return "Recovery priority";if(w.ratio&&w.ratio>1.5)return "Recent load elevated";if(c&&c.fatigue>=4)return "Fatigue elevated";return data.sessions.length?"No flag raised":"Building baseline";}
function phase(start){if(!data.profile.eventDate)return "Base building";var days=Math.ceil((date(data.profile.eventDate)-start)/86400000);return days<8?"Race week":days<=21?"Taper":days<=56?"Specific build":"Base building";}
function makeWeek(start){var key=iso(start);if(data.plan[key])return data.plan[key];var p=data.profile,days=p.days.slice(),n=Math.max(1,days.length),mins=Math.round((Number(p.hours)||6)*60/n),slots=days.slice().sort(function(a,b){return ((b===0||b===6)?2:0)-((a===0||a===6)?2:0);}),hard=slots.slice(0,n>=4?2:1),arr=[];
for(var i=0;i<7;i++){var d=plus(start,i),dow=d.getDay(),fixed=p.activities.filter(function(a){return Number(a.day)===dow;});if(fixed.length){fixed.forEach(function(a){arr.push({date:iso(d),name:a.name,type:"Other sport",minutes:Number(a.minutes)||60,rpe:Number(a.rpe)||6,kind:"fixed"});});continue;}if(days.indexOf(dow)<0)continue;
var type="Skills",name="Skills and easy aerobic ride",duration=Math.min(60,mins),rpe=3;
if(phase(start)==="Race week"){type="Recovery";name="Easy spin or rest";duration=Math.min(35,mins);rpe=2;}
else if(hard.indexOf(dow)>=0){type="Quality";name="XC intervals / race-specific ride";duration=Math.min(90,mins);rpe=7;}
else if((dow===0||dow===6)&&mins>=75){type="Endurance";name="Aerobic endurance ride";duration=Math.min(150,mins);rpe=4;}
else if(dow%2===0){type="Strength";name="Strength and trunk stability";duration=Math.min(50,mins);rpe=5;}
arr.push({date:iso(d),name:name,type:type,minutes:duration,rpe:rpe,kind:"planned"});}
data.plan[key]=arr;return arr;}
function fmt(s){return date(s).toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"});}
function card(s){return '<article class="session-card"><div class="session-date">'+esc(fmt(s.date))+'</div><div><b>'+esc(s.name)+'</b><small>'+esc(s.type)+' · '+s.minutes+' min · RPE '+s.rpe+'</small></div><span class="tag">'+(s.kind==="fixed"?"Commitment":s.kind==="logged"?"Logged":"Planned")+'</span></article>';}
function render(){var t=today(),start=monday(plus(t,offset*7)),end=plus(start,7),plan=makeWeek(monday(t)),up=plan.filter(function(s){return s.date>=iso(t);}),logged=weekSessions(plus(t,-6),plus(t,1)),w=weekLoad();
$("metricEvent").textContent=data.profile.event||"Not set";$("metricCountdown").textContent=data.profile.eventDate?Math.ceil((date(data.profile.eventDate)-t)/86400000)+" days to event":"Add an event date";
$("metricSessions").textContent=up.length+" sessions";$("metricHours").textContent=(up.reduce(function(n,s){return n+s.minutes;},0)/60).toFixed(1)+" planned hours";
$("metricLogged").textContent=logged.reduce(function(n,s){return n+(s.minutes||s.duration||0);},0)+" min";$("metricLoad").textContent="7-day load "+Math.round(w.acute)+" · 28-day weekly avg "+Math.round(w.base);
$("metricWellness").textContent=recovery();$("metricWellnessNote").textContent="Based on logged load and your latest check-in";
$("upcomingList").innerHTML=up.length?up.slice(0,5).map(card).join(""):"No upcoming sessions. Set your availability.";
$("planPhase").textContent=phase(start);$("weekLabel").textContent=fmt(iso(start))+" – "+fmt(iso(plus(start,6)));
var days=[];for(var i=0;i<7;i++){var d=plus(start,i),ss=makeWeek(start).filter(function(s){return s.date===iso(d);});days.push('<section class="day-column"><header><b>'+d.toLocaleDateString("en-GB",{weekday:"short"})+'</b><span>'+d.getDate()+'</span></header>'+(ss.length?ss.map(function(s){return '<article class="calendar-session"><b>'+esc(s.name)+'</b><small>'+s.minutes+' min · RPE '+s.rpe+'</small></article>';}).join(""):'<small class="rest-day">Rest / free</small>')+'</section>');}
$("weekCalendar").innerHTML=days.join("");$("logMinutes").textContent=logged.reduce(function(n,s){return n+(s.minutes||s.duration||0);},0)+" min";$("logLoad").textContent=Math.round(logged.reduce(function(n,s){return n+load(s);},0));$("logCount").textContent=logged.length;
var all=data.sessions.slice().sort(function(a,b){return b.date.localeCompare(a.date);});$("logList").innerHTML=all.length?all.map(function(s){return '<article class="session-card"><div class="session-date">'+esc(fmt(s.date))+'</div><div><b>'+esc(s.name)+'</b><small>'+esc(s.type)+' · '+s.minutes+' min · RPE '+s.rpe+' · load '+Math.round(load(s))+'</small></div><button class="edit" data-id="'+esc(s.id)+'">Edit</button></article>';}).join(""):"No sessions logged yet.";}
function view(id){document.querySelectorAll(".view").forEach(function(x){x.classList.toggle("active",x.id===id);});document.querySelectorAll(".tab").forEach(function(x){x.classList.toggle("active",x.dataset.view===id);});}
document.querySelectorAll(".tab").forEach(function(b){b.onclick=function(){view(b.dataset.view);};});
document.querySelectorAll("[data-goto]").forEach(function(b){b.onclick=function(){view(b.dataset.goto);};});
function activityRow(a){var d=document.createElement("div");d.className="activity-row";d.innerHTML='<input class="a-name" placeholder="Football / swimming" value="'+esc(a.name)+'"><select class="a-day"><option value="1">Mon</option><option value="2">Tue</option><option value="3">Wed</option><option value="4">Thu</option><option value="5">Fri</option><option value="6">Sat</option><option value="0">Sun</option></select><input class="a-min" type="number" min="10" max="300" value="'+(a.minutes||60)+'"><input class="a-rpe" type="number" min="1" max="10" value="'+(a.rpe||6)+'"><button type="button" class="remove">×</button>';$("activityRows").append(d);d.querySelector(".a-day").value=String(a.day||2);d.querySelector(".remove").onclick=function(){d.remove();};}
$("addActivityButton").onclick=function(){activityRow({});};
$("profileForm").onsubmit=function(e){e.preventDefault();data.profile={event:$("eventName").value.trim(),eventDate:$("eventDate").value,hours:Number($("weeklyHours").value)||6,days:Array.from(document.querySelectorAll("#dayPicker input:checked")).map(function(x){return Number(x.value);}),activities:Array.from(document.querySelectorAll(".activity-row")).map(function(r){return {name:r.querySelector(".a-name").value.trim(),day:Number(r.querySelector(".a-day").value),minutes:Number(r.querySelector(".a-min").value),rpe:Number(r.querySelector(".a-rpe").value)};}).filter(function(a){return a.name;})};data.plan={};save();render();view("dashboard");msg("Profile saved and calendar rebuilt.");};
function fillProfile(){var p=data.profile;$("eventName").value=p.event;$("eventDate").value=p.eventDate;$("weeklyHours").value=p.hours;$("dayPicker").querySelectorAll("input").forEach(function(x){x.checked=p.days.indexOf(Number(x.value))>=0;});p.activities.forEach(activityRow);}
$("regenerateButton").onclick=function(){data.plan={};save();render();msg("Plan regenerated.");};
$("prevWeek").onclick=function(){offset--;render();};$("nextWeek").onclick=function(){offset++;render();};
function dialog(s){$("sessionForm").reset();$("sessionId").value=s?s.id:"";$("sessionName").value=s?s.name:"";$("sessionDate").value=s?s.date:iso(today());$("sessionType").value=s?s.type:"Cycling";$("sessionDuration").value=s?s.minutes:60;$("sessionRpe").value=s?s.rpe:5;$("sessionDialog").showModal();}
$("addSessionButton").onclick=function(){dialog(null);};$("cancelDialog").onclick=$("closeDialog").onclick=function(){$("sessionDialog").close();};
$("sessionForm").onsubmit=function(e){e.preventDefault();var id=$("sessionId").value||String(Date.now()),s={id:id,name:$("sessionName").value.trim(),date:$("sessionDate").value,type:$("sessionType").value,minutes:Number($("sessionDuration").value),rpe:Number($("sessionRpe").value),kind:"logged"};if(!s.name||!s.date||s.minutes<1||s.rpe<1||s.rpe>10){msg("Check session details.");return;}data.sessions=data.sessions.filter(function(x){return x.id!==id;});data.sessions.push(s);save();$("sessionDialog").close();render();msg("Session saved.");};
$("logList").onclick=function(e){var b=e.target.closest(".edit");if(b){var s=data.sessions.find(function(x){return x.id===b.dataset.id;});if(s)dialog(s);}};
$("checkinForm").onsubmit=function(e){e.preventDefault();var c={date:iso(today()),fatigue:Number($("fatigueInput").value),sleep:Number($("sleepInput").value),legs:Number($("freshInput").value)};data.checkins=data.checkins.filter(function(x){return x.date!==c.date;});data.checkins.push(c);save();render();msg("Recovery check-in saved.");};
["fatigue","sleep","fresh"].forEach(function(k){$(k+"Input").oninput=function(){$(k+"Output").textContent=this.value+" / 5";};});
function exportData(){var a=document.createElement("a"),blob=new Blob([JSON.stringify({app:"BETTER",version:1,data:data},null,2)],{type:"application/json"});a.href=URL.createObjectURL(blob);a.download="better-backup-"+iso(today())+".json";a.click();URL.revokeObjectURL(a.href);}
$("exportButton").onclick=exportData;$("exportButton2").onclick=exportData;
$("importFile").onchange=function(e){var f=e.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{var x=JSON.parse(r.result);if(x.app!=="BETTER"||!x.data.profile||!Array.isArray(x.data.sessions))throw Error();if(confirm("Importing replaces current BETTER data. Continue?")){data=x.data;save();location.reload();}}catch(err){msg("Invalid backup file.");}};r.readAsText(f);};
$("resetButton").onclick=function(){if(confirm("Delete all BETTER data stored in this browser?")){data=fresh();save();location.reload();}};
fillProfile();render();
})();