import {notation} from './answers.mjs?v=5';
import {readExpression} from './expression.mjs?v=8';

const ruleHints=[
 'Podívej se, co patří do základu. Druhá mocnina jsou dva stejné činitele, třetí mocnina tři.',
 'Přečti značku odmocniny. Hledej číslo, které by po umocnění dalo hodnotu pod odmocninou.',
 'Urči nejdřív operaci mezi mocninami. U stejného základu při násobení exponenty sčítáš, při dělení odečítáš.',
 'Začni exponentem. Nultá mocnina nenulového základu má hodnotu 1. U záporného exponentu převrať základ.',
 'Hledej pod odmocninou dělitele, který je úplným čtvercem. Třeba 12 lze rozložit na 4 · 3.',
 'Sleduj znaménko exponentu u desítky. Kladný posouvá čárku doprava, záporný doleva.',
 'Najdi závorky a vyznač mocniny a odmocniny. Sčítání a odčítání nech až za těmito operacemi.',
 'Zkontroluj, co je uvnitř závorky a zda je exponent sudý nebo lichý. Pak porovnej obě strany rovnosti.'
];

export function coachHint(mode,topic,task) {
 if(task.estimatedRoot===2) return 'Najdi v tabulce dvě sousední druhé mocniny, mezi kterými je zadané číslo. Porovnej, ke které z nich má blíž.';
 if(task.estimatedRoot===3) return 'Najdi dva sousední celé základy. Když není zřejmé, ke kterému je odmocnina blíž, umocni jejich střed na třetí a porovnej ho s číslem pod odmocninou.';
 if(mode==='tables') {
   const column=task.expr?.includes('∛')||/\^3/.test(task.expr??'')?'třetích':'druhých';
   return topic===1
     ? 'Číslo pod odmocninou hledej ve sloupci '+column+' mocnin. Pokud tam přesně není, najdi nejbližší menší a větší hodnotu.'
     : 'V tabulce vyhledej řádek podle základu mocniny. Použij sloupec '+column+' mocnin a nalezenou hodnotu dosaď do výrazu.';
 }
 if(mode==='calculator') return 'Zadej čísla i závorky přesně podle zadání. Pokud počítáš po částech, ponech na displeji všechny číslice a zaokrouhli až na konci.';
 if(task.prompt.startsWith('Existuje')) return 'Výsledek druhé mocniny reálného čísla je vždy nezáporný. Podívej se na znaménko pod odmocninou.';
 if(task.prompt.includes('nesmí mít')) return 'Přemýšlej, kdy se celý výraz v základu rovná nule. V záporné mocnině by pak byla nula ve jmenovateli.';
 if(task.prompt.includes('koeficient')) return 'Člen s proměnnou vznikne dvakrát: první člen z první závorky krát druhý z druhé, a potom obráceně.';
 if(task.prompt.startsWith('Urči exponent')) return 'Hledej malé číslo napsané vpravo nahoře, mimo závorku kolem základu.';
 if(topic===2 && /\)\^/.test(task.expr)) return 'U mocniny mocniny exponenty vynásob. U součinu a podílu umocni jednotlivé činitele nebo oba členy zlomku.';
 if(topic===5 && task.prompt.includes('vědeckém')) return 'Přesuň čárku za první nenulovou číslici. Počet posunů určuje exponent desítky. Je-li ve výrazu více mocnin deseti, nejprve je spoj.';
 return ruleHints[topic];
}

export const milestones=[['Start',0],['První výstup',5],['Mezistanice',12],['Rozhledna',21],['Vrchol',32]];

export function award(points,result,attempts,assisted) {
 if(result!=='correct') return points;
 return points+(assisted||attempts>1?1:2);
}


const formHints={
 power:'Spoj mocniny se stejným základem a uprav exponenty.',
 fraction:'Přepiš výsledek jako zlomek ve tvaru a/b.',
 scientific:'Zapiš výsledek jako číslo od 1 do 10 (bez 10) krát mocnina deseti.',
 radical:'Vytkni z odmocniny úplný čtverec a spoj členy se stejnou odmocninou.',
 root:'Zapiš výsledek jako jednu odmocninu.',
 monomial:'Spoj podobné členy a výsledek zapiš jako jeden člen.',
 algebra:'Spoj stejné mocniny a uprav zápis do tvaru požadovaného v zadání.'
};

export function continuationHint(task,answer,result) {
 const source=notation(answer).split('=').at(-1);
 if(task.prompt?.includes('zaokrouhli') && result==='step') {
   return 'Dopočítej výraz a zaokrouhli až konečný výsledek na počet míst uvedený v zadání.';
 }
 if(result==='form' || /[xy]/.test(source)) {
   return formHints[task.form]??'Uprav výraz do tvaru požadovaného v zadání.';
 }
 let hint;
 try {
   readExpression(source,(kind,expression,_value,operator)=>{
     if(hint) return;
     if(kind==='division' && /^\d+\/\d+$/.test(expression) && expression!==source.trim()) return;
     const pair=expression.match(/^(\d+(?:\.\d+)?)([+\-])(\d+(?:\.\d+)?)$/);
     if(kind==='sum'&&pair) {
       const [,left,sign,right]=pair;
       const a=left.replace('.',','), b=right.replace('.',',');
       hint=sign==='+'?'Sečti '+a+' a '+b+'.':'Od '+a+' odečti '+b+'.';
       return;
     }
     const operation={
       sum:operator==='-'?'Vypočítej rozdíl':'Vypočítej součet',
       product:'Vypočítej součin',division:'Vypočítej podíl',
       power:'Vypočítej mocninu',root:'Uprav odmocninu',cubeRoot:'Vypočítej třetí odmocninu'
     }[kind];
     if(!operation) return;
     const part=expression.replace(/\*/g,' · ').replace(/\+/g,' + ')
       .replace(/-/g,' − ').replace(/\./g,',').trim();
     hint=operation+' '+part+'.';
   });
 } catch {}
 return hint??formHints[task.form]??'Dopočítej rozepsaný výraz.';
}
