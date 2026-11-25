import {readExpression, sameValue} from './expression.mjs?v=4';

const notation = value => String(value).toLowerCase().trim()
 .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, s=>'^('+[...s].map(c=>'0123456789-'['⁰¹²³⁴⁵⁶⁷⁸⁹⁻'.indexOf(c)]).join('')+')')
 .replace(/[−–]/g,'-').replace(/[×·⋅]/g,'*').replace(/[÷:]/g,'/')
 .replace(/\*\*/g,'^').replace(/,/g,'.');
const compact = value => value.replace(/\s+/g,'').replace(/\^\(([+-]?\d+)\)/g,'^$1');

const scalar = '[+-]?(?:\\d+(?:\\.\\d+)?|\\.\\d+)';
const fraction = new RegExp('^('+scalar+')/('+scalar+')$');
function number(s) {
 if(new RegExp('^'+scalar+'$').test(s)) return Number(s);
 const ratio = s.match(fraction);
 if(ratio && Number(ratio[2])!==0) return Number(ratio[1])/Number(ratio[2]);
 return NaN;
}

function scientific(s) {
 const m = s.match(new RegExp('^('+scalar+')(?:\\*10\\^|e)([+-]?\\d+)$'));
 if(!m || Math.abs(Number(m[2]))>300) return null;
 return {coefficient:Number(m[1]), value:Number(m[1])*10**Number(m[2])};
}

function radical(s) {
 const m=s.match(new RegExp('^('+scalar+'|[-+])?\\*?(?:√|sqrt)(?:\\((\\d+)\\)|(\\d+))$'));
 if(!m) return Number.isFinite(number(s)) ? {value:number(s),squareFree:false} : null;
 const n=Number(m[2]||m[3]);
 if(!Number.isSafeInteger(n)||n<1||n>1e7) return null;
 const coefficient=m[1]==='-'?-1:Number(m[1] && m[1]!=='+'?m[1]:1);
 let squareFree=n>1;
 for(let d=2;d*d<=n;d++) if(n%(d*d)===0) {squareFree=false;break;}
 return {value:coefficient*Math.sqrt(n),squareFree};
}

function powers(s) {
 const parts=s.split(/([*/])/);
 const exponents=new Map();
 const factors=new Set();
 let reduced=true;
 for(let i=0;i<parts.length;i+=2) {
   const term=parts[i].match(/^([a-z]|\d+)\^([+-]?\d+)$/);
   if(!term) return null;
   const [,base,exponent]=term;
   if(factors.has(base)) reduced=false;
   factors.add(base);
   exponents.set(base,(exponents.get(base)||0)+(parts[i-1]==='/'?-1:1)*Number(exponent));
 }
 return {key:JSON.stringify([...exponents].sort()),reduced};
}

function monomial(s) {
 if(s==='0') return 0;
 const m=s.match(new RegExp('^('+scalar+'|[-+])?\\*?x\\^2$'));
 if(!m) return NaN;
 return m[1]==='-'?-1:Number(m[1] && m[1]!=='+'?m[1]:1);
}
const equal=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-12*Math.max(1e-9,Math.abs(a),Math.abs(b));

function finalForm(task,s,target) {
 switch(task.form) {
 case 'choice': return s===target?'correct':'wrong';
 case 'power': {
   const expected=powers(target), given=powers(s);
   if(given && expected && given.key===expected.key) return given.reduced?'correct':'form';
   if(/^\d+\^\d+$/.test(target)) {
      const [base,e]=target.split('^').map(Number);
      if(equal(number(s),base**e)) return 'form';
   }
   return 'wrong';
 }
 case 'fraction':
   return equal(number(s),number(target))?(fraction.test(s)?'correct':'form'):'wrong';
 case 'scientific': {
   const expected=scientific(target), given=scientific(s);
   if(!equal(given?.value??number(s),expected?.value)) return 'wrong';
   return given && given.coefficient>=1 && given.coefficient<10?'correct':'form';
 }
 case 'root':
 case 'radical': {
   const expected=radical(target), given=radical(s);
   if(!equal(given?.value,expected?.value)) return 'wrong';
   if(target==='0') return s==='0'?'correct':'form';
   if(task.form==='root') return /^(?:√|sqrt)/.test(s)?'correct':'form';
   return given.squareFree?'correct':'form';
 }
 case 'monomial': return equal(monomial(s),monomial(target))?'correct':'wrong';
 default: return equal(number(s),number(target))?'correct':'wrong';
 }
}

export function grade(task,input) {
 const source=notation(input);
 if(!source || source.length>160) return 'invalid';
 if(task.form==='choice') return finalForm(task,compact(source),notation(task.answer));
 if(/\d\s+\d/.test(source)) return 'invalid';
 const parts=source.split('=').map(part=>part.trim());
 const target=notation(task.answer);
 const allowedVariables=new Set(target.match(/[xy]/g)??[]);
 const allowedNonzero=new Set();
 for(const expression of [target,notation(task.expr??'')]) {
   try {for(const symbol of readExpression(expression).nonzero) allowedNonzero.add(symbol);} catch {}
 }
 let outcome;
 for(const [index,part] of parts.entries()) {
   if([...part.matchAll(/[xy]/g)].some(([symbol])=>!allowedVariables.has(symbol))) return 'wrong';
   const form=finalForm(task,compact(part),compact(target));
   if(form==='correct'||form==='form') {
     outcome=form;
     continue;
   }
   let value;
   try {value=readExpression(part);} catch {return 'invalid';}
   try {
     if([...value.nonzero].every(symbol=>allowedNonzero.has(symbol)) && sameValue(value,readExpression(target))) {
       outcome='step';
       continue;
     }
     // A calculator expression may still need rounding to the requested precision.
     if(task.prompt?.includes('zaokrouhli') && !Number.isFinite(number(compact(part))) &&
         sameValue(value,readExpression(notation(task.expr)))) {
       outcome='step';
       continue;
     }
   } catch {}
   if(index===0&&parts.length>1&&compact(part)===compact(notation(task.expr))) {
     // The displayed prompt can be the first entry only if it is an expression to evaluate.
     if(!task.prompt?.startsWith('Vypočítej')&&!task.prompt?.startsWith('Uprav')&&
        !task.prompt?.startsWith('Částečně odmocni')&&!task.prompt?.startsWith('Zjednoduš')) return 'wrong';
     continue;
   }
   return 'wrong';
 }
 return outcome??'invalid';
}
