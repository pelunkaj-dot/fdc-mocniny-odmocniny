import assert from 'node:assert/strict';
import {bank} from '../tasks.mjs';
import {grade} from '../answers.mjs';
import {math} from '../render.mjs';

let total=0;
for(let topic=0;topic<8;topic++) {
 for(let level=0;level<3;level++) {
   const tasks=bank(topic,level);
   assert.ok(tasks.length>=200, `${topic}/${level} has ${tasks.length}`);
   for(const task of tasks) {
     assert.equal(grade(task,task.answer),'correct',JSON.stringify(task));
     assert.equal(grade(task,'??'),task.form==='choice'?'wrong':'invalid');
     assert.ok(math(task.expr).startsWith('<math'));
   }
   total+=tasks.length;
 }
}

const cases=[
 ['number','1/8','0,125','correct'],
 ['number','-9','−9','correct'],
 ['number','1','1/0','invalid'],
 ['number','1','1/1+1','wrong'],
 ['fraction','1/-8','-2/16','correct'],
 ['fraction','1/8','0,125','form'],
 ['scientific','4,2 × 10^(-3)','0,0042','form'],
 ['scientific','4,2 × 10^(-3)','42 × 10^(-4)','form'],
 ['scientific','4,2 × 10^(-3)','4.2e-3','correct'],
 ['radical','6√(2)','sqrt(72)','form'],
 ['radical','6√(2)','6*sqrt(2)','correct'],
 ['radical','6√(2)','-sqrt(72)','wrong'],
 ['power','x^2 · y^3','y³ × x²','correct'],
 ['power','x^5','x^2 · x^3','form'],
 ['monomial','-1x^2','-x²','correct'],
 ['choice','neexistuje','existuje','wrong']
];
for(const [form,answer,input,result] of cases) assert.equal(grade({form,answer},input),result);
assert.match(math('∛(-8)'),/<mroot>/);
assert.match(math('(2/3)^(2)'),/<msup>.*<mfrac>/);
console.log(total+' unikátních úloh v 24 bankách, '+cases.length+' kontrol odpovědí');

const {modes,practiceBank}=await import('../practice.mjs');
let modeTotal=0;
for(const [mode,[,,list]] of Object.entries(modes)) {
 for(const topic of list) for(let level=0;level<3;level++) {
   const tasks=practiceBank(mode,topic,level);
   assert.ok(tasks.length>=200,`${mode}/${topic}/${level}: ${tasks.length}`);
   for(const t of tasks) assert.equal(grade(t,t.answer),'correct',JSON.stringify(t));
   modeTotal+=tasks.length;
 }
}
assert.ok(practiceBank('tables',1,1).every(t=>t.expr.startsWith('√(')&&t.prompt.includes('těsně pod')));
assert.ok(practiceBank('calculator',0,1).every(t=>t.prompt.includes('3 desetinná místa')));
assert.deepEqual(practiceBank('tables',2,0),[]);
console.log(modeTotal+' úloh v bankách rozdělených podle pomůcky');

const {award,coachHint,milestones}=await import('../coach.mjs');
assert.equal(award(3,'correct',1,false),5);
assert.equal(award(3,'correct',1,true),4);
assert.equal(award(3,'correct',2,false),4);
assert.equal(award(3,'wrong',2,false),3);
assert.equal(milestones.at(-1)[1],32);
assert.match(coachHint('tables',1,{}),/nejbližší menší a větší/);
for(const t of practiceBank('mental',0,0)) {
 const cube=t.expr.match(/^([0-9]+)\^3/);
 if(cube) assert.ok(Number(cube[1])<=5);
}


for(const [form,answer,input,expected] of [
 ['number','27','3·3·3','step'],
 ['number','25','(2+3)^2 = 5^2 = 25','correct'],
 ['number','25','(2+3)^2 = 4^2 = 25','wrong'],
 ['number','-9','-3²','step'],
 ['number','-9','(-3)²','wrong'],
 ['number','-2','∛(-8)','step'],
 ['number','0,125','2⁻³','step'],
 ['number','0,125','(1/2)^3','step'],
 ['number','2','√(-4)','invalid'],
 ['number','2','√(4','invalid'],
 ['number','12','1 2','invalid'],
 ['number','1','x/x','wrong'],
 ['power','x^6','(x²)^3','step'],
 ['power','x^6','x² · x^4','form'],
 ['monomial','5x²','9x² − 4x²','step'],
 ['radical','6√(2)','√(36 · 2)','step'],
 ['radical','6√(2)','√72 = √36 · √2 = 6√2','correct'],
 ['scientific','4,2 × 10^(-3)','(42/10) × 10^(-3)','step'],
 ]) assert.equal(grade({form,answer},input),expected,input);
assert.equal(grade({form:'number',answer:'3,51',expr:'√(12,34)',prompt:'Vypočítej na kalkulačce a zaokrouhli.'},'√(12,34)'),'step');
assert.equal(grade({form:'monomial',answer:'x²',expr:'2x² − x²'},'x³/x'),'wrong');
assert.equal(grade({form:'power',answer:'x^2',expr:'x^4 : x^2'},'x^3/x'),'step');
assert.equal(grade({form:'number',answer:'0'},'0,1 + 0,2 − 0,3'),'step');

const {guide}=await import('../tutor.mjs');
assert.equal(guide('(-3x)^2 + 2x²').answer,'11x^2');
assert.equal(guide('√72').answer,'6√(2)');
assert.equal(guide('∛(-8) + 4').answer,'2');
assert.deepEqual(guide('x³/x').conditions,['x']);
assert.ok(practiceBank('algebra',3,0).some(t=>t.expr.includes('^0')&&t.condition));
assert.deepEqual(guide('(-2x)^0').conditions,['x']);
assert.equal(guide('(-3)^2 + 2^3').steps.length,3);
assert.throws(()=>guide('1/0'));
assert.throws(()=>guide('x + 2 = 3'));
const algebra={form:'algebra',expr:'(xy)^3',answer:'x^3y^3'};
assert.equal(grade(algebra,'y³x³'),'correct');
assert.equal(grade(algebra,'(xy)·(xy)·(xy)'),'step');
assert.equal(grade(algebra,'x³y³ + 1'),'wrong');
