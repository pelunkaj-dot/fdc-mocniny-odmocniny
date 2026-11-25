import {bank, topics, LIMIT} from './tasks.mjs';
import {grade} from './answers.mjs';
import {math} from './render.mjs';

const demo=document.body.dataset.version==='demo';
const root=document.querySelector('#app');
const offer='<a class="button primary" href="https://fajndoucko.cz/fajncvicebna/">Chci plnou FajnCvičebnu</a>';
const symbols=['(-3)^2','∛(-27)','x^2 · x^3','2^(-3)','√(72)','10^(-4)','(2 + 3)^2','(x + 3)^2'];
const demoTopics=[0,1,2,4,5,7];
const storageKey='fdc-powers-v1-'+(demo?'demo':'full');
const hints={
 number:'Zadej číslo. Můžeš použít desetinnou čárku nebo zlomek a/b.',
 choice:'Vyber odpověď.',
 power:'Zapiš výsledek jako mocninu nebo upravený součin či podíl mocnin. Exponent zapisuj pomocí ^.',
 fraction:'Zapiš výsledek jako zlomek a/b.',
 radical:'Zapiš výsledek s částečně odmocněným číslem, třeba 3√(2). Nulu zapiš jako 0.',
 root:'Zapiš jednu odmocninu, třeba √(13).',
 scientific:'Zapiš vědecký tvar, třeba 4,2 × 10^(-3).',
 monomial:'Zapiš zjednodušený člen, třeba 3x^2. Nulu zapiš jako 0.'
};

let progress={used:0, stats:{}};
try {progress=JSON.parse(localStorage.getItem(storageKey))??progress;} catch {}
function save() {
 try {localStorage.setItem(storageKey,JSON.stringify(progress));} catch {}
}

let audio, sound=true;
async function play() {
 if(!sound) return;
 try {
   audio??=new AudioContext();
   await audio.resume();
   const start=audio.currentTime;
   [523,659,784].forEach((frequency,index)=>{
      const oscillator=audio.createOscillator();
      const volume=audio.createGain();
      const now=start+index*.075;
      oscillator.frequency.value=frequency;
      volume.gain.setValueAtTime(.09,now);
      volume.gain.exponentialRampToValueAtTime(.001,now+.18);
      oscillator.connect(volume).connect(audio.destination);
      oscillator.start(now);
      oscillator.stop(now+.18);
   });
 } catch {}
}

const decks=new Map();
function nextTask(topic,level) {
 const key=topic+'/'+level;
 let deck=decks.get(key);
 if(!deck?.remaining.length) {
   const remaining=bank(topic,level);
   for(let i=remaining.length-1;i>0;i--) {
     const j=Math.floor(Math.random()*(i+1));
     [remaining[i],remaining[j]]=[remaining[j],remaining[i]];
   }
   if(deck && remaining.at(-1).expr===deck.last) {
     [remaining[0],remaining[remaining.length-1]]=[remaining.at(-1),remaining[0]];
   }
   deck={remaining};
   decks.set(key,deck);
 }
 const task=deck.remaining.pop();
 deck.last=task.expr;
 return task;
}

function hub() {
 const banner=demo?'<div class="notice">Demo nabízí 18 úloh celkem v šesti okruzích. '+offer+'</div>':'';
 root.innerHTML=banner+'<h2>Vyber si cvičebnu</h2><div class="grid">'+topics.map(([title],i)=>{
   const available=!demo||demoTopics.includes(i);
   return '<section class="panel tile"><div class="art">'+math(symbols[i])+'</div><h2>'+title+'</h2>'+
     (available?'<a class="button" href="#'+(i+1)+'/1">Procvičovat</a>':'<small>V plné verzi</small>')+'</section>';
 }).join('')+'</div>';
}

function exercise(topic,level) {
 const [title,lesson,example]=topics[topic];
 const key=topic+'/'+level;
 const counts=progress.stats[key]??={first:0,second:0,missed:0};
 root.innerHTML='<nav class="row toolbar"><a href="#">← Rozcestník</a>'+
   '<button id="sound" type="button"></button></nav>'+
   '<div class="layout"><section class="panel"><h2>'+title+'</h2>'+
   '<div class="row"><label for="level">Obtížnost</label><select id="level">'+
    ['Základní','Střední','Pokročilá'].slice(0,demo?1:3).map((label,i)=>'<option value="'+i+'">'+label+'</option>').join('')+
   '</select></div><div id="practice"></div></section>'+
   '<aside class="panel"><h2>Jak na to</h2><p>'+lesson+'</p>'+
   '<div class="notice">'+example.split('; ').map(math).join('<br>')+'</div>'+
   '<h2>Výsledky této úrovně</h2><dl id="stats"></dl>'+(demo?offer:'')+'</aside></div>';
 const difficulty=root.querySelector('#level');
 difficulty.value=level;
 difficulty.onchange=()=>{location.hash=(topic+1)+'/'+(Number(difficulty.value)+1);};
 const soundButton=root.querySelector('#sound');
 function labelSound() { soundButton.textContent='Zvuk '+(sound?'zapnutý':'vypnutý');soundButton.setAttribute('aria-pressed',String(sound)); }
 labelSound();
 soundButton.onclick=()=>{sound=!sound;labelSound();};

 function stats() {
   const total=counts.first+counts.second+counts.missed;
   const correct=counts.first+counts.second;
   root.querySelector('#stats').innerHTML=
     '<dt>Správně napoprvé</dt><dd>'+counts.first+'</dd><dt>Správně napodruhé</dt><dd>'+counts.second+
     '</dd><dt>Se zobrazeným řešením</dt><dd>'+counts.missed+'</dd><dt>Úspěšnost</dt><dd>'+
     (total?Math.round(100*correct/total)+' %':'—')+'</dd>';
 }
 const area=root.querySelector('#practice');

 function renderTask(focus=false) {
   stats();
   if(demo&&progress.used>=LIMIT) {
     area.innerHTML='<div class="notice"><h3>Demo je dokončeno</h3><p>Vyčerpal jsi všech '+LIMIT+' ukázkových úloh.</p>'+offer+'</div>';
     return;
   }
   const task=nextTask(topic,level);
   let attempts=0, finished=false;
   const controls=task.choices?
     '<div class="row">'+task.choices.map(c=>'<button type="button" data-choice="'+c+'">'+c+'</button>').join('')+'</div>':
     '<label for="answer">Odpověď</label><input id="answer" aria-describedby="hint" autocomplete="off" maxlength="100">'+
     '<p id="hint" class="muted">'+hints[task.form]+'</p>'+
     '<div class="row" id="keys" aria-label="Matematické znaky">'+['−',',','/','^','√(',')','×','x','y'].map(c=>'<button type="button" data-key="'+c+'">'+c+'</button>').join('')+'</div>'+
     '<p><button class="primary" type="submit">Zkontrolovat</button></p>';
   area.innerHTML=(demo?'<p class="muted">Ukázková úloha '+(progress.used+1)+' z '+LIMIT+'</p>':'')+
     '<p>'+task.prompt+'</p><div class="expression">'+math(task.expr)+'</div>'+
     '<form>'+controls+'</form><p class="feedback" aria-live="polite"></p><div id="solution" hidden></div>'+
     '<button class="primary" id="next" type="button" hidden>Další úloha</button>';
   const form=area.querySelector('form');
   const input=form.querySelector('input');
   const feedback=area.querySelector('.feedback');
   const solution=area.querySelector('#solution');
   const next=area.querySelector('#next');
   if(focus) (input??form.querySelector('button')).focus();
   next.onclick=()=>renderTask(true);
   function submit(answer) {
     if(finished || !answer.trim()) return;
     const result=grade(task,answer);
     attempts++;
     feedback.dataset.status=result;
     if(result!=='correct' && attempts===1) {
       feedback.textContent=result==='form'?'Hodnota odpovídá. Uprav zápis podle pokynu a zkus to znovu.':'Zkus to ještě jednou.';
       input?.focus();
       input?.select();
       return;
     }
     finished=true;
     if(result==='correct') {
       counts[attempts===1?'first':'second']++;
       feedback.textContent='Správně!';
       void play();
     } else {
       counts.missed++;
       feedback.textContent=result==='form'?'Hodnota odpovídá. Podívej se na požadovaný tvar.':'Podívej se na řešení.';
     }
     solution.innerHTML='<p><strong>Výsledek</strong> '+(task.choices?task.answer:math(task.answer))+'</p><p>'+task.why+'</p>';
     solution.hidden=false;
     if(demo) progress.used++;
     save();
     stats();
     form.querySelectorAll('button,input').forEach(control=>{control.disabled=true;});
     next.hidden=false;
     next.focus();
   }
   form.onsubmit=event=>{event.preventDefault(); if(input) submit(input.value);};
   form.querySelectorAll('[data-choice]').forEach(button=>{button.onclick=()=>submit(button.dataset.choice);});
   form.querySelectorAll('[data-key]').forEach(button=>{
     button.onclick=()=>{
       input.setRangeText(button.dataset.key,input.selectionStart,input.selectionEnd,'end');
       input.focus();
     };
   });
 }
 renderTask();
}

function route() {
 const match=location.hash.match(/^#([1-8])\/([1-3])$/);
 if(!match) {hub();return;}
 const topic=Number(match[1])-1,level=Number(match[2])-1;
 if(demo && (level!==0 || !demoTopics.includes(topic))) {
   history.replaceState(null,'',location.pathname+location.search);
   hub();
   return;
 }
 exercise(topic,level);
}
if(document.documentElement.style.visibility!=='hidden') {
 addEventListener('hashchange',route);
 route();
}
