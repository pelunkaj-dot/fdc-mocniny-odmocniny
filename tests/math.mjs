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
     assert.equal(grade(task,'??'),'wrong');
     assert.ok(math(task.expr).startsWith('<math'));
   }
   total+=tasks.length;
 }
}

const cases=[
 ['number','1/8','0,125','correct'],
 ['number','-9','−9','correct'],
 ['number','1','1/0','wrong'],
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
