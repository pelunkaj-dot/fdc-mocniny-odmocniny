export const topics = [
 ['Druhá a třetí mocnina','Exponent říká, kolikrát použiješ základ jako činitel. Závorky určují, zda je součástí základu i znaménko.','(-3)^2 = 9; -3^2 = -9'],
 ['Druhá a třetí odmocnina','Druhá odmocnina je nezáporná a v reálných číslech vyžaduje nezáporný vstup. Třetí odmocnina zachovává znaménko.','√(49) = 7; ∛(-27) = -3'],
 ['Pravidla pro mocniny','Při násobení mocnin stejného základu exponenty sečti. Při dělení je odečti a při umocnění mocniny vynásob.','x^2 · x^3 = x^5; (x · y)^2 = x^2 · y^2'],
 ['Nulový a záporný exponent','Pro každý nenulový základ platí, že nultá mocnina je 1. Záporný exponent znamená převrácení odpovídající kladné mocniny.','5^0 = 1; 2^(-3) = 1/8'],
 ['Počítání s odmocninami','Z odmocniny vytkni úplný čtverec. Po úpravě můžeš sečíst koeficienty u odmocnin se stejným číslem pod odmocninou.','√(72) = 6√(2); 3√(2) + 4√(2) = 7√(2)'],
 ['Mocniny čísla deset','Ve vědeckém zápisu má kladné číslo koeficient od 1 včetně do 10 bez 10. Exponent určuje posun desetinné čárky.','0,0042 = 4,2 × 10^(-3)'],
 ['Kombinované výpočty','Začni závorkami, pak počítej mocniny a odmocniny, potom násobení a dělení, nakonec sčítání a odčítání.','(2 + 3)^2 - √(9) = 25 - 3 = 22'],
 ['Typické chyby','Než použiješ pravidlo, zkontroluj operaci, znaménko a podmínky. Druhá mocnina součtu obsahuje i smíšený člen.','(x + 3)^2 = x^2 + 6x + 9'],
];
const cz = n => String(n).replace('.', ',');
const pow = (a,b) => a+'^('+b+')';
const root = (a,p=2) => (p===2?'√':'∛')+'('+a+')';
const absBase = b => b < 0 ? '('+b+')' : b;
export const LIMIT = 18;

export function makeTask(topic, level, id) {
 const k = 2 + id % 15;
 const j = 2 + Math.floor(id / 15);
 const v = id % 5;
 const p = 2 + id % 2;
 const x = level === 0 ? String(j) : 'x';
 const defined = 'V reálných číslech neexistuje.';
 const none = {answer:'neexistuje', why:defined, choices:['existuje','neexistuje']};
 const ask = (prompt, expr, answer, why, form='number', extra={}) =>
   ({prompt, expr, answer:cz(answer), why, form, ...extra});
 const compute = (expr, answer, why) => ask('Vypočítej.',expr,answer,why);
 const simplify = (expr, answer, why, form) => ask('Uprav na požadovaný tvar.',expr,answer,why,form);
 switch (topic) {
 case 0: {
   if (level===0 && v===0) return ask('Urči základ mocniny.',pow(k*j,p),k*j,'Základ je číslo, které umocňujeme.', 'number');
   if (level===0 && v===1) return ask('Urči exponent.',pow(k*j,p),p,'Exponent je číslo napsané vpravo nahoře.');
   const n = (k+15*(j-2))*(v%2 ? -1:1);
   if(level===0) return compute(pow(absBase(n),p),n**p,'Vynásob základ '+p+'krát.');
   if(level===1 && v<3) return compute((v===0?'−'+pow(Math.abs(n),p):pow('('+cz(n/10)+')',p)),v===0 ? -(n**p) : cz(Number((n/10)**p).toFixed(p)),v===0?'Mocninu vypočti před vnějším mínusem.':'Umocni celé desetinné číslo v závorce.');
   return compute(pow('('+n+'/'+(j+1)+')',p),(n**p)+'/'+((j+1)**p),'Umocni zvlášť čitatele a jmenovatele.');
 }
 case 1: {
   const n = k+15*(j-2);
   if(level===0 && v===0) return ask('Existuje odmocnina v reálných číslech?',root(-n),none.answer,none.why,'choice',none);
   if(level===2 && v<2) {
     const r = n*n+k;
     return ask('Zadej celé číslo těsně pod odmocninou.',root(r),n,n+'² < '+r+' < '+(n+1)+'².');
   }
   let sign = p===3 && v%2 ? -1:1;
   if(level===0) return compute(root(sign*n**p,p),sign*n,'Hledej číslo, jehož '+p+'. mocnina je číslo pod odmocninou.');
   if(level===1) return compute(root(cz((sign*n**p/10**p).toFixed(p)),p),cz(sign*n/10),'Zkontroluj výsledek zpětným umocněním.');
   return compute(root(sign*n**p+'/'+(j+1)**p,p),sign*n+'/'+(j+1),'Odmocni čitatele a jmenovatele.');
 }
 case 2: {
   const m = k+2, n=j+2, y=level===0?String(k):'y';
   const variants=[
    [pow(x,m)+' · '+pow(x,n),pow(x,m+n),'Exponenty sečti.'],
    [pow(x,m+n)+' : '+pow(x,n),pow(x,m),'Exponenty odečti, základ musí být nenulový.'],
    [pow('('+pow(x,m)+')',n),pow(x,m*n),'Exponenty vynásob.'],
    [pow('('+x+' · '+y+')',m),pow(x,m)+' · '+pow(y,m),'Umocni každého činitele.'],
    [pow('('+x+'/'+y+')',n),pow(x,n)+'/'+pow(y,n),'Umocni čitatel i jmenovatel, jmenovatel musí být nenulový.']
   ];
   const which = level===0 ? v%3 : level===1 ? (v+j)%5 : v;
   const [expr,ans,why]=variants[which];
   if(level===2) return simplify('('+expr+') · '+pow(x,j),which<3?pow(x,[m+n,m,m*n][which]+j):which===3 ? pow(x,m+j)+' · '+pow(y,m) : pow(x,n+j)+'/'+pow(y,n),why+' Pak připočti exponent další mocniny x.','power');
   return simplify(expr,ans,why,'power');
 }
 case 3: {
   const n = k+15*(j-2);
   if(level===0 && v===0) return compute(pow(n,0),1,'Nenulový základ na nultou je 1.');
   const b = level===0?n:level===1?-n:(n+'/'+(j+1));
   const e = level===0?1:p;
   if(level===2 && v===0) return ask('Kterou hodnotu nesmí mít x?',pow('(x - '+n+')',-e),n,'Základ x − '+n+' nesmí být nula.');
   return simplify(pow('('+b+')',-e),(level===2?(j+1)**e:1)+'/'+((level===1?-n:n)**e),'Převrať základ a použij kladný exponent.','fraction');
 }
 case 4: {
   const primes=[2,3,5,7,11,13,17,19,23,29,31,37,41,43,47];
   const r=primes[k-2], s=primes[(k-1)%15];
   if(level===0 && v===0) return simplify(root(r)+' · '+root(s*j*j),j+root(r*s),'Vynásob čísla pod odmocninou a vytkni '+j+'².','radical');
   if(level===0) return simplify(root(j*j*r),j+root(r),'Rozlož číslo pod odmocninou na '+j+'² · '+r+'.','radical');
   if(level===1 && v===0) return compute(root((j*k)**2*r)+' : '+root(r),j*k,'Vyděl čísla pod odmocninou a odmocni podíl.');
   const a=level===1?2:k;
   return simplify(root(j*j*r)+(v%2?' − ':' + ')+a+root(r),(j+(v%2?-a:a))===0?'0':(j+(v%2?-a:a))+root(r),'První odmocninu uprav na '+j+root(r)+' a pak spoj koeficienty.','radical');
 }
 case 5: {
   const m = (100+id)/100, e=(v%2?-1:1)*(2+j%5);
   const sci = (a,b) => cz(a)+' × '+pow(10,b);
   if(level===0) return compute(sci(m,e),cz(Number((m*10**e).toPrecision(9))),'Posuň čárku o '+Math.abs(e)+' míst '+(e>0?'doprava.':'doleva.'));
   if(level===1) return simplify(cz(Number((m*10**e).toPrecision(9))),sci(m,e),'Přesuň čárku tak, aby před ní zůstala jedna nenulová číslice.','scientific');
   const divide=v%2===0;
   const coefficient=divide?m:m*2, exponent=divide?e-j:e+j;
   return simplify('('+sci(m,e)+') '+(divide?' : ':' · ')+' ('+sci(divide?1:2,j)+')',sci(Number(coefficient.toFixed(2)),exponent),divide?'Vyděl koeficienty a odečti exponenty.':'Vynásob koeficienty a sečti exponenty.','scientific');
 }
 case 6:
   if(level===0) return compute(pow('('+k+' + '+j+')',2)+' − '+root(k*k),(k+j)**2-k,'Nejprve sečti v závorce, pak umocni a odmocni. Nakonec odečti.');
   if(level===1) return compute('('+k+'/'+j+')^2 + '+root(k*k)+'/'+j,(k*k+k*j)+'/'+(j*j),'Umocni zlomek, odmocni a sečti přes společný jmenovatel.');
   return simplify(pow('('+k+'x)',2)+' − '+root(j*j)+'x^2',k*k===j?'0':(k*k-j)+'x^2','Umocni koeficient i proměnnou, odmocni a odečti koeficienty u x².','monomial');
 case 7:
   if(level===0) {
     const n=k+15*(j-2);
     const exponent=2+j%2;
     return ask('Je rovnost správná?',pow('(-'+n+')',exponent)+' = '+(v%2?n**exponent:-(n**exponent)), (v%2?1:-1)===(exponent===2?1:-1)?'ano':'ne','U záporného základu je druhá mocnina kladná a třetí záporná.','choice',{choices:['ano','ne']});
   }
   if(level===1) return ask('Oprav chybný výsledek.',root(k*k+j*j)+' = '+k+' + '+j,root(k*k+j*j),'Odmocninu součtu nelze rozdělit. Zapiš jako odmocninu jednoho čísla.','root');
   return ask('Oprav vynechaný koeficient u x.',pow('(x + '+(k+15*(j-2))+')',2)+' = x^2 + ?x + '+(k+15*(j-2))**2,2*(k+15*(j-2)),'Smíšený člen vznikne dvakrát jako součin x a druhého členu.');
 }
}

export function bank(topic, level) {
 const entries = Array.from({length:285}, (_,i)=>makeTask(topic,level,i));
 return [...new Map(entries.map(task=>[task.prompt+' '+task.expr,task])).values()];
}
