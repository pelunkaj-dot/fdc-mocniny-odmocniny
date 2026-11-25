// These tokens come from the authored task templates, never from answer fields.
function atom(text) {
 if(/^\d+(?:,\d+)?$/.test(text)) return '<mn>'+text+'</mn>';
 if(/^[xy]$/.test(text)) return '<mi>'+text+'</mi>';
 return '<mo>'+text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')+'</mo>';
}
export function math(source) {
 const tokens = source.match(/\d+(?:,\d+)?|[^\s]/gu)||[];
 let position = 0;
 function group() {
   const token = tokens[position++];
   if(token==='(') return '<mrow><mo>(</mo>'+sequence()+ '<mo>)</mo></mrow>';
   if(token==='√'||token==='∛') {
     let content;
     if(tokens[position]==='(') { position++;content=sequence(); }
     else content=group();
     return token==='√'?'<msqrt><mrow>'+content+'</mrow></msqrt>':'<mroot><mrow>'+content+'</mrow><mn>3</mn></mroot>';
   }
   return atom(token==='-'?'−':token);
 }
 function powered() {
   const base=group();
   if(tokens[position]!=='^') return base;
   position++;
   let exponent;
   if(tokens[position]==='(') {position++;exponent=sequence();}
   else if(tokens[position]==='-') {position++;exponent='<mo>−</mo>'+group();}
   else exponent=group();
   return '<msup>'+base+'<mrow>'+exponent+'</mrow></msup>';
 }
 function sequence() {
   let output='';
   while(position<tokens.length && tokens[position]!==')') {
     if(tokens[position]==='-' && /^\d+$/.test(tokens[position+1]||'') && tokens[position+2]==='/') {
       output+='<mo>−</mo>';
       position++;
     }
     const numerator=powered();
     if(tokens[position]==='/') {
       position++;
       const sign=tokens[position]==='-'?(position++,'<mo>−</mo>'):'';
       output+='<mfrac>'+numerator+'<mrow>'+sign+powered()+'</mrow></mfrac>';
     } else output+=numerator;
   }
   if(tokens[position]===')') position++;
   return output;
 }
 return '<math aria-label="'+source.replaceAll('"','&quot;').replaceAll('<','&lt;')+'"><mrow>'+sequence()+'</mrow></math>';
}
