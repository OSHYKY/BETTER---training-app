const CACHE='better-training-v5';
const ASSETS=["./","./index.html","./css/planner.css","./js/planner.js","./js/training-engine.js","./workouts.html","./css/workouts.css","./js/workouts.js","./interval.html","./css/styles.css","./js/app.js","./manifest.json","./icons/icon.svg"];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match(event.request)))});
