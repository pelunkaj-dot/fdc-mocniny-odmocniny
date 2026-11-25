export const tableSize=100;
const columns=['n','n²','n³'];
const rows=Array.from({length:tableSize},(_,index)=>{
 const n=index+1;
 return [n,n*n,n*n*n];
});
const format=new Intl.NumberFormat('cs-CZ');

export function findTableRows(column,query) {
 let source=String(query).trim();
 if(/^\d{1,3}(?:[ \u00a0\u202f]\d{3})+(?:[.,]\d+)?$/.test(source)) source=source.replace(/\s/g,'');
 if(![0,1,2].includes(column)||!/^\+?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(source)) return {kind:'invalid',rows:[]};
 const value=Number(source.replace(',','.'));
 if(!Number.isFinite(value)) return {kind:'invalid',rows:[]};
 const index=rows.findIndex(row=>row[column]>=value);
 if(index===-1) return {kind:'above',rows:[tableSize]};
 if(rows[index][column]===value) return {kind:'exact',rows:[index+1]};
 if(index===0) return {kind:'below',rows:[1]};
 return {kind:'between',rows:[index,index+1]};
}

export function createPowerTable() {
 const panel=document.createElement('details');
 panel.className='power-table';
 panel.innerHTML='<summary>Tabulka mocnin a odmocnin</summary>'+
  '<div class="power-table-content"><p class="muted">Pro mocninu hledej základ ve sloupci <i>n</i>. Při odmocňování začni ve sloupci <i>n</i>² nebo <i>n</i>³ a základ přečti ze stejného řádku.</p>'+
  '<details class="table-search"><summary>Najít v tabulce</summary>'+
  '<form><div class="table-fields"><label for="table-column">Sloupec'+
  '<select id="table-column" required><option value="">Vyber sloupec</option>'+
  '<option value="0">n · základ</option><option value="1">n² · druhá mocnina</option><option value="2">n³ · třetí mocnina</option>'+
  '</select></label><label for="table-value">Hledaná hodnota<input id="table-value" inputmode="decimal" maxlength="24" required></label></div>'+
  '<div class="row"><button class="primary" type="submit">Najít</button><button type="button" data-clear hidden>Zrušit zvýraznění</button></div>'+
  '<p class="table-status" role="status"></p></form></details>'+
  '<div class="table-scroll" tabindex="0" role="region" aria-label="Řádky 1 až 100">'+
  '<table><caption>Základy od 1 do '+tableSize+'</caption><thead><tr>'+
  columns.map((column,index)=>'<th scope="col" data-column="'+index+'"><i>n</i>'+column.slice(1)+'</th>').join('')+
  '</tr></thead><tbody>'+rows.map(([n,square,cube])=>
    '<tr><th scope="row"><span class="table-marker" aria-hidden="true">▸</span>'+n+'</th>'+
    '<td>'+format.format(square)+'</td><td>'+format.format(cube)+'</td></tr>').join('')+'</tbody></table></div></div>';

 const form=panel.querySelector('form');
 const scroll=panel.querySelector('.table-scroll');
 const body=panel.querySelector('tbody');
 const status=panel.querySelector('.table-status');
 const clear=panel.querySelector('[data-clear]');
 let marked=[];
 function clearMarks() {
   for(const row of marked) row.classList.remove('table-match');
   marked=[];
   clear.hidden=true;
 }
 clear.onclick=()=>{
   clearMarks();
   status.textContent='Zvýraznění zrušeno.';
 };
 form.onsubmit=event=>{
   event.preventDefault();
   clearMarks();
   const selected=panel.querySelector('#table-column').value;
   const column=selected===''?-1:Number(selected);
   const result=findTableRows(column,panel.querySelector('#table-value').value);
   if(result.kind==='invalid') {
     status.textContent='Zadej nezáporné číslo. Desetinnou část můžeš oddělit čárkou.';
     return;
   }
   marked=result.rows.map(n=>body.rows[n-1]);
   for(const row of marked) row.classList.add('table-match');
   clear.hidden=false;
   const labels={
     exact:'V tomto sloupci je zvýrazněný jeden přesný výskyt.',
     between:'Hodnota leží mezi dvěma zvýrazněnými řádky.',
     below:'Hodnota je menší než první údaj ve sloupci.',
     above:'Hodnota je větší než poslední údaj ve sloupci.'
   };
   status.textContent=labels[result.kind];
   const first=marked[0].getBoundingClientRect();
   const viewport=scroll.getBoundingClientRect();
   const headerHeight=panel.querySelector('thead').getBoundingClientRect().height;
   scroll.scrollTop+=first.top-viewport.top-headerHeight-8;
 };
 return panel;
}
