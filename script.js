// Tabs
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(sec => sec.classList.remove('active'));
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });
});

// Local clock in header
const localClockEl = document.getElementById('local-clock');
function updateLocalClock(){
  const now = new Date();
  localClockEl.textContent = now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'}) +
    ' · ' + now.toLocaleDateString([], {weekday:'short', month:'short', day:'numeric'});
}
updateLocalClock(); setInterval(updateLocalClock, 1000);

// ---------- Overlay + Modal ----------
const overlay = document.getElementById('overlay');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalCancel = document.getElementById('modal-cancel');
const modalOk = document.getElementById('modal-ok');
let modalOkHandler = null;
function openModal(title, bodyNode, okLabel='OK', cancelLabel='Cancel', onOk=null){
  modalTitle.textContent = title;
  modalBody.innerHTML = '';
  modalBody.appendChild(bodyNode);
  modalOk.textContent = okLabel;
  modalCancel.textContent = cancelLabel || 'Cancel';
  modalOkHandler = onOk;
  overlay.classList.remove('hidden'); modal.classList.remove('hidden');
  requestAnimationFrame(()=>{ overlay.classList.add('show'); modal.classList.add('show'); });
}
function closeModal(){
  overlay.classList.remove('show'); modal.classList.remove('show');
  setTimeout(()=>{ overlay.classList.add('hidden'); modal.classList.add('hidden'); modalBody.innerHTML=''; }, 180);
}
overlay.addEventListener('click', closeModal);
modalCancel.addEventListener('click', closeModal);
modalOk.addEventListener('click', ()=>{ if(modalOkHandler) modalOkHandler(); });

// ---------- Wheel component ----------
function createWheel(values, initialIndex=0){
  const wrap = document.createElement('div'); wrap.className = 'wheel-wrap';
  const highlight = document.createElement('div'); highlight.className = 'wheel-highlight';
  const wheel = document.createElement('div'); wheel.className = 'wheel';
  const pad = (v)=> String(v).padStart(2,'0');
  values.forEach((v)=>{
    const d = document.createElement('div'); d.className = 'option'; d.textContent = (typeof v === 'number') ? pad(v) : v;
    wheel.appendChild(d);
  });
  wrap.appendChild(wheel); wrap.appendChild(highlight);
  const itemH = 50;
  function snap(){
    const idx = Math.round(wheel.scrollTop / itemH);
    wheel.scrollTo({ top: idx*itemH, behavior: 'smooth' });
    setSelected(idx);
  }
  function setSelected(idx){
    [...wheel.children].forEach((el,i)=> el.classList.toggle('sel', i===idx));
  }
  setTimeout(()=>{ wheel.scrollTop = initialIndex * itemH; setSelected(initialIndex); }, 0);
  let t=null;
  wheel.addEventListener('scroll', ()=>{ if(t) clearTimeout(t); t = setTimeout(snap, 100); });
  return {
    el: wrap,
    getIndex: ()=> Math.round(wheel.scrollTop / itemH),
    setIndex: (i)=> { wheel.scrollTop = i*itemH; setSelected(i); },
  };
}

// ---------- World Clock ----------
const worldList = document.getElementById('world-list');
let timeZones = ['America/New_York','Europe/London','Asia/Tokyo','Australia/Sydney','Asia/Dubai'];
function renderWorld(){
  worldList.innerHTML='';
  timeZones.forEach(tz=>{
    const li = document.createElement('li');
    const name = tz.split('/').pop().replace(/_/g,' ');
    const left = document.createElement('div'); left.textContent = name;
    const right = document.createElement('div'); right.dataset.tz = tz; right.style.fontVariantNumeric='tabular-nums';
    li.append(left,right); worldList.append(li);
  });
}
renderWorld();
function updateWorld(){
  document.querySelectorAll('[data-tz]').forEach(el=>{
    try{
      el.textContent = new Intl.DateTimeFormat([], {hour:'2-digit', minute:'2-digit', timeZone: el.dataset.tz, hour12:false}).format(new Date());
    }catch(e){ el.textContent = '—'; }
  });
}
updateWorld(); setInterval(updateWorld, 1000);

document.getElementById('add-city').addEventListener('click', ()=>{
  const body = document.createElement('div'); body.className='dialog-body';
  const p = document.createElement('p'); p.textContent = 'Enter IANA timezone (e.g., Europe/London)';
  const input = document.createElement('input'); input.type='text'; input.placeholder='Area/City'; input.className='text-input';
  body.append(p,input);
  openModal('Add City', body, 'Add', 'Cancel', ()=>{
    const tz = input.value.trim(); if(!tz) return closeModal();
    try{ new Intl.DateTimeFormat([], {timeZone: tz}); timeZones.push(tz); renderWorld(); updateWorld(); closeModal(); }
    catch(e){ input.style.borderColor = 'crimson'; }
  });
});

// ---------- ALARM ----------
const alarmListEl = document.getElementById('alarm-list');
let alarms = []; // {h,m, enabled:true}
function renderAlarms(){
  alarmListEl.innerHTML='';
  alarms.forEach((a,i)=>{
    const li = document.createElement('li');
    const left = document.createElement('div');
    left.textContent = `${String(a.h).padStart(2,'0')}:${String(a.m).padStart(2,'0')}`;
    left.style.fontVariantNumeric='tabular-nums';
    const right = document.createElement('div');
    const del = document.createElement('button'); del.className='pill alt'; del.textContent='Delete';
    del.onclick = ()=>{ alarms.splice(i,1); renderAlarms(); };
    const tog = document.createElement('input'); tog.type='checkbox'; tog.checked = a.enabled!==false; tog.style.marginLeft='8px';
    tog.onchange = ()=>{ a.enabled = tog.checked; };
    right.append(del,tog);
    li.append(left,right); alarmListEl.append(li);
  });
}
renderAlarms();

function addAlarmDialog(){
  const hours = Array.from({length:24},(_,i)=>i);
  const mins = Array.from({length:60},(_,i)=>i);
  const wrap = document.createElement('div'); wrap.className='wheels';
  const wH = createWheel(hours, 7);
  const wM = createWheel(mins, 0);
  wrap.append(wH.el, wM.el);
  openModal('Add Alarm', wrap, 'Add', 'Cancel', ()=>{
    const h = hours[wH.getIndex()], m = mins[wM.getIndex()];
    alarms.push({h, m, enabled:true});
    scheduleAlarmNotification(h,m);
    renderAlarms(); closeModal();
  });
}
document.getElementById('add-alarm').addEventListener('click', addAlarmDialog);

// ---------- TIMER ----------
const ring = document.querySelector('.ring');
const radius = 52; const circumference = 2*Math.PI*radius;
ring.style.strokeDasharray = `${circumference}`; ring.style.strokeDashoffset = `${circumference}`;

let duration = 60; // seconds
let remaining = 60;
let timerRAF = null; let tStart = null;

function fmt(sec){
  const h = Math.floor(sec/3600);
  const m = Math.floor((sec%3600)/60);
  const s = Math.floor(sec%60);
  if(h>0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function setRing(frac){ ring.style.strokeDashoffset = circumference * (1-frac); }
const disp = document.getElementById('timer-display');
function resetTimerUI(){ remaining = duration; disp.textContent = fmt(remaining); setRing(duration?1:0); }
resetTimerUI();

function step(ts){
  if(!tStart) tStart = ts;
  const elapsed = (ts - tStart)/1000;
  remaining = Math.max(0, duration - elapsed);
  disp.textContent = fmt(remaining);
  setRing(duration? remaining/duration : 0);
  if(remaining>0){ timerRAF = requestAnimationFrame(step); }
  else{
    cancelAnimationFrame(timerRAF); timerRAF=null;
    document.getElementById('start-pause-timer').textContent = 'Start';
    showTimesUp(); startChimeLoop();
  }
}
document.getElementById('start-pause-timer').addEventListener('click', async (e)=>{
  await ensureAudio();
  if(timerRAF){ cancelAnimationFrame(timerRAF); timerRAF=null; e.target.textContent='Start'; }
  else if(remaining>0 && duration>0){ tStart = null; timerRAF = requestAnimationFrame(step); e.target.textContent='Pause'; }
});
document.getElementById('reset-timer').addEventListener('click', ()=>{
  if(timerRAF){ cancelAnimationFrame(timerRAF); timerRAF=null; }
  resetTimerUI(); document.getElementById('start-pause-timer').textContent = 'Start';
});
document.getElementById('set-timer').addEventListener('click', ()=>{
  const hours = Array.from({length:24},(_,i)=>i);
  const mins = Array.from({length:60},(_,i)=>i);
  const secs = Array.from({length:60},(_,i)=>i);
  const wrap = document.createElement('div'); wrap.className='wheels';
  const wH = createWheel(hours, Math.floor(duration/3600));
  const wM = createWheel(mins, Math.floor((duration%3600)/60));
  const wS = createWheel(secs, Math.floor(duration%60));
  wrap.append(wH.el, wM.el, wS.el);
  openModal('Set Timer', wrap, 'Set', 'Cancel', ()=>{
    duration = hours[wH.getIndex()]*3600 + mins[wM.getIndex()]*60 + secs[wS.getIndex()];
    if(duration<=0) duration = 0;
    if(timerRAF){ cancelAnimationFrame(timerRAF); timerRAF=null; }
    resetTimerUI(); scheduleTimerNotification(duration); closeModal();
  });
});

// ---------- STOPWATCH ----------
let swRAF=null, swStart=null, swElapsed=0;
const swDisp = document.getElementById('sw-display');
function fmtSW(sec){ const m=Math.floor(sec/60), s=Math.floor(sec%60), cs=Math.floor((sec-Math.floor(sec))*100); return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(cs).padStart(2,'0')}`; }
function swStep(ts){ if(!swStart) swStart=ts; swElapsed=(ts-swStart)/1000; swDisp.textContent=fmtSW(swElapsed); swRAF=requestAnimationFrame(swStep); }
document.getElementById('start-pause-sw').addEventListener('click', async function(){ await ensureAudio(); if(swRAF){ cancelAnimationFrame(swRAF); swRAF=null; this.textContent='Start'; } else { swStart=performance.now()-swElapsed*1000; swRAF=requestAnimationFrame(swStep); this.textContent='Pause'; } });
const lapList = document.getElementById('lap-list');
document.getElementById('lap-sw').addEventListener('click', ()=>{ if(!swRAF) return; const li=document.createElement('li'); li.textContent = fmtSW(swElapsed); lapList.appendChild(li); });
document.getElementById('reset-sw').addEventListener('click', ()=>{ if(swRAF){ cancelAnimationFrame(swRAF); swRAF=null; } swElapsed=0; swDisp.textContent='00:00.00'; lapList.innerHTML=''; document.getElementById('start-pause-sw').textContent='Start'; });

// ---------- Chime (foreground) ----------
let audioCtx=null; let chimeTimer=null; let activeNodes=[];
async function ensureAudio(){ if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if(audioCtx.state==='suspended') await audioCtx.resume(); return audioCtx; }
function playOneChime(){
  if(!audioCtx) return; const now = audioCtx.currentTime;
  const master = audioCtx.createGain(); master.gain.value = 0.7; master.connect(audioCtx.destination);
  const tones=[880,1320,1760]; tones.forEach((f,i)=>{ const o=audioCtx.createOscillator(); o.type='sine'; o.frequency.value=f; const g=audioCtx.createGain(); g.gain.setValueAtTime(0,now); g.gain.linearRampToValueAtTime(0.6/(i+1),now+0.02); g.gain.exponentialRampToValueAtTime(0.001,now+1.0); o.connect(g); g.connect(master); o.start(now); o.stop(now+1.05); });
  setTimeout(()=>{ try{master.disconnect();}catch(e){} },1200);
}
function startChimeLoop(){ ensureAudio().then(()=>{ stopChimeLoop(); playOneChime(); chimeTimer=setInterval(playOneChime,1200); }); }
function stopChimeLoop(){ if(chimeTimer){ clearInterval(chimeTimer); chimeTimer=null; } }
function showTimesUp(){
  const body=document.createElement('div'); body.className='dialog-body';
  const p1=document.createElement('div'); p1.textContent=\"Time's up\"; p1.style.fontWeight='700'; p1.style.marginBottom='6px'; p1.style.fontSize='18px';
  const p2=document.createElement('div'); p2.textContent='Tap OK to stop the chime.'; body.append(p1,p2);
  openModal(' ', body, 'OK', 'Dismiss', ()=>{ stopChimeLoop(); closeModal(); });
}

// ---------- Cordova: background notifications ----------
function scheduleTimerNotification(seconds){
  if(!window.cordova || !cordova.plugins || !cordova.plugins.notification) return;
  const at = new Date(new Date().getTime() + seconds*1000);
  cordova.plugins.notification.local.schedule({
    id: Date.now() % 2147483647,
    title: \"Time's up\",
    text: 'Your timer finished.',
    trigger: { at },
    smallIcon: 'res://ic_stat_notify',
    foreground: true,
    sound: 'res://platform_default'
  });
}
function scheduleAlarmNotification(h, m){
  if(!window.cordova || !cordova.plugins || !cordova.plugins.notification) return;
  const now = new Date(); const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
  if(target <= now) target.setDate(target.getDate()+1);
  cordova.plugins.notification.local.schedule({
    id: Date.now() % 2147483647,
    title: 'Alarm',
    text: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`,
    trigger: { at: target },
    foreground: true,
    sound: 'res://platform_default'
  });
}

document.addEventListener('deviceready', function(){
  // Background mode (optional)
  if(window.cordova && cordova.plugins && cordova.plugins.backgroundMode){
    cordova.plugins.backgroundMode.enable();
  }
  // Local notifications permission
  if(window.cordova && cordova.plugins && cordova.plugins.notification){
    cordova.plugins.notification.local.requestPermission(function(granted){});
    cordova.plugins.notification.local.on('click', function(notification){ /* open app */ });
  }
}, false);
