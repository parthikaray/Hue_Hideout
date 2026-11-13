const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const storageKey = 'hue-hideout-player-v1';
const roundsTotal = 10;
const secondsPerRound = 15;
const MATCH = 95;
const clamp = (n,min,max) => Math.min(max,Math.max(min,n));
const hueDistance = (a,b) => Math.min(Math.abs(a-b),360-Math.abs(a-b));
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function loadPlayer(){
  try{
    const p = JSON.parse(localStorage.getItem(storageKey));
    if(p && p.name) return Object.assign({best:0,streak:0,lastPlay:''},p);
  }catch(e){}
  return {name:'Explorer',best:0,streak:0,lastPlay:''};
}
let player = loadPlayer();
function savePlayer(){ try{ localStorage.setItem(storageKey, JSON.stringify(player)); }catch(e){} }

function hsv(h,s,v){
  const l = (v/100)*(1-s/200);
  const sat = (l===0||l===1) ? 0 : ((v/100 - l)/Math.min(l,1-l))*100;
  return `hsl(${h} ${sat}% ${l*100}%)`;
}
function hexFromHsv(h,s,v){
  const c = v/100*s/100;
  const x = c*(1-Math.abs((h/60)%2-1));
  const m = v/100-c;
  const [r,g,b] = h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
  return '#'+[r,g,b].map(n=>Math.round((n+m)*255).toString(16).padStart(2,'0')).join('').toUpperCase();
}

const sfx = {
  ctx:null,
  ac(){
    try{
      if(!this.ctx){ const AC = window.AudioContext||window.webkitAudioContext; if(!AC) return null; this.ctx = new AC(); }
      if(this.ctx.state==='suspended') this.ctx.resume();
      return this.ctx;
    }catch(e){ return null; }
  },
  tone(freq,dur,opt){
    opt = opt||{};
    try{
      const c = this.ac(); if(!c) return;
      const t = c.currentTime + (opt.when||0);
      const o = c.createOscillator(), g = c.createGain();
      o.type = opt.type||'sine';
      o.frequency.setValueAtTime(freq,t);
      if(opt.slideTo) o.frequency.exponentialRampToValueAtTime(opt.slideTo,t+dur);
      g.gain.setValueAtTime(opt.gain!=null?opt.gain:.07,t);
      g.gain.exponentialRampToValueAtTime(.0001,t+dur);
      o.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t+dur+.02);
    }catch(e){}
  },
  noise(dur,opt){
    opt = opt||{};
    try{
      const c = this.ac(); if(!c) return;
      const t = c.currentTime + (opt.when||0);
      const buf = c.createBuffer(1, Math.max(1,Math.floor(c.sampleRate*dur)), c.sampleRate);
      const d = buf.getChannelData(0);
      for(let i=0;i<d.length;i++) d[i] = (Math.random()*2-1)*(1-i/d.length);
      const src = c.createBufferSource(); src.buffer = buf;
      const f = c.createBiquadFilter(); f.type = 'bandpass';
      f.frequency.setValueAtTime(opt.filterFreq||1200,t);
      if(opt.sweep) f.frequency.exponentialRampToValueAtTime(opt.sweep,t+dur);
      const g = c.createGain();
      g.gain.setValueAtTime(opt.gain!=null?opt.gain:.08,t);
      g.gain.exponentialRampToValueAtTime(.0001,t+dur);
      src.connect(f); f.connect(g); g.connect(c.destination);
      src.start(t); src.stop(t+dur);
    }catch(e){}
  },
  pop(){ this.tone(340,.1,{type:'sine',gain:.07,slideTo:660}); this.noise(.04,{gain:.025,filterFreq:2200}); },
  click(){ this.tone(700,.05,{type:'triangle',gain:.05}); },
  tick(){ this.tone(900,.04,{type:'sine',gain:.04}); },
  slide(){ this.tone(520,.04,{type:'triangle',gain:.035}); },
  step(){ this.tone(200,.07,{type:'triangle',gain:.022}); },
  start(){ this.tone(440,.1,{type:'triangle',gain:.07}); this.tone(660,.12,{type:'triangle',gain:.07,when:.08}); },
  success(){ this.tone(560,.14,{type:'triangle',gain:.08}); this.tone(840,.16,{type:'triangle',gain:.08,when:.1}); this.tone(1120,.22,{type:'sine',gain:.07,when:.2}); },
  screech(){
    this.tone(1500,.34,{type:'sawtooth',gain:.09,slideTo:720});
    this.tone(980,.44,{type:'square',gain:.035,slideTo:400,when:.06});
    this.noise(.5,{gain:.06,filterFreq:3200,sweep:900});
  },
  whoosh(){ this.noise(.6,{gain:.1,filterFreq:380,sweep:2800}); },
  caught(){ this.tone(170,.3,{type:'sawtooth',gain:.1,slideTo:55}); this.noise(.32,{gain:.11,filterFreq:480,sweep:110}); this.tone(85,.45,{type:'sine',gain:.12,slideTo:48,when:.06}); },
  sparkle(){ [0,.07,.14].forEach((d,i)=>this.tone(760+i*260,.14,{type:'sine',gain:.05,when:d})); }
};

const LIZARD_SVG = `
<svg viewBox="0 0 260 175" class="lizard-svg" role="img" aria-label="A chameleon seen from above">
  <ellipse class="lizard-shadow" cx="118" cy="112" rx="86" ry="30" fill="#2f4a3d" opacity=".16"/>
  <g class="legs far-legs">
    <path class="ll leg leg-far" style="transform-box:view-box;transform-origin:86px 44px" d="M86 44C79 31 73 24 65 18M65 18l-9 2M65 18l-5 7M65 18l-10-4"/>
    <path class="ll leg leg-far" style="transform-box:view-box;transform-origin:150px 40px" d="M150 40C145 28 141 22 136 16M136 16l-8 2M136 16l-4 6M136 16l-9-3"/>
  </g>
  <path class="camo-fill body" d="M24 82C21 68 30 57 42 55 51 53 55 46 70 41 92 33 168 30 186 42 205 53 213 67 210 83 207 99 197 107 187 111 165 119 130 125 98 121 73 117 57 113 47 105 41 99 33 99 29 93 25 91 24 85 24 82Z"/>
  <path class="ll crest" d="M46 68C52 56 61 50 73 46"/>
  <circle class="ll" cx="21" cy="82" r="3.2"/>
  <path class="ll smile" d="M19 91c7 7 16 7 23 2"/>
  <g class="eyes">
    <g class="eye"><circle class="ll" cx="34" cy="57" r="13.5"/><circle class="ll" cx="34" cy="57" r="8"/><circle class="pupil" cx="33.5" cy="57" r="4"/><path class="ll" d="M37 53c-3-3-7-2-9 1"/></g>
    <g class="eye"><circle class="ll" cx="37" cy="93" r="12"/><circle class="ll" cx="37" cy="93" r="7.5"/><circle class="pupil" cx="36.5" cy="93" r="3.7"/><path class="ll" d="M40 89c-3-3-6-2-8 1"/></g>
  </g>
  <g class="scallops">
    <path class="ll" d="M66 66c6 26 14 26 20 0"/>
    <path class="ll" d="M90 62c6 26 14 26 20 0"/>
    <path class="ll" d="M114 60c6 26 14 26 20 0"/>
    <path class="ll" d="M138 60c6 26 14 26 20 0"/>
    <path class="ll" d="M160 63c5 24 12 24 17 0"/>
    <path class="ll" d="M179 68c4 16 10 16 13 0"/>
  </g>
  <g class="legs near-legs">
    <path class="ll leg leg-near" style="transform-box:view-box;transform-origin:80px 107px" d="M80 107C75 123 68 131 58 138M58 138l-12 4M58 138l-8 10M58 138l-14-3"/>
    <path class="ll leg leg-near" style="transform-box:view-box;transform-origin:147px 111px" d="M147 111C143 126 137 133 129 140M129 140l-11 4M129 140l-8 9M129 140l-13-2"/>
  </g>
  <g class="tail" style="transform-box:view-box;transform-origin:194px 64px">
    <path class="ll" d="M194 64C216 51 240 67 232 89 225 108 200 115 194 97 189 83 209 76 215 85 219 92 210 100 205 93"/>
  </g>
</svg>`;

const EAGLE_SVG = `
<svg viewBox="0 0 200 160" class="eagle-svg" role="img" aria-label="An eagle diving from above">
  <g class="wing wing-left"><path class="ef efill" d="M78 72C52 44 22 36 8 48 30 52 50 62 64 80Z"/><path class="el" d="M30 46c8 6 16 14 22 24M46 50c6 6 12 13 16 21"/></g>
  <g class="wing wing-right"><path class="ef efill" d="M122 72C148 44 178 36 192 48 170 52 150 62 136 80Z"/><path class="el" d="M170 46c-8 6-16 14-22 24M154 50c-6 6-12 13-16 21"/></g>
  <path class="ef efill" d="M92 44L100 10l8 34-8-6z"/>
  <ellipse class="ef efill" cx="100" cy="84" rx="26" ry="36"/>
  <path class="el" d="M86 66c10 8 18 8 28 0M86 96c10 8 18 8 28 0"/>
  <circle class="ef efill" cx="100" cy="122" r="15"/>
  <circle class="white-eye" cx="94" cy="119" r="3.4"/>
  <circle class="white-eye" cx="106" cy="119" r="3.4"/>
  <circle cx="94" cy="119" r="1.6" fill="#2a2030"/>
  <circle cx="106" cy="119" r="1.6" fill="#2a2030"/>
  <path class="ef" d="M100 136l-7 12h14z" fill="#e8a13c"/>
  <path class="el" d="M92 146c-3 6 1 10 5 9M108 146c3 6-1 10-5 9"/>
</svg>`;

let round = 0, target = {h:160,s:60,v:61}, picked = {h:160,s:70,v:75};
let playing = false, judged = false, frame = null, startedAt = 0;
let accuracies = [], stepTimer = null;

function paintProfile(){
  $('#player-btn').textContent = player.name;
  $('#best-value').textContent = player.best;
  $('#best-value-game').textContent = player.best;
  $('#streak-value').textContent = player.streak||0;
  const ni = $('#name-input');
  if(document.activeElement !== ni) ni.value = player.name==='Explorer' ? '' : player.name;
}
function positionWheelDot(){
  const wheel = $('#color-wheel');
  const r = wheel.getBoundingClientRect();
  const size = r.width||200;
  const rad = (picked.h-90)*Math.PI/180;
  const rr = size*.38;
  wheel.style.setProperty('--dot-x', (size/2 + Math.cos(rad)*rr) + 'px');
  wheel.style.setProperty('--dot-y', (size/2 + Math.sin(rad)*rr) + 'px');
}
function paintTracks(){
  const h = picked.h, s = picked.s, v = picked.v;
  $('#hue').style.background = 'linear-gradient(90deg,'+[0,60,120,180,240,300,360].map(hh=>hsv(hh%360,s,v)).join(',')+')';
  $('#sat').style.background = `linear-gradient(90deg,${hsv(h,0,v)},${hsv(h,100,v)})`;
  $('#val').style.background = `linear-gradient(90deg,${hsv(h,s,10)},${hsv(h,s,100)})`;
}
function matchAccuracy(){
  const error = (hueDistance(target.h,picked.h)/180)*.5 + (Math.abs(target.s-picked.s)/100)*.25 + (Math.abs(target.v-picked.v)/100)*.25;
  return Math.max(0,Math.round((1-error)*100));
}
function paintMatch(){
  const acc = matchAccuracy();
  $('#match-fill').style.width = acc+'%';
  const pct = $('#match-pct');
  pct.textContent = acc+'%';
  pct.style.color = acc>=MATCH ? '#4f9e6b' : acc>=80 ? '#c0841f' : '#b2575f';
}
function paintColor(){
  document.documentElement.style.setProperty('--mix', hsv(picked.h,picked.s,picked.v));
  $('#mix-value').textContent = hexFromHsv(picked.h,picked.s,picked.v);
  $('#target-value').textContent = hexFromHsv(target.h,target.s,target.v);
  $('#hue-out').textContent = Math.round(picked.h)+'°';
  $('#sat-out').textContent = Math.round(picked.s)+'%';
  $('#val-out').textContent = Math.round(picked.v)+'%';
  if(document.activeElement !== $('#hue')) $('#hue').value = picked.h;
  if(document.activeElement !== $('#sat')) $('#sat').value = picked.s;
  if(document.activeElement !== $('#val')) $('#val').value = picked.v;
  paintTracks();
  positionWheelDot();
  paintMatch();
}
function toast(msg){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(()=>t.classList.remove('show'), 2400);
}
function starMarkup(pct){
  const total = pct/100*3;
  return [0,1,2].map(i=>{
    const f = clamp(total-i,0,1);
    return `<span class="star"><i style="width:${(f*100).toFixed(1)}%">★</i>★</span>`;
  }).join('');
}
function showResult(html, good){
  const e = $('#result-burst');
  e.innerHTML = html;
  e.style.color = good ? '#4f9e6b' : '#b2575f';
  e.classList.remove('show');
  void e.offsetWidth;
  e.classList.add('show');
}

function begin(){
  sfx.pop();
  sfx.ac();
  $('#welcome').hidden = true;
  $('#summary').hidden = true;
  $('#auth-card').hidden = true;
  $('#game').hidden = false;
  round = 0; accuracies = [];
  playing = true;
  const ch = $('#chameleon');
  ch.classList.remove('caught','blended');
  ch.classList.add('walking');
  startSteps();
  nextRound();
}
function startSteps(){
  stopSteps();
  stepTimer = setInterval(()=>{ if(playing && !judged) sfx.step(); }, 640);
}
function stopSteps(){ clearInterval(stepTimer); stepTimer = null; }

function nextRound(){
  if(round >= roundsTotal){ endGame(true); return; }
  playing = true;
  round++;
  judged = false;
  target = {h:Math.round(Math.random()*360), s:Math.round(45+Math.random()*50), v:Math.round(48+Math.random()*45)};
  picked = {
    h: (target.h + 75 + Math.random()*160)%360,
    s: clamp(target.s + (Math.random()>.5?1:-1)*(15+Math.random()*35), 5, 100),
    v: clamp(target.v + (Math.random()>.5?1:-1)*(12+Math.random()*30), 10, 100)
  };
  $('#round').textContent = round;
  document.documentElement.style.setProperty('--path', hsv(target.h,target.s,target.v));
  const ch = $('#chameleon');
  ch.classList.remove('caught','blended');
  ch.classList.add('walking');
  $('#eagle').classList.remove('attack');
  $('#scene').classList.remove('shake');
  $('#result-burst').classList.remove('show');
  paintColor();
  startedAt = performance.now();
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(tick);
}
function tick(now){
  if(!playing) return;
  now = now || performance.now();
  const remaining = Math.max(0, secondsPerRound - (now-startedAt)/1000);
  $('#seconds').textContent = Math.ceil(remaining);
  $('#timer-ring').style.strokeDashoffset = 100 - (remaining/secondsPerRound*100);
  if(remaining <= 0){ judge(); return; }
  frame = requestAnimationFrame(tick);
}
function judge(){
  if(judged) return;
  judged = true;
  playing = false;
  stopSteps();
  cancelAnimationFrame(frame);
  const accuracy = matchAccuracy();
  accuracies.push(accuracy);
  if(accuracy >= MATCH){
    sfx.success();
    $('#chameleon').classList.add('blended');
    showResult(`Perfect hide!<br>${accuracy}% match<br><span class="burst-stars">${starMarkup(accuracy)}</span>`, true);
    setTimeout(()=>{ if(!$('#summary').hidden) return; nextRound(); }, 1500);
  }else{
    sfx.screech();
    sfx.whoosh();
    $('#eagle').classList.add('attack');
    setTimeout(()=>{
      $('#chameleon').classList.remove('walking');
      $('#chameleon').classList.add('caught');
      $('#scene').classList.add('shake');
      sfx.caught();
      showResult(`Spotted!<br>${accuracy}% — need ${MATCH}%`, false);
    }, 620);
    setTimeout(()=>endGame(false), 3400);
  }
}
function updateStreak(){
  const today = new Date().toISOString().slice(0,10);
  if(player.lastPlay === today) return;
  const y = new Date(Date.now()-86400000).toISOString().slice(0,10);
  player.streak = player.lastPlay === y ? (player.streak||0)+1 : 1;
  player.lastPlay = today;
}
function endGame(survived){
  playing = false;
  judged = true;
  stopSteps();
  cancelAnimationFrame(frame);
  const average = accuracies.length ? Math.round(accuracies.reduce((a,b)=>a+b,0)/accuracies.length) : 0;
  const isNew = average > (player.best||0);
  if(isNew) player.best = average;
  updateStreak();
  savePlayer();
  paintProfile();
  syncToCloud();
  $('#game').hidden = true;
  $('#summary').hidden = false;
  $('#summary-icon').textContent = survived ? '🏆' : '🦅';
  $('#summary-title').textContent = survived ? 'Every path was safe!' : 'The eagle spotted you.';
  $('#summary-copy').textContent = survived
    ? `${player.name} made it through all ${roundsTotal} paths. That is excellent camouflage.`
    : `You reached round ${round} of ${roundsTotal}. Line up Hue, Saturation and Brightness to at least ${MATCH}% to stay hidden.`;
  $('#final-score').textContent = average+'%';
  const stars = $('#final-stars');
  stars.innerHTML = starMarkup(average);
  requestAnimationFrame(()=>{
    stars.querySelectorAll('.star').forEach((s,i)=>setTimeout(()=>s.classList.add('wobble'), 200+i*160));
  });
  if(isNew) setTimeout(()=>toast('New personal best saved!'), 700);
}

const wheel = $('#color-wheel');
function hueFromPointer(e){
  const r = wheel.getBoundingClientRect();
  const x = e.clientX - r.left - r.width/2;
  const y = e.clientY - r.top - r.height/2;
  return (Math.atan2(y,x)*180/Math.PI + 90 + 360) % 360;
}
let dragging = false;
wheel.addEventListener('pointerdown', e=>{
  if(!playing || judged) return;
  dragging = true;
  wheel.setPointerCapture(e.pointerId);
  picked.h = hueFromPointer(e);
  paintColor();
  sfx.tick();
});
wheel.addEventListener('pointermove', e=>{
  if(!dragging) return;
  const h = hueFromPointer(e);
  if(Math.abs(h - picked.h) > 2){ picked.h = h; paintColor(); sfx.slide(); }
});
['pointerup','pointercancel'].forEach(ev=>wheel.addEventListener(ev, ()=>{ dragging = false; }));

[['hue','h'],['sat','s'],['val','v']].forEach(([id,key])=>{
  $('#'+id).addEventListener('input', e=>{
    if(!playing || judged) return;
    picked[key] = Number(e.target.value);
    paintColor();
    sfx.slide();
  });
});

document.addEventListener('pointerdown', e=>{
  const btn = e.target.closest('button');
  if(btn && !btn.disabled) sfx.pop();
});
$('#start-game').addEventListener('click', ()=>{
  const n = $('#name-input').value.trim();
  if(n) player.name = n;
  savePlayer(); paintProfile();
  begin();
});
$('#play-again').addEventListener('click', begin);
$('#home-button').addEventListener('click', ()=>{
  sfx.pop();
  playing = false; judged = true;
  stopSteps();
  cancelAnimationFrame(frame);
  $('#game').hidden = true;
  $('#summary').hidden = true;
  $('#welcome').hidden = false;
  paintProfile();
  loadLeaderboard();
});
$('#name-input').addEventListener('input', e=>{
  const v = e.target.value.trim();
  player.name = v || 'Explorer';
  savePlayer(); paintProfile();
  e.target.value = v;
});

/* ---------------- Supabase accounts ---------------- */
let sb = null;
if(window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url && window.SUPABASE_CONFIG.anonKey && window.supabase){
  try{ sb = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey); }
  catch(e){ sb = null; }
}
let currentUser = null;
let authMode = 'signin';

function openAuth(){
  if(!sb){ toast('Accounts not set up yet — see README.md'); return; }
  $('#auth-card').hidden = false;
  $('#auth-msg').textContent = '';
  $('#auth-email').focus();
}
$('#auth-toggle').addEventListener('click', async ()=>{
  if(currentUser){
    try{ await sb.auth.signOut(); }catch(e){}
    currentUser = null;
    $('#auth-toggle').textContent = 'Sign in';
    toast('Signed out — your score is still saved here.');
    paintProfile();
  }else{
    openAuth();
  }
});
$('#player-btn').addEventListener('click', openAuth);
$('#auth-close').addEventListener('click', ()=>{ $('#auth-card').hidden = true; });
$('#auth-create').addEventListener('click', ()=>{
  authMode = authMode === 'signin' ? 'signup' : 'signin';
  const isNew = authMode === 'signup';
  $('#auth-title').textContent = isNew ? 'Create your account' : 'Welcome back';
  $('#auth-submit').innerHTML = (isNew ? 'Create account' : 'Sign in') + ' <span>→</span>';
  $('#auth-create').textContent = isNew ? 'I already have an account — sign in' : 'Create a new account instead';
  $('#auth-msg').textContent = '';
});
$('#auth-form').addEventListener('submit', async e=>{
  e.preventDefault();
  if(!sb) return;
  const email = $('#auth-email').value.trim();
  const password = $('#auth-password').value;
  const msg = $('#auth-msg');
  msg.textContent = 'Working…';
  try{
    if(authMode === 'signup'){
      const {data,error} = await sb.auth.signUp({email,password});
      if(error) throw error;
      if(data && data.user && !data.session){ msg.style.color = '#4f9e6b'; msg.textContent = 'Check your email for a confirm link, then sign in.'; return; }
      await onSignedIn(data.user);
      $('#auth-card').hidden = true;
      toast('Account created — progress synced!');
    }else{
      const {data,error} = await sb.auth.signInWithPassword({email,password});
      if(error) throw error;
      await onSignedIn(data.user);
      $('#auth-card').hidden = true;
      toast('Signed in — welcome back!');
    }
  }catch(err){
    msg.style.color = '#b2575f';
    msg.textContent = (err && err.message) ? err.message : 'Something went wrong.';
  }
});
async function onSignedIn(user){
  currentUser = user;
  $('#auth-toggle').textContent = 'Sign out';
  try{
    const {data} = await sb.from('profiles').select('best_score,chameleon_name,streak,last_play_date').eq('id',user.id).maybeSingle();
    if(data){
      if((data.best_score||0) > (player.best||0)) player.best = data.best_score;
      if(data.chameleon_name && player.name === 'Explorer') player.name = data.chameleon_name;
      if(data.streak && data.streak > (player.streak||0)) player.streak = data.streak;
      if(data.last_play_date) player.lastPlay = data.last_play_date;
      savePlayer();
    }
  }catch(e){}
  paintProfile();
  syncToCloud();
  loadLeaderboard();
}
async function syncToCloud(){
  if(!sb || !currentUser) return;
  try{
    await sb.from('profiles').upsert({
      id: currentUser.id,
      email: currentUser.email,
      chameleon_name: player.name,
      best_score: player.best||0,
      streak: player.streak||0,
      last_play_date: player.lastPlay || null,
      updated_at: new Date().toISOString()
    });
  }catch(e){}
}
async function loadLeaderboard(){
  if(!sb) return;
  try{
    const {data,error} = await sb.from('profiles')
      .select('chameleon_name,best_score')
      .order('best_score',{ascending:false})
      .limit(10);
    if(error || !data || !data.length) return;
    $('#leaderboard').hidden = false;
    $('#leader-list').innerHTML = data.map((r,i)=>
      `<li><span class="medal">${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</span>${esc(r.chameleon_name||'Chameleon')}<b>${r.best_score||0}%</b></li>`
    ).join('');
  }catch(e){}
}
async function restoreSession(){
  if(!sb) return;
  try{
    const {data} = await sb.auth.getSession();
    if(data && data.session && data.session.user) await onSignedIn(data.session.user);
    sb.auth.onAuthStateChange((event, session)=>{
      if(event === 'SIGNED_OUT'){ currentUser = null; $('#auth-toggle').textContent = 'Sign in'; paintProfile(); }
    });
    loadLeaderboard();
  }catch(e){}
}

/* ---------------- init ---------------- */
$('#chameleon').innerHTML = LIZARD_SVG;
$('#eagle').innerHTML = EAGLE_SVG;
$('#round-total').textContent = roundsTotal;
$('#seconds').textContent = secondsPerRound;
$('#timer-ring').style.strokeDasharray = '100';
$('#timer-ring').style.strokeDashoffset = '0';
if(!sb) $('#auth-toggle').style.display = 'none';
paintProfile();
paintColor();
positionWheelDot();
restoreSession();
window.addEventListener('resize', positionWheelDot);