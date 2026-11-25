// A bounded parser for school notation. Values are sparse polynomials in x and y.
// Negative exponents represent monomial denominators on their domain.
const constant = n => new Map(n===0?[]:[['0,0',n]]);
function addTerm(terms,key,n) {
 const previous=terms.get(key)??0;
 const sum=previous+n;
 if(!Number.isFinite(sum) || Math.abs(sum)>1e100) throw Error();
 if(Math.abs(sum)<=Number.EPSILON*4*Math.max(Math.abs(previous),Math.abs(n))) terms.delete(key);
 else terms.set(key,sum);
 if(terms.size>80) throw Error();
}
function combine(a,b,operation) {
 const result=new Map();
 for(const [left,x] of a) for(const [right,y] of b) {
   const [i,j]=left.split(',').map(Number), [k,l]=right.split(',').map(Number);
   const key=(i+operation*k)+','+(j+operation*l);
   addTerm(result,key,operation===1?x*y:x/y);
 }
 return result;
}
function divide(a,b) {
 if(b.size!==1) throw Error();
 return combine(a,b,-1);
}
function scalar(value) {
 if(value.size===0) return 0;
 if(value.size!==1 || !value.has('0,0')) throw Error();
 return value.get('0,0');
}
function power(base,exponent) {
 const n=scalar(exponent);
 if(!Number.isInteger(n)||Math.abs(n)>512||(!base.size&&n<=0)) throw Error();
 if(n<0) base=divide(constant(1),base);
 let result=constant(1), left=Math.abs(n);
 while(left) {
   if(left%2) result=combine(result,base,1);
   left=Math.floor(left/2);
   if(left) base=combine(base,base,1);
 }
 return result;
}

export function readExpression(source, onStep) {
 const pattern=/\s+|(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?|sqrt|cbrt|[xy√∛()+*/^\-]/gy;
 const tokens=[];
 for(let cursor=0;cursor<source.length;) {
   pattern.lastIndex=cursor;
   const match=pattern.exec(source);
   if(!match) throw Error();
   cursor=pattern.lastIndex;
   if(match[0].trim()) tokens.push(match[0]);
 }
 let i=0;
 const nonzero=new Set();
 function requireNonzeroVariables(value) {
   const key=value.keys().next().value;
   if(!key) return;
   const [x,y]=key.split(',').map(Number);
   if(x!==0) nonzero.add('x');
   if(y!==0) nonzero.add('y');
 }
 const peek=()=>tokens[i];
 function record(kind,start,value,operator) {
   onStep?.(kind,tokens.slice(start,i).join(''),value,operator);
   return value;
 }
 const kind=token=>/^\d|^\.\d/.test(token||'')?'number':token;
 function need(token) {
   if(peek()!==token) throw Error();
   i++;
 }
 function atom() {
   const start=i, token=tokens[i++];
   if(token==='(') {const value=sum();need(')');return value;}
   if(kind(token)==='number') {
     const n=Number(token);
     if(!Number.isFinite(n)||Math.abs(n)>1e100||(/e/.test(token)&&n===0&&!/^0(?:\.0+)?e/.test(token))) throw Error();
     return constant(n);
   }
   if(token==='x'||token==='y') return new Map([[token==='x'?'1,0':'0,1',1]]);
   if(['√','∛','sqrt','cbrt'].includes(token)) {
     const value=scalar(atom());
     if(token==='∛'||token==='cbrt') return record('cubeRoot',start,constant(Math.cbrt(value)));
     if(value<0) throw Error();
     return record('root',start,constant(Math.sqrt(value)));
   }
   throw Error();
 }
 function unary() {
   const start=i, op=peek();
   if(op==='+'||op==='-') {
     i++;
     const value=unary();
     return op==='+'?value:combine(value,constant(-1),1);
   }
   const value=atom();
   if(peek()!=='^') return value;
   i++;
   const exponent=unary();
   if(scalar(exponent)<=0) {
     if(value.size!==1) throw Error();
     requireNonzeroVariables(value);
   }
   return record('power',start,power(value,exponent));
 }
 function product() {
   const start=i;
   let value=unary();
   while(true) {
     const op=peek();
     if(op==='*'||op==='/') {
       i++;
       const right=unary();
       if(op==='/') requireNonzeroVariables(right);
       value=record(op==='/'?'division':'product',start,op==='/'?divide(value,right):combine(value,right,1));
     } else if(['x','y','(','√','∛','sqrt','cbrt'].includes(op)) {
       value=record('product',start,combine(value,unary(),1));
     } else return value;
   }
 }
 function sum() {
   const start=i, value=product();
   while(peek()==='+'||peek()==='-') {
     const op=tokens[i++];
     for(const [key,n] of product()) addTerm(value,key,op==='+'?n:-n);
     record('sum',start,value,op);
   }
   return value;
 }
 const result=sum();
 if(i!==tokens.length) throw Error();
 result.nonzero=nonzero;
 return result;
}

export function sameValue(a,b) {
 for(const key of new Set([...a.keys(),...b.keys()])) {
   const x=a.get(key)??0, y=b.get(key)??0;
   if(Math.abs(x-y)>1e-12*Math.max(Math.abs(x),Math.abs(y))) return false;
 }
 return true;
}
