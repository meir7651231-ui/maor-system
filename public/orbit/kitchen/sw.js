const V='kitchen-v2';
const SHELL=['./','index.html','manifest.webmanifest','img/fridge.webp','img/table.webp','img/range.webp','img/pass.webp','img/office.webp','icons/icon-192.png','icons/icon-512.png','icons/apple-180.png','fonts/f1.woff2','fonts/f10.woff2','fonts/f11.woff2','fonts/f12.woff2','fonts/f13.woff2','fonts/f14.woff2','fonts/f15.woff2','fonts/f16.woff2','fonts/f17.woff2','fonts/f18.woff2','fonts/f2.woff2','fonts/f3.woff2','fonts/f4.woff2','fonts/f5.woff2','fonts/f6.woff2','fonts/f7.woff2','fonts/f8.woff2','fonts/f9.woff2','fonts/fonts.css'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
 if(u.origin===location.origin){
  if(r.mode==='navigate'){e.respondWith(fetch(r).then(res=>{const c=res.clone();caches.open(V).then(x=>x.put('index.html',c));return res;}).catch(()=>caches.match('index.html')));return;}
  e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{const c=res.clone();caches.open(V).then(x=>x.put(r,c));return res;})));return;}
 if(/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{const c=res.clone();caches.open(V).then(x=>x.put(r,c));return res;}).catch(()=>m)));}
});
