# FajnCvičebna · Mocniny a odmocniny

Statická česká cvičebna pro 8. a 9. ročník a opakování na střední škole.
Zahrnuje druhé a třetí mocniny a odmocniny, pravidla pro mocniny, nulové
a záporné exponenty, úpravy odmocnin, vědecký zápis, kombinované výpočty
a práci s typickými chybami.

## Spuštění a testy

Spusť `python3 -m http.server 8765` v kořeni projektu a otevři
`http://localhost:8765/mocniny-demo.html`. Demo nabídne 18 dokončených úloh
na prohlížeč v šesti základních cvičebnách. Statistiky používají localStorage.
Nedokončená úloha se do statistik nepočítá.

- `node tests/math.mjs` kontroluje banky a vyhodnocování odpovědí.
- `node tests/browser.cjs` používá Playwright a lokální HTTP server na portu
  8765. Cestu k binárce lze nastavit přes `CHROMIUM`. URL lze přepsat pomocí
  `FDC_TEST_URL`. Test simuluje přechod z FajnDoučko pomocí lokálně
  zachycené navigace a ověřuje i přímý přístup bez refereru.

## Integrace

GitHub Pages má servírovat kořen repozitáře. Demo je v souboru
`mocniny-demo.html` a plná verze v `mocniny.html`. Pro předplatitele vede na
plnou verzi odkaz z členské stránky FajnDoučko, který při navigaci umožní
předání původu v HTTP Referer. Přímé otevření s novou relací přesměruje
do dema. V téže relaci existující ochrana sdílí klíč `fdc-guard-ok`
s ostatními aplikacemi na původu GitHub Pages.

Převzatý `fdc-guard.js` z fdc-plugin řídí vstup v prohlížeči. Ověřuje
původ návštěvy, nikoli předplatné jednotlivce. Soubory na veřejném GitHub
Pages jsou veřejně dostupné. Pro ověření předplatného přímo u cvičebny
by byl nutný neveřejný distribuční kanál nebo serverové ověření v
existujícím členském systému.

## Kód

- `tasks.mjs` obsahuje šablony, výsledky a banky pro tři úrovně v každém okruhu.
- `answers.mjs` ověřuje číselné hodnoty a požadované tvary. Algebraické
  odpovědi používají předepsaný tvar mocnin nebo jednočlenu. Vstup se
  nevyhodnocuje jako JavaScript.
- `render.mjs` vykresluje matematické zadání z interních šablon pomocí MathML.
- `app.mjs` ovládá výběr úloh, pokusy, statistiky a zvuk.
- `style.css` navazuje na paletu výukového celku Výrazy.

Aplikace nemá běhové externí závislosti. Zvuk tvoří tři tóny Web Audio.
