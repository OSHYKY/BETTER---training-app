const $=id=>document.getElementById(id);

// Reliable workout engine: one phase at a time, driven by absolute deadlines.
const state={work:240,rest:180,count:4,current:1,phase:'work',remaining:240,phaseDuration:240,running:false,paused:false,sound:true,countdown:true,vibration:true,voice:true,voiceUrl:null,wakeLock:null,loop:null,deadline:0,lastSecond:null,transitioning:false};
const formatTime=s=>{s=Math.max(0,Math.ceil(s));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`};
const updateSetupLabels=()=>{$('workValue').textContent=formatTime(state.work);$('restValue').textContent=formatTime(state.rest);$('countValue').textContent=state.count};
const markCustom=()=>document.querySelectorAll('.preset').forEach(b=>b.classList.toggle('active',b.dataset.preset==='custom'));
$('workSlider').addEventListener('input',e=>{state.work=+e.target.value;updateSetupLabels();markCustom()});
$('restSlider').addEventListener('input',e=>{state.rest=+e.target.value;updateSetupLabels();markCustom()});
$('countSlider').addEventListener('input',e=>{state.count=+e.target.value;updateSetupLabels();markCustom()});
const presets={quick:[240,180,4],power:[180,180,6]};
document.querySelectorAll('.preset').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.preset!=='custom'){const[w,r,c]=presets[b.dataset.preset];state.work=w;state.rest=r;state.count=c;$('workSlider').value=w;$('restSlider').value=r;$('countSlider').value=c;updateSetupLabels()}document.querySelectorAll('.preset').forEach(x=>x.classList.remove('active'));b.classList.add('active')}));
document.querySelector('[data-preset="quick"]').classList.add('active');
$('countdownToggle').addEventListener('change',e=>state.countdown=e.target.checked);
$('vibrationToggle').addEventListener('change',e=>state.vibration=e.target.checked);
$('voiceToggle').addEventListener('change',e=>state.voice=e.target.checked);

let audioContext;
function unlockAudio(){try{if(!audioContext)audioContext=new(window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')audioContext.resume().catch(()=>{})}catch(e){}}
function beep(type='change'){if(!state.sound)return;unlockAudio();if(!audioContext)return;const n=audioContext.currentTime,o=audioContext.createOscillator(),g=audioContext.createGain();o.connect(g);g.connect(audioContext.destination);o.type='sine';o.frequency.value=type==='countdown'?720:type==='finish'?920:560;const d=type==='finish'?1.1:.18;g.gain.setValueAtTime(.0001,n);g.gain.exponentialRampToValueAtTime(.2,n+.015);g.gain.exponentialRampToValueAtTime(.0001,n+d);o.start(n);o.stop(n+d+.03);if(type==='finish')setTimeout(()=>beep('change'),450)}
function buzz(pattern){if(!state.vibration||!navigator.vibrate)return;try{navigator.vibrate(0);navigator.vibrate(pattern)}catch(e){}}
$('soundToggle').addEventListener('click',()=>{state.sound=!state.sound;$('soundToggle').textContent=state.sound?'🔊':'🔇';if(state.sound)unlockAudio()});

let recorder=null,chunks=[];
async function startRecording(){if(!navigator.mediaDevices?.getUserMedia){$('voiceStatus').textContent='Recording is not supported here.';return}try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});chunks=[];recorder=new MediaRecorder(stream);recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};recorder.onstop=()=>{stream.getTracks().forEach(t=>t.stop());const blob=new Blob(chunks,{type:recorder.mimeType||'audio/webm'});if(state.voiceUrl)URL.revokeObjectURL(state.voiceUrl);state.voiceUrl=URL.createObjectURL(blob);$('voiceStatus').textContent='Your voice cue is ready on this device';$('recordVoiceButton').textContent='Record again'};recorder.start();$('recordVoiceButton').textContent='Stop recording';$('voiceStatus').textContent='Recording… say “Interval start”'}catch(e){$('voiceStatus').textContent='Microphone permission denied.'}}
$('recordVoiceButton').addEventListener('click',()=>recorder?.state==='recording'?recorder.stop():startRecording());
$('clearVoiceButton').addEventListener('click',()=>{if(state.voiceUrl)URL.revokeObjectURL(state.voiceUrl);state.voiceUrl=null;$('voiceStatus').textContent='No recording yet';$('recordVoiceButton').textContent='Record'});
function speak(text){if(!state.voice||state.voiceUrl||!('speechSynthesis'in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=1.05;speechSynthesis.speak(u)}
function playCustomVoice(){if(!state.voice||!state.voiceUrl)return;try{const a=new Audio(state.voiceUrl);a.play().catch(()=>{})}catch(e){}}
function startCue(){if(state.voice&&state.voiceUrl)playCustomVoice();else speak('Interval start')}
function numberCue(n){if(!state.voice||state.voiceUrl)return;speak(String(n))}

async function requestWakeLock(){try{if('wakeLock'in navigator)state.wakeLock=await navigator.wakeLock.request('screen')}catch(e){}}
function releaseWakeLock(){if(state.wakeLock){state.wakeLock.release().catch(()=>{});state.wakeLock=null}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&state.running&&!state.paused){requestWakeLock();render()}});
function show(v){['setupView','timerView','completeView'].forEach(id=>$(id).classList.toggle('hidden',id!==v))}
function render(){const left=Math.max(0,(state.deadline-performance.now())/1000);state.remaining=left;$('timerDisplay').textContent=formatTime(left);$('phaseCount').textContent=`Interval ${state.current} / ${state.count}`;$('phaseLabel').textContent=state.phase==='work'?'INTERVAL':'REST';$('timerCard').classList.toggle('work-phase',state.phase==='work');$('timerCard').classList.toggle('rest-phase',state.phase==='rest');$('nextLabel').textContent=state.phase==='work'?(state.current<state.count?'Next: Rest':'Next: Finish'):'Next: Interval';$('progressBar').style.transform=`scaleX(${Math.max(0,Math.min(1,left/state.phaseDuration))})`}
function beginPhase(phase,duration){state.phase=phase;state.phaseDuration=Math.max(0,duration);state.remaining=state.phaseDuration;state.deadline=performance.now()+state.phaseDuration*1000;state.lastSecond=null;render()}
function scheduleLoop(){if(state.loop)clearTimeout(state.loop);if(!state.running||state.paused)return;state.loop=setTimeout(loop,80)}
function loop(){state.loop=null;if(!state.running||state.paused)return;const left=(state.deadline-performance.now())/1000;state.remaining=Math.max(0,left);const second=Math.ceil(state.remaining);if(state.countdown&&state.phaseDuration>3&&second<=3&&second>0&&second!==state.lastSecond){state.lastSecond=second;numberCue(second);beep('countdown');buzz([180])}if(left<=0){goNextPhase();return}render();scheduleLoop()}
function goNextPhase(){if(!state.running||state.transitioning)return;state.transitioning=true;if(state.loop)clearTimeout(state.loop);if(state.phase==='work'){if(state.current>=state.count){finishWorkout();state.transitioning=false;return}if(state.rest<=0){state.current++;beginPhase('work',state.work);beep('change');buzz([300,150,300]);startCue()}else{beginPhase('rest',state.rest);beep('change');buzz([300,150,300]);speak('Rest')}}else{state.current++;beginPhase('work',state.work);beep('change');buzz([300,150,300]);startCue()}state.transitioning=false;scheduleLoop()}
function startWorkout(){unlockAudio();if(state.loop)clearTimeout(state.loop);state.current=1;state.running=true;state.paused=false;state.transitioning=false;$('pauseButton').textContent='Pause';show('timerView');requestWakeLock();beginPhase('work',state.work);buzz([300]);startCue();scheduleLoop()}
function pauseWorkout(){if(!state.running)return;if(!state.paused){state.remaining=Math.max(0,(state.deadline-performance.now())/1000);state.paused=true;if(state.loop)clearTimeout(state.loop);$('pauseButton').textContent='Resume';releaseWakeLock();buzz([120])}else{state.paused=false;state.deadline=performance.now()+state.remaining*1000;$('pauseButton').textContent='Pause';requestWakeLock();scheduleLoop()}}
function skipPhase(){if(!state.running)return;state.deadline=performance.now();goNextPhase()}
function stopWorkout(){state.running=false;state.paused=false;state.transitioning=false;if(state.loop)clearTimeout(state.loop);state.loop=null;releaseWakeLock();show('setupView')}
function finishWorkout(){state.running=false;state.paused=false;state.transitioning=false;if(state.loop)clearTimeout(state.loop);state.loop=null;releaseWakeLock();beep('finish');buzz([500,250,500,250,800]);speak('Workout complete');$('summaryText').textContent=`${state.count} × ${formatTime(state.work)} intervals completed.`;show('completeView')}
$('startButton').addEventListener('click',startWorkout);$('pauseButton').addEventListener('click',pauseWorkout);$('skipButton').addEventListener('click',skipPhase);$('stopButton').addEventListener('click',stopWorkout);$('backButton').addEventListener('click',stopWorkout);$('againButton').addEventListener('click',()=>show('setupView'));
updateSetupLabels();
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
