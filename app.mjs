import {topics, LIMIT} from './tasks.mjs';
import {modes, practiceBank} from './practice.mjs?v=7';
import {grade} from './answers.mjs?v=5';
import {math} from './render.mjs';
import {coachHint, continuationHint, milestones, award} from './coach.mjs?v=8.1';
import {customExercise} from './tutor.mjs?v=5';
import {createPowerTable} from './power-table.mjs';

const demo=document.body.dataset.version==='demo';
const root=document.querySelector('#app');
const tableMedia=matchMedia('(max-width: 680px)');
let mountPowerTable;
tableMedia.addEventListener('change',()=>mountPowerTable?.());
const offer='<a class="button primary" href="https://fajndoucko.cz/fajncvicebna/">Chci plnou FajnCvičebnu</a>';
const symbols=['(-3)^2','∛(-27)','x^2 · x^3','2^(-3)','√(72)','10^(-4)','(2 + 3)^2','(x + 3)^2'];
const demoTopics=[0,1,2,4,5,7];
const modeSymbols={mental:'3^2',tables:'√(2025)',calculator:'√(12,34)',algebra:'x^2 · y^3'};
const storageKey='fdc-powers-v1-'+(demo?'demo':'full');
const hints={
 algebra:'Piš x a y, exponent pomocí ^. Například 12x^3 nebo y^3/x^2.',
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
function nextTask(mode,topic,level) {
 const key=mode+'/'+topic+'/'+level;
 let deck=decks.get(key);
 if(!deck?.remaining.length) {
   const remaining=practiceBank(mode,topic,level);
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

function hub(mode=null,game=false) {
 const gamePath=game?'/hra':'';
 const banner=demo?'<div class="notice">Demo nabízí 18 úloh celkem ve všech režimech dohromady. '+offer+'</div>':'';
 if(!mode) {
   root.innerHTML='<section class="welcome"><div><h2>Procvičuj po svém</h2><p>Trénuj vlastním tempem nebo zkus výstup na vrchol. V každém režimu máš po ruce nápovědu.</p></div><div class="row"><a class="button primary" href="#hra">Hrát Výstup na vrchol</a><a class="button" href="#algebra">Úlohy s proměnnými</a><a class="button" href="#vlastni">Vlastní příklad</a></div></section>'+banner+'<h2>Jak chceš počítat?</h2><div class="grid">'+Object.entries(modes).filter(([id])=>id!=='algebra').map(([id,[title,description]])=>
     '<section class="panel tile"><div class="art">'+math(modeSymbols[id])+'</div><h2>'+title+'</h2><p>'+description+'</p><a class="button" href="#'+id+'">Vybrat cvičebnu</a></section>'
   ).join('')+'</div>';
   return;
 }
 if(mode==='hra') {
   root.innerHTML='<nav><a href="#">← Rozcestník</a></nav><h2>Výstup na vrchol</h2><p>Vyber pomůcku a téma. Za správné odpovědi získáš body a odemkneš zastávky na výstupu.</p>'+gameCard()+
    '<div class="grid">'+Object.entries(modes).map(([id,[title,description]])=>
      '<section class="panel tile"><h2>'+title+'</h2><p>'+description+'</p><a class="button primary" href="#'+id+'/hra">Vybrat téma</a></section>'
    ).join('')+'</div>';
   return;
 }
 const [label,description,availableTopics]=modes[mode];
 root.innerHTML=banner+'<nav><a href="#'+(game?'hra':'')+'">← Způsob počítání</a></nav><h2>'+label+(game?' · Výstup na vrchol':'')+'</h2><p>'+description+'</p><div class="grid">'+availableTopics.map(i=>{
   const available=!demo||mode!=='mental'||demoTopics.includes(i);
   return '<section class="panel tile"><div class="art">'+math(symbols[i])+'</div><h2>'+topics[i][0]+'</h2>'+
     (available?'<a class="button" href="#'+mode+'/'+(i+1)+'/1'+gamePath+'">'+(game?'Hrát':'Procvičovat')+'</a>':'<small>V plné verzi</small>')+'</section>';
 }).join('')+'</div>';
}

function gameCard() {
 const points=progress.points??0;
 const upcoming=milestones.find(([,minimum])=>points<minimum);
 return '<section class="game-card" aria-label="Herní postup"><h2>Výstup na vrchol</h2><p><strong>'+points+' bodů</strong> · '+
  (upcoming?'Další zastávka: '+upcoming[0]+' za '+(upcoming[1]-points)+' bodů':'Vrchol zdolán! Body můžeš sbírat dál.')+
  '</p><progress aria-label="Postup k vrcholu" max="32" value="'+Math.min(points,32)+'"></progress><ol class="route-stops">'+
  milestones.map(([name,minimum])=>'<li class="'+(points>=minimum?'reached':'')+'">'+(points>=minimum?'✓ ':'')+name+'</li>').join('')+
  '</ol><small>2 body za správnou odpověď napoprvé bez nápovědy, 1 bod po nápovědě nebo na druhý pokus.</small></section>';
}

function exercise(mode,topic,level,game=false) {
 const gamePath=game?'/hra':'';
 const [modeTitle,modeDescription]=modes[mode];
 const [title,lesson,example]=topics[topic];
 const schoolWork=mode==='mental'||mode==='algebra';
 const table=mode==='tables'?createPowerTable():null;
 const tableSlot=table?'<div id="table-inline"></div>':'';
 const key=mode+'/'+topic+'/'+level;
 const counts=progress.stats[key]??={first:0,second:0,missed:0};
 root.innerHTML='<nav class="row toolbar"><a href="#'+mode+gamePath+'">← Výběr cvičebny</a>'+
   '<button id="sound" type="button"></button></nav>'+
   '<div class="layout"><section class="panel"><h2>'+title+'</h2><p class="notice"><strong>'+modeTitle+'</strong><br>'+modeDescription+'</p>'+
   '<div class="row"><label for="level">Obtížnost</label><select id="level">'+
    ['Základní','Střední','Pokročilá'].slice(0,demo?1:3).map((label,i)=>'<option value="'+i+'">'+label+'</option>').join('')+
   '</select></div><div id="practice"></div></section>'+
   '<aside class="panel">'+(table?'<div id="table-desktop"></div>':'')+(game?'<div id="game">'+gameCard()+'</div>':'')+'<section id="work-guide" hidden><h2>Jak na to</h2><p>'+(schoolWork?lesson:modeDescription)+'</p>'+
   '<div class="notice">'+(schoolWork?example:mode==='tables'?'√(2025) = 45; 45^2 = 2025':'√(12,34) ≈ 3,51').split('; ').map(math).join('<br>')+'</div></section>'+
   '<h2>Výsledky této úrovně</h2><dl id="stats"></dl>'+(demo?offer:'')+'</aside></div>';
 const difficulty=root.querySelector('#level');
 difficulty.value=level;
 difficulty.onchange=()=>{location.hash=mode+'/'+(topic+1)+'/'+(Number(difficulty.value)+1)+gamePath;};
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
 const workGuide=root.querySelector('#work-guide');
 const scroll=table?.querySelector('.table-scroll');
 let tablePosition=0;
 let wasNarrow=null;
 if(table) mountPowerTable=()=>{
   const narrow=tableMedia.matches;
   const target=root.querySelector(narrow?'#table-inline':'#table-desktop');
   if(!target||target===table.parentNode) return;
   if(table.isConnected&&table.open) tablePosition=scroll.scrollTop;
   if(narrow!==wasNarrow) {
     table.open=!narrow;
     wasNarrow=narrow;
   }
   target.append(table);
   if(table.open) scroll.scrollTop=tablePosition;
 };
 if(table) {
   table.addEventListener('toggle',()=>{
     if(table.open) scroll.scrollTop=tablePosition;
   });
   scroll.addEventListener('scroll',()=>{
     if(table.open&&table.isConnected&&scroll.clientHeight) tablePosition=scroll.scrollTop;
   });
 }



 function renderTask(focus=false) {
   stats();
   workGuide.hidden=true;
   // Preserve the same table and its scroll position while replacing the exercise.
   if(tableMedia.matches&&table?.isConnected&&table.open) tablePosition=scroll.scrollTop;
   if(demo&&progress.used>=LIMIT) {
     area.innerHTML='<div class="notice"><h3>Demo je dokončeno</h3><p>Vyčerpal jsi všech '+LIMIT+' ukázkových úloh.</p>'+offer+'</div>'+tableSlot;
     mountPowerTable?.();
     return;
   }
   const task=nextTask(mode,topic,level);
   let attempts=0, finished=false, assisted=false;
   const controls=task.choices?
     '<div class="row">'+task.choices.map(c=>'<button type="button" data-choice="'+c+'">'+c+'</button>').join('')+'</div>':
     '<label for="answer">Odpověď</label><input id="answer" aria-describedby="hint" autocomplete="off" maxlength="160">'+
     '<p id="hint" class="muted">'+hints[task.form]+'</p>'+
     '<div class="row" id="keys" aria-label="Matematické znaky">'+['−',',','/','^','√(',')','×','x','y'].map(c=>'<button type="button" data-key="'+c+'">'+c+'</button>').join('')+'</div>'+
     '<p><button class="primary" type="submit">Zkontrolovat</button></p>';
   area.innerHTML=(demo?'<p class="muted">Ukázková úloha '+(progress.used+1)+' z '+LIMIT+'</p>':'')+
     '<p>'+task.prompt+'</p><div class="expression">'+math(task.expr)+'</div>'+tableSlot+
     (task.condition?'<p class="muted">Podmínka '+math(task.condition)+'</p>':'')+
     '<section class="continuation" hidden><strong>Správný mezikrok</strong>'+
     '<ol id="steps" aria-label="Správné mezikroky"></ol><p id="step-direction"></p></section>'+
     '<div class="coach task-help" id="task-hint" hidden><strong>Nápověda</strong><p></p></div>'+
     '<form>'+controls+'</form><p class="feedback" aria-live="polite"></p>'+
     '<div class="row task-help-actions"><button type="button" id="give-up" aria-describedby="give-up-note">Nevím, jak začít</button>'+
     '<small id="give-up-note">Nápověda se otevře a přejdeš k druhému pokusu.</small>'+
     '<button type="button" id="show-solution" hidden>Zobrazit řešení</button></div><div id="solution" hidden></div>'+
     '<button class="primary" id="next" type="button" hidden>Další úloha</button>';
   mountPowerTable?.();
   const coach=area.querySelector('#task-hint');
   const form=area.querySelector('form');
   const input=form.querySelector('input');
   const feedback=area.querySelector('.feedback');
   const steps=area.querySelector('#steps');
   const continuation=area.querySelector('.continuation');
   const direction=area.querySelector('#step-direction');
   const solution=area.querySelector('#solution');
   const next=area.querySelector('#next');
   const giveUp=area.querySelector('#give-up');
   const giveUpNote=area.querySelector('#give-up-note');
   const showSolution=area.querySelector('#show-solution');
   const focusAnswer=()=> (input??form.querySelector('button')).focus();
   function unlockSolution() {
     giveUp.hidden=true;
     giveUpNote.hidden=true;
     showSolution.hidden=false;
     workGuide.hidden=false;
   }
   function showHint() {
     unlockSolution();
     assisted=true;
     coach.hidden=false;
     coach.querySelector('p').textContent=steps.lastElementChild
       ? continuationHint(task,steps.lastElementChild.textContent,'step')
       : coachHint(mode,topic,task);
     input?.setAttribute('aria-describedby',steps.lastElementChild?'task-hint step-direction hint':'task-hint hint');
   }
   giveUp.onclick=()=>{
     attempts=1;
     showHint();
     feedback.textContent='Podívej se na nápovědu. Pak zkus druhý pokus.';
     focusAnswer();
   };
   showSolution.onclick=()=>finish(false);
   if(focus) (input??form.querySelector('button')).focus();
   next.onclick=()=>renderTask(true);
   function submit(answer) {
     if(finished || !answer.trim()) return;
     const result=grade(task,answer);
     feedback.dataset.status=result;
     if(result==='step'||result==='form') {
       feedback.textContent='';
       coach.hidden=true;
       unlockSolution();
       const heading=continuation.querySelector('strong');
       heading.textContent=result==='form'?'Hodnota souhlasí':'Správný mezikrok';
       direction.textContent=continuationHint(task,answer,result)+' Do pole níže napiš, co ti vyšlo, a stiskni Enter nebo Zkontrolovat.';
       continuation.hidden=false;
       if(steps.lastElementChild?.textContent!==answer.trim()) {
         const line=document.createElement('li');
         line.textContent=answer.trim();
         steps.append(line);
       }
       const label=form.querySelector('label');
       label.textContent='Další mezikrok nebo výsledek';
       input.setAttribute('aria-describedby','step-direction hint');
       input.value='';
       input.focus();
       return;
     }
     if(result==='invalid') {
       feedback.textContent='Zápis se nedá vyhodnotit. Zkontroluj závorky, znaménka a případné dělení nulou.';
       input?.focus();
       return;
     }
     attempts++;
     if(result!=='correct' && attempts===1) {
       showHint();
       feedback.textContent='Zkus to ještě jednou. Nápovědu máš nad odpovědí.';
       focusAnswer();
       input?.select();
       return;
     }
     finish(result==='correct');
   }
   function finish(correct) {
     if(finished) return;
     finished=true;
     direction.hidden=true;
     coach.hidden=true;
     giveUp.hidden=true;
     giveUpNote.hidden=true;
     showSolution.hidden=true;
     workGuide.hidden=false;
     if(correct) {
       counts[attempts===1?'first':'second']++;
       feedback.textContent='Správně!';
       if(game) {
         const before=progress.points??0;
         progress.points=award(before,'correct',attempts,assisted);
         const unlocked=milestones.filter(([,minimum])=>minimum>before&&minimum<=progress.points).at(-1);
         feedback.textContent+=' +'+(progress.points-before)+(progress.points-before===1?' bod':' body')+'.'+(unlocked?' Odemčeno: '+unlocked[0]+'!':'');
         root.querySelector('#game').innerHTML=gameCard();
       }
       void play();
     } else {
       counts.missed++;
       feedback.textContent='Podívej se na řešení.';
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
 mountPowerTable=undefined;
 const hash=location.hash.slice(1);
 if(/^([1-8])\/([1-3])$/.test(hash)) {
   location.replace('#mental/'+hash);
   return;
 }
 const [mode,topicNumber,levelNumber,gameFlag]=hash.split('/');
 if(hash==='vlastni') {customExercise(root);return;}
 if(hash==='hra') {hub('hra');return;}
 if(!Object.hasOwn(modes,mode)) {hub();return;}
 if(!topicNumber||topicNumber==='hra') {hub(mode,topicNumber==='hra');return;}
 const topic=Number(topicNumber)-1,level=Number(levelNumber)-1;
 if(!modes[mode][2].includes(topic)||![0,1,2].includes(level)||
     (demo && (level!==0 || (mode==='mental'&&!demoTopics.includes(topic))))) {
   history.replaceState(null,'','#'+mode);
   hub(mode);
   return;
 }
 exercise(mode,topic,level,gameFlag==='hra');
}
if(document.documentElement.style.visibility!=='hidden') {
 addEventListener('hashchange',route);
 route();
}
