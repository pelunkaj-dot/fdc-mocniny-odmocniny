import {notation} from './answers.mjs?v=5';
import {readExpression} from './expression.mjs?v=5';

const explanations={
 power:'Umocni základ. Závorka určuje, co všechno do základu patří.',
 root:'Najdi nezáporné číslo, jehož druhá mocnina je hodnota pod odmocninou.',
 cubeRoot:'Hledej číslo, které po umocnění na třetí dává hodnotu pod odmocninou.',
 product:'Vynásob číselné koeficienty. U mocnin stejné proměnné sečti exponenty.',
 division:'Vyděl koeficienty. U mocnin stejné proměnné odečti exponent jmenovatele.',
 sum:'Sečti nebo odečti čísla. U výrazů slučuj pouze členy se stejnou mocninou každé proměnné.'
};

function readable(source) {
 return source.replace(/\*/g,' · ').replace(/\./g,',').replace(/-/g,'−');
}
function format(value) {
 const variable=(name,n)=>n?name+(n===1?'':'^'+n):'';
 const entries=[...value].sort(([left],[right])=>{
   const [a,b]=left.split(',').map(Number),[c,d]=right.split(',').map(Number);
   return c+d-a-b||c-a;
 });
 return entries.map(([key,coefficient],index)=>{
   const [x,y]=key.split(',').map(Number);
   const top=variable('x',Math.max(0,x))+variable('y',Math.max(0,y));
   const bottom=variable('x',Math.max(0,-x))+variable('y',Math.max(0,-y));
   const magnitude=Math.abs(coefficient);
   const number=magnitude===1&&top?'':String(Number(magnitude.toPrecision(12))).replace('.',',');
   const sign=coefficient<0?(index?' − ':'−'):index?' + ':'';
   return sign+number+top+(bottom?'/'+(bottom.includes('x')&&bottom.includes('y')?'('+bottom+')':bottom):'');
 }).join('')||'0';
}
function singleRoot(source) {
 const m=source.match(/^(?:√|sqrt)(?:\((\d+)\)|(\d+))$/);
 if(!m) return null;
 const n=Number(m[1]??m[2]);
 if(n<=1||n>1e8) return null;
 for(let d=Math.floor(Math.sqrt(n));d>=2;d--) {
   if(n%(d*d)!==0) continue;
   const left=n/(d*d);
   const answer=left===1?String(d):d+'√('+left+')';
   return {steps:[{expression:readable(source),value:answer,help:'Najdi největší úplný čtverec, který dělí číslo pod odmocninou. Tady je to '+(d*d)+'. Rozlož '+n+' na '+(d*d)+' · '+left+' a odmocni čtverec.'}],answer,conditions:[]};
 }
 return {steps:[],answer:'√('+n+')',conditions:[]};
}

export function guide(input) {
 const source=notation(input).replace(/\^\s*\(/g,'^(');
 if(!source||source.length>120||/\d\s+\d/.test(source)) throw Error('Zapiš jeden výraz o délce nejvýše 120 znaků.');
 if(source.includes('=')) throw Error('Zapiš jeden výraz. Rovnice se řeší v modulu Rovnice.');
 const exactRoot=singleRoot(source.replace(/\s/g,''));
 if(exactRoot) return exactRoot;
 const steps=[];
 let value;
 try {
   value=readExpression(source,(kind,expression,result)=>{
     const display=readable(expression), answer=format(result);
     const plain=text=>text.replace(/[\s·]/g,'');
     if(plain(display)!==plain(answer)) steps.push({expression:display,value:answer,help:explanations[kind]});
   });
 } catch {
   throw Error('Zkontroluj zápis a podmínky. Podporované jsou celočíselné exponenty, x a y, odmocniny z čísel a dělení jednočlenem.');
 }
 return {steps, answer:format(value),conditions:[...value.nonzero],approximate:steps.length>0};
}

export function customExercise(root) {
 root.innerHTML='<nav><a href="#">← Rozcestník</a></nav><section class="panel custom">'+
   '<h2>Vlastní příklad</h2><p>Zadej jeden číselný výraz nebo výraz s x a y. Mocninu můžeš napsat jako x^2, odmocninu jako √(72) nebo sqrt(72).</p>'+
   '<form><label for="custom-expression">Tvůj výraz</label><input id="custom-expression" maxlength="120" autocomplete="off">'+
   '<div class="row"><button type="button" data-insert="√(">√(</button><button type="button" data-insert="∛(">∛(</button><button type="button" data-insert="^">^</button>'+
   '<button class="primary" type="submit">Pomoz mi ho vyřešit</button></div></form><div id="custom-output" aria-live="polite"></div></section>';
 const input=root.querySelector('input'), output=root.querySelector('#custom-output');
 for(const button of root.querySelectorAll('[data-insert]')) button.onclick=()=>{
   input.setRangeText(button.dataset.insert,input.selectionStart,input.selectionEnd,'end');
   input.focus();
 };
 root.querySelector('form').onsubmit=event=>{
   event.preventDefault();
   output.replaceChildren();
   let result;
   try {result=guide(input.value);} catch(error) {
     output.textContent=error.message;
     return;
   }
   const list=document.createElement('ol');
   list.className='steps';
   output.append(list);
   if(result.conditions.length) {
     const domain=document.createElement('p');
     domain.textContent='Podmínky: '+result.conditions.map(symbol=>symbol+' ≠ 0').join(', ')+'.';
     output.append(domain);
   }
   let shown=0;
   const next=document.createElement('button');
   next.type='button';
   next.textContent=result.steps.length?'Ukázat první krok':'Ukázat výsledek';
   function advance() {
     const step=result.steps[shown++];
     if(step) {
       const line=document.createElement('li');
       line.textContent=step.help+' '+step.expression+' → '+step.value;
       list.append(line);
       next.textContent=shown<result.steps.length?'Další krok':'Ukázat výsledek';
     } else {
       const answer=document.createElement('p');
       answer.tabIndex=-1;
       answer.textContent='Výsledek: '+result.answer+(result.approximate?' (desetinné hodnoty mohou být zaokrouhlené).':'.');
       next.replaceWith(answer);
       answer.focus();
     }
   }
   next.onclick=advance;
   output.append(next);
   next.focus();
 };
}
