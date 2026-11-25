export function algebraBank(topic,level) {
 return Array.from({length:240},(_,i)=>{
   const first=2+i%10, second=2+Math.floor(i/10)%12, variable=i<120?'x':'y';
   const other=variable==='x'?'y':'x';
   const coefficient=1+i%10, exponent=2+level%2;
   const term=(variable,n)=>n===0?'':variable+(n===1?'':'^'+n);
   switch(topic) {
   case 0: {
     const sign=level===0?1:-1;
     return {
       prompt:'Umocni celý jednočlen.',expr:'('+sign*coefficient+term(variable,second)+')^'+exponent,
       answer:(sign*coefficient)**exponent+term(variable,second*exponent),form:'algebra',
       why:'Umocni koeficient i mocninu proměnné. U mocniny mocniny exponenty vynásob.'
     };
   }
   case 2: {
     const expr=level===0?term(variable,first)+' · '+term(variable,second):
       level===1?term(variable,first+second)+' : '+term(variable,second):
         '('+term(variable,first)+' · '+term(other,second)+')^2';
     return {
       prompt:'Uprav na jednu mocninu nebo součin mocnin.',expr,
       answer:level===0?term(variable,first+second):level===1?term(variable,first):
         term(variable,first*2)+term(other,second*2),
       condition:level===1?variable+' ≠ 0':'',form:'algebra',
       why:level===0?'Mocniny mají stejný základ. Sečti jejich exponenty.':
         level===1?'Při dělení mocnin stejného základu exponenty odečti.':
           'Umocni každý činitel součinu zvlášť.'
     };
   }
   case 3: {
     if(first%3===0) return {
       prompt:'Zjednoduš výraz s nulovým exponentem.',
       expr:'('+term(variable,first)+')^0 · '+term(other,second)+(level===0?'':' · '+term(other,level)),
       answer:term(other,second+level),form:'algebra',condition:variable+' ≠ 0',
       why:'Nultá mocnina nenulového základu je 1. Zbývající mocniny stejné proměnné můžeš spojit.'
     };
     const exp=level===0?first:level===1?second:first+second;
     return {
       prompt:'Zapiš jako zlomek s kladnými exponenty.',
       expr:level===0?term(other,second)+' · '+variable+'^(-'+exp+')':
         level===1?variable+'^(-'+exp+') · '+term(other,first):'('+term(other,first)+'/'+term(variable,second)+') · '+variable+'^(-'+first+')',
       answer:term(other,level===0?second:first)+'/'+term(variable,exp),form:'algebra',
       condition:variable+' ≠ 0',why:'Přepiš záporný exponent jako převrácenou mocninu. Stejné základy ve jmenovateli spoj.'
     };
   }
   default: {
     const degree=2+level, sign=level===1?-1:1;
     const value=coefficient+sign*second;
     return {
       prompt:'Spoj členy se stejnou mocninou.',
       expr:coefficient+term(variable,degree)+(sign<0?' − ':' + ')+second+term(variable,degree),
       answer:value===0?'0':value+term(variable,degree),form:'algebra',
       why:'Sečti nebo odečti koeficienty. Mocnina proměnné se nemění.'
     };
   }
   }
 });
}
