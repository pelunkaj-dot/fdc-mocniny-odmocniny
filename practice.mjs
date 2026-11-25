import {bank, makeTask} from './tasks.mjs';

export const modes = {
 mental: ['Zpaměti / bez pomůcek','Počítej zpaměti nebo si zapiš mezikrok na papír. Úlohy využívají malé hodnoty, známé mocniny a pravidla pro úpravu výrazů.',[0,1,2,3,4,5,6,7]],
 tables: ['S tabulkami','Použij tabulku druhých mocnin přirozených čísel od 1 do 100. Výsledek vyhledej nebo porovnej dva sousední řádky.',[0,1,6]],
 calculator: ['S kalkulačkou','Použij kalkulačku a zaokrouhli až konečný výsledek. Počet desetinných míst je u každé úlohy uvedený.',[0,1,6]]
};

const task=(prompt,expr,answer,why)=>({prompt,expr,answer:String(answer).replace('.',','),why,form:'number'});
const square=n=>n+'^2';
const cubed=n=>n+'^3';
const root=n=>'√('+n+')';
const cz=n=>String(n).replace('.',',');
const decimal=(n,d)=>cz(n/10**d);
const mentalTopics=new Set([0,1,3,4,5,6,7]);

function mental(topic,level,i) {
 const v=Math.floor(i/81);
 const smallCube=(topic===0||topic===1||(topic===7&&level<2)) && v%2===1;
 const a=smallCube?2+i%4:1+i%9;
 const b=smallCube && level===2?2+Math.floor(i/4)%4:2+Math.floor(i/9)%9;
 const c=1+v%5;
 const pair=['('+a+'/'+b+')','('+b+'/'+a+')'];
 const fraction=(x,y)=>x+'/'+y;
 switch(topic) {
 case 0: {
   if(level===0) {
     const expr=v%2?cubed(a):square(a);
     const value=a**(v%2?3:2);
     return task('Vypočítej.',expr+(v<2?' + ':' − ')+b,v<2?value+b:value-b,'Nejprve umocni základ. Potom '+(v<2?'přičti':'odečti')+' '+b+'.');
   }
   const exponent=2+v%2, n=v<2?a:-a;
   if(level===1) {
     const scale=v===4?2:1;
     return task('Vypočítej.', '('+decimal(n,scale)+')^'+exponent+(v%2?' + ':' − ')+decimal(b,scale),Number(((n/10**scale)**exponent+(v%2?1:-1)*b/10**scale).toFixed(scale*exponent)),'Umocni číslo v závorce. Pak srovnej řády při sčítání nebo odčítání.');
   }
   const add=v>=2?1:-1, numerator=v===5?-a:a;
   return task('Vypočítej.','('+numerator+'/'+b+')^'+exponent+(add>0?' + ':' − ')+fraction(1,b**exponent),
     fraction(numerator**exponent+add,b**exponent),'Umocni čitatele a jmenovatele. Výsledné zlomky mají společného jmenovatele.');
 }
 case 1: {
   const exponent=2+v%2, symbol=exponent===2?'√':'∛';
   const sign=v===3||v===5?-1:1;
   const step=v===5?2:1;
   if(level===0) return task('Vypočítej.',symbol+'('+(sign*a**exponent)+') '+(v>=2?'−':'+')+' '+b,
      sign*a+(v>=2?-b:b),'Najdi číslo, jehož '+exponent+'. mocninou je číslo pod odmocninou. Pak dokonči výpočet.');
   const radicand=level===1?decimal(a**exponent,exponent):fraction(a**exponent,b**exponent);
   return task('Vypočítej.',symbol+'('+(sign<0?'−':'')+radicand+') '+(v>=2?'−':'+')+' '+(level===1?decimal(b,1):fraction(step,b)),
     level===1?Number(((sign*a+(v>=2?-b:b))/10).toFixed(1)):fraction(sign*a+(v>=2?-step:step),b),
     level===1?'Odmocni desetinné číslo a pak dokonči sčítání nebo odčítání.':'Odmocni čitatele i jmenovatele a pak dokonči sčítání nebo odčítání.');
 }
 case 3: {
   const e=1+v%2, offset=level===0?b:level===1?-b:b+c;
   if(level===2 && v%3===0) return task('Kterou hodnotu nesmí mít x?', '(x − '+(a+10*(b-2))+')^(-'+e+')',a+10*(b-2),'Základ záporné mocniny nesmí být nula.');
   const term=(offset<0?' − ':' + ')+Math.abs(offset)+'/'+a**e;
   const value=v>=2 ? a**e+offset : offset+(level===1&&e===1?-1:1);
   return task('Vypočítej jako zlomek nebo číslo.',(v>=2?'('+a+'^0)':(level===1?'(−'+a+')':a)+'^(-'+e+')')+term,
      fraction(value,a**e),'Nultá mocnina nenulového čísla je 1. Záporný exponent převrací základ. Nakonec použij společného jmenovatele.');
 }
 case 4: {
   const r=[2,3,5,6,7,10][v], other=[3,5,2,5,2,3][v];
   const factor=2+a%4;
   if(level===1 && v%2===0) return task('Vypočítej podíl odmocnin.',root(factor*factor*r)+' : '+root(r)+' + '+b,factor+b,'Podíl odmocnin je '+factor+'. Potom přičti '+b+'.');
   const coef=level===2 ? factor+b : factor*b;
   const expression=level===2?root(factor*factor*r)+' + '+b+root(r):root(factor*factor*r)+' · '+(b+root(other));
   const radicand=level===2?r:r*other;
   return {...task('Částečně odmocni a zjednoduš.',expression,coef+'√('+radicand+')',
     level===2?'Vytkni úplné čtverce a sečti koeficienty.':'Vytkni úplné čtverce a vynásob zbylé odmocniny.'),form:'radical'};
 }
 case 5: {
   const m=cz(a+(b-1)/10), e=(v%2?-1:1)*(1+Math.floor(v/2)), n=Number(((a+(b-1)/10)*10**e).toPrecision(10));
   if(level===0) return task('Zapiš jako běžné desetinné číslo.',m+' × 10^('+e+')',n,'Posuň desetinnou čárku o '+Math.abs(e)+' míst '+(e<0?'doleva.':'doprava.'));
   const answer=m+' × 10^('+e+')';
   return {...task('Zapiš ve vědeckém tvaru.',level===1?cz(n):m+' × 10^('+(e-c)+') · 10^'+c,answer,level===1?'Přesuň čárku za první nenulovou číslici.':'Při násobení mocnin deseti exponenty sečti.'),form:'scientific'};
 }
 case 6:
   if(level===0) return task('Vypočítej.',square('('+a+' + '+c+')')+' − '+root(b*b),(a+c)**2-b,'Sečti v závorce, umocni, odmocni a nakonec odečti.');
   if(level===1) return task('Vypočítej.',pair[0]+'^2 '+(v%2?'−':'+')+' '+root(c*c)+'/'+b,
     fraction(a*a+(v%2?-1:1)*c*b,b*b),'Nejprve umocni a odmocni. Pak použij společného jmenovatele.');
   return {...task('Zjednoduš výraz s x.',square('('+a+'x)')+' − '+root(b*b)+'x^2 + '+c+'x^2',
      (a*a-b+c===0?'0':(a*a-b+c)+'x^2'),'Umocni koeficient, odmocni a spoj koeficienty u x².'),form:'monomial'};
 case 7:
   if(level<2) {
     const exponent=2+v%2, correct=((-a)**exponent)+(level===0?b:-b);
     const shown=v>=2?correct:correct+(-1)**b;
     return {...task('Je výpočet správný?','(−'+a+')^'+exponent+(level===0?' + ':' − ')+b+' = '+shown,
      v>=2?'ano':'ne','Správný výsledek je '+correct+'. Závorky patří k základu, sčítání nebo odčítání přijde až po umocnění.'),
      form:'choice',choices:['ano','ne']};
   }
   if(v>=2) return task('Oprav vynechaný koeficient u y.',square('('+a+'y'+(v%2?' − ':' + ')+b+')')+' = '+a*a+'y^2 + ?y + '+b*b,2*a*b*(v%2?-1:1),'Smíšený člen je dvojnásobek součinu obou členů včetně znaménka.');
   return task('Oprav vynechaný koeficient u x.',square('('+a+'x'+(v%2?' − ':' + ')+b+')')+' = '+a*a+'x^2 + ?x + '+b*b,2*a*b*(v%2?-1:1),'Smíšený člen je dvojnásobek součinu obou členů.');
 }
}

function tables(topic,level,i) {
 const n=11+i%85, choice=Math.floor(i/85), m=n+1;
 if(topic===0) {
   const offset=choice+1;
   return task('Vyhledej druhou mocninu v tabulce. Potom dokonči výpočet.',
     square(level===0?n:'(−'+n+')')+(level===2?' − ':' + ')+offset,n*n+(level===2?-offset:offset),
     'V řádku '+n+' najdeš '+n*n+'. Druhá mocnina záporného základu má stejnou hodnotu.');
 }
 if(topic===1) {
   if(level===0) return task('Najdi v tabulce druhou odmocninu. Potom přičti uvedené číslo.',root(n*n)+' + '+(choice+1),n+choice+1,'Číslo '+n*n+' najdeš ve sloupci druhých mocnin u čísla '+n+'.');
   const target=n*n+choice+1;
   return task(level===1?'Najdi celé číslo těsně pod odmocninou.':'Najdi celé číslo těsně nad odmocninou.',
    root(target),level===1?n:m,'V tabulce porovnej '+n*n+' a '+m*m+'. Číslo '+target+' leží mezi nimi.');
 }
 const p=1+choice;
 const bigger=(n+p)**2, smaller=n*n;
 if(level===0) return task('Vyhledej obě druhé mocniny a vypočítej rozdíl.',square(n+p)+' − '+square(n),bigger-smaller,
   'V tabulce najdeš '+bigger+' a '+smaller+'. Odečti menší hodnotu od větší.');
 if(level===1) return task('Vyhledej druhou mocninu a odmocninu a sečti jejich hodnoty.',square(n+p)+' + '+root(smaller),bigger+n,
   'Vyhledej druhou mocninu '+bigger+'. Z čísla '+smaller+' tabulka dá odmocninu '+n+'.');
 return task('Vyhledej druhé mocniny a vypočítej polovinu jejich součtu.',
   '('+square(n+p)+' + '+square(n)+')/2',(bigger+smaller)/2,'Sečti '+bigger+' a '+smaller+' a vyděl výsledek dvěma.');

}

function calculator(topic,level,i) {
 const a=12.3+i/100, b=2+(i%9)/10, p=2+level%2, digits=2+level;
 const joined=topic===6;
 const value=topic===0?a**p:joined?(a**p+Math.sqrt(a+b))/b:level===1?Math.cbrt(a):Math.sqrt(a);
 const power='('+cz(a.toFixed(2))+')^'+p;
 const radical=(level===1?'∛':'√')+'('+cz(a.toFixed(2))+')';
 const expr=topic===0?power:joined?'('+power+' + '+root(cz((a+b).toFixed(2)))+')/'+cz(b):radical;
 return task('Vypočítej na kalkulačce a zaokrouhli na '+digits+' desetinná místa.',expr,value.toFixed(digits),
    (joined?'Nejprve vypočítej oba členy v závorce, sečti je a vyděl. ':topic===0?'Zadej základ v závorce a umocni jej. ':'Použij funkci '+(level===1?'třetí':'druhé')+' odmocniny. ')+'Konečný výsledek je '+cz(value.toFixed(digits))+'.');
}

export function practiceBank(mode,topic,level) {
 if(!modes[mode]?.[2].includes(topic)) return [];
 if(mode==='mental' && !mentalTopics.has(topic)) return bank(topic,level);
 const generate={mental,tables,calculator}[mode];
 const entries=Array.from({length:mode==='mental'?486:255},(_,i)=>generate(topic,level,i));
 if(mode==='mental' && topic===1 && level===0) {
   for(let i=0;i<5;i++) entries.push(makeTask(1,0,i*5));
 }
 if(mode==='mental' && topic===0 && level===0) {
   for(let n=2;n<=10;n++) for(const p of [2,3]) {
     const expr='(−'+n+')^'+p;
     entries.push(task('Urči základ mocniny.',expr,-n,'Základ je číslo v závorce včetně znaménka.'));
     entries.push(task('Urči exponent.',expr,p,'Exponent je malé číslo vpravo nahoře.'));
   }
 }
 return [...new Map(entries.map(entry=>[entry.prompt+' '+entry.expr,entry])).values()];
}
