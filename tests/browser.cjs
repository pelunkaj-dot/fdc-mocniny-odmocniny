const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.FDC_TEST_URL||'http://127.0.0.1:8765';
const approved='https://www.fajndoucko.cz/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
 try {
   const page=await browser.newPage({viewport:{width:375,height:812}});
   const errors=[];
   page.on('pageerror',error=>errors.push(String(error)));
   await page.goto(base+'/mocniny.html');
   await page.waitForURL('**/mocniny-demo.html');
   assert.equal(await page.getByRole('link',{name:'Vybrat cvičebnu'}).count(),3);
   await page.goto(base+'/mocniny-demo.html#tables/2/1');
   const table=page.locator('#table-inline .power-table');
   assert.equal(await table.locator('table').isVisible(),false);
   const draft=page.getByRole('textbox',{name:'Odpověď'});
   await draft.fill('123');
   await table.locator(':scope > summary').click();
   assert.equal(await table.locator('tbody tr').count(),100);
   await table.getByText('Najít v tabulce',{exact:true}).click();
   const column=table.getByLabel('Sloupec');
   assert.equal(await column.inputValue(),'');
   await column.selectOption('2');
   await table.getByLabel('Hledaná hodnota').fill('258');
   await table.getByRole('button',{name:'Najít',exact:true}).click();
   assert.deepEqual(await table.locator('tr.table-match th').allTextContents(),['▸6','▸7']);
   assert.equal(await draft.inputValue(),'123');
   await page.setViewportSize({width:1280,height:900});
   await page.locator('#table-desktop .power-table table').waitFor();
   assert.equal(await page.locator('#table-desktop .table-match').count(),2);
   await page.setViewportSize({width:375,height:812});
   await page.goto(base+'/mocniny-demo.html#1/3');
   await page.getByRole('heading',{name:'Zpaměti / bez pomůcek',exact:true}).waitFor();
   await page.getByRole('link',{name:'Procvičovat'}).first().click();
   assert.equal(await page.locator('select option').count(),1);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.getByRole('textbox',{name:'Odpověď'}).fill('999999');
   await page.getByRole('button',{name:'Zkontrolovat'}).click();
   await page.getByText('Zkus to ještě jednou.').waitFor();
   assert.equal(await page.locator('#solution').isVisible(),false);
   await page.getByRole('button',{name:'Zkontrolovat'}).click();
   await page.locator('#solution').waitFor();
   await page.getByText('Se zobrazeným řešením').waitFor();
   assert.equal(await page.locator('dt').filter({hasText:'Se zobrazeným řešením'}).locator('xpath=following-sibling::dd[1]').textContent(),'1');
   for(let i=1;i<18;i++) {
     await page.getByRole('button',{name:'Další úloha'}).click();
     await page.getByRole('textbox',{name:'Odpověď'}).fill('999999');
     await page.getByRole('button',{name:'Zkontrolovat'}).click();
     await page.getByRole('button',{name:'Zkontrolovat'}).click();
   }
   await page.getByRole('button',{name:'Další úloha'}).click();
   await page.getByRole('heading',{name:'Demo je dokončeno'}).waitFor();
   await page.reload();
   await page.getByRole('heading',{name:'Demo je dokončeno'}).waitFor();
   assert.equal(errors.length,0,errors.join('\n'));
   await page.close();

   const full=await browser.newPage({viewport:{width:1280,height:900}});
   await full.route(approved,route=>route.fulfill({
     contentType:'text/html',
     body:'<a href="'+base+'/mocniny.html">Otevřít</a>'
   }));
   await full.goto(approved);
   await full.getByRole('link',{name:'Otevřít'}).click();
   await full.getByRole('heading',{name:'Jak chceš počítat?'}).waitFor();
   await full.getByRole('link',{name:'Vybrat cvičebnu'}).first().click();
   assert.equal(await full.getByRole('link',{name:'Procvičovat'}).count(),8);
   await full.goto(base+'/mocniny.html#mental/7/1');
   assert.equal(await full.locator('select option').count(),3);
   const expr=await full.locator('.expression math').getAttribute('aria-label');
   const [,a,b,c]=expr.match(/\((\d+) \+ (\d+)\)\^\(2\) − √\((\d+)\)/);
   const answer=full.locator('#answer');
   await answer.fill((Number(a)+Number(b))+'^2 − '+Math.sqrt(Number(c)));
   await full.getByRole('button',{name:'Zkontrolovat'}).click();
   await full.getByText('Správný mezikrok',{exact:true}).waitFor();
   assert.match(await full.locator('#step-direction').textContent(),/Vypočítej mocninu/);
   assert.equal(await answer.inputValue(),'');
   assert.equal(await full.getByRole('textbox',{name:'Další mezikrok nebo výsledek'}).count(),1);
   assert.equal(await full.locator('#steps li').count(),1);
   assert.equal(await full.locator('#solution').isVisible(),false);
   await answer.fill(String((Number(a)+Number(b))**2-Math.sqrt(Number(c))));
   await full.getByRole('button',{name:'Zkontrolovat'}).click();
   await full.getByText('Správně!').waitFor();
   await full.locator('select').selectOption('2');
   await full.waitForURL('**/mocniny.html#mental/7/3');
   assert.ok(await full.locator('.expression math').count());
   assert.ok(await full.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   console.log('Chromium: demo, 18 úloh, druhý pokus, řešení, statistiky, guard, plná verze, navigace, 375 a 1280 px');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
