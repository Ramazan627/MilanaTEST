const fs=require('fs');
const qLines=fs.readFileSync('Вопросы','utf8').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
const questions=qLines.filter((l,i)=>i>=2 && /\?$|:$/.test(l));
const aLines=fs.readFileSync('ответы','utf8').split(/\r?\n/).map(s=>s.trim());
const answerEntries=[];
let currentQ='';
let curr=[];
for(const lineRaw of aLines){
  const line=lineRaw.replace(/^\d+\|/,'').trim();
  if(!line) continue;
  const plusMatch=line.match(/^\+\s*(.*)$/);
  if(plusMatch){
    const txt=plusMatch[1].trim();
    if(txt) curr.push(txt.replace(/\s+/g,' '));
    continue;
  }
  if(/[:?]$/.test(line) && !line.startsWith('+')){
    if(currentQ || curr.length){
      answerEntries.push({q:currentQ,answers:curr.slice()});
    }
    currentQ=line;
    curr=[];
  }
}
if(currentQ || curr.length){answerEntries.push({q:currentQ,answers:curr.slice()});}
const correctPool=[];
for(const e of answerEntries){
  if(e.answers.length){
    const c=e.answers.join('; ');
    if(c.length>3) correctPool.push(c);
  }
}
function norm(s){return s.toLowerCase().replace(/[—–-]/g,' ').replace(/[^\p{L}\p{N}\s]/gu,'').replace(/\s+/g,' ').trim();}
function pickWrong(correct, used){
  for(let i=0;i<correctPool.length*2;i++){
    const c=correctPool[Math.floor(Math.random()*correctPool.length)];
    if(c===correct) continue;
    if(norm(c)===norm(correct)) continue;
    if(used.has(norm(c))) continue;
    used.add(norm(c));
    return c;
  }
  const fallback=['Только медикаментозное лечение без наблюдения','Полный отказ от реабилитационных мероприятий','Метод не применяется в клинической практике'];
  for(const f of fallback){if(!used.has(norm(f))&&norm(f)!==norm(correct)){used.add(norm(f));return f;}}
  return 'Неверный вариант ответа';
}
const result=[];
for(let i=0;i<questions.length;i++){
  const q=questions[i];
  const e=answerEntries[i]||{};
  const correct=(e.answers&&e.answers.length?e.answers.join('; '):'Правильный вариант не указан в исходнике').replace(/\s+/g,' ').trim();
  const used=new Set([norm(correct)]);
  const wrong1=pickWrong(correct,used);
  const wrong2=pickWrong(correct,used);
  const wrong3=pickWrong(correct,used);
  const answers=[{text:correct,correct:true},{text:wrong1,correct:false},{text:wrong2,correct:false},{text:wrong3,correct:false}];
  for(let j=answers.length-1;j>0;j--){const k=Math.floor(Math.random()*(j+1));[answers[j],answers[k]]=[answers[k],answers[j]];}
  result.push({q,answers});
}
fs.writeFileSync('questions-data.json',JSON.stringify(result,null,2),'utf8');
fs.writeFileSync('questions-embedded.js','const QUESTIONS = '+JSON.stringify(result)+';','utf8');
console.log('questions',questions.length,'answers',answerEntries.length,'result',result.length);
