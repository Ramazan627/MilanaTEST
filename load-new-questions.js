const fs=require('fs');
const lines=fs.readFileSync('Вопросы','utf8').split(/\r?\n/).map(l=>l.trim());
const items=[];
let current=null;
for(const line of lines){
  if(!line) continue;
  const qMatch=line.match(/^\d+\.\s*(.+)$/);
  if(qMatch){
    if(current) items.push(current);
    current={q:qMatch[1].trim(),answers:[]};
    continue;
  }
  if(!current) continue;

  if(line.startsWith('+')){
    current.answers.push({text:line.slice(1).trim(),correct:true});
    continue;
  }
  if(line.startsWith('·')){
    current.answers.push({text:line.slice(1).trim(),correct:false});
    continue;
  }
  const ansMatch=line.match(/^Ответ\s*:?\s*(.+)$/i);
  if(ansMatch){
    current.answers.push({text:ansMatch[1].trim(),correct:true});
  }
}
if(current) items.push(current);

const wrongPool=[];
for(const it of items){
  for(const a of it.answers){
    if(!a.correct && a.text) wrongPool.push(a.text);
  }
}
function norm(s){return s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,'').replace(/\s+/g,' ').trim();}
function pickWrong(used){
  for(let i=0;i<wrongPool.length*2;i++){
    const c=wrongPool[Math.floor(Math.random()*wrongPool.length)];
    const n=norm(c);
    if(!used.has(n)){used.add(n);return c;}
  }
  const fallback=['Не относится к данному методу','Используют только в стационаре','Является абсолютным противопоказанием'];
  for(const f of fallback){const n=norm(f);if(!used.has(n)){used.add(n);return f;}}
  return 'Неверный вариант';
}

for(const it of items){
  // ensure one correct answer
  if(!it.answers.some(a=>a.correct) && it.answers.length){
    it.answers[0].correct=true;
  }
  const correctTexts = it.answers.filter(a=>a.correct).map(a=>a.text).filter(Boolean);
  // normalize malformed answer text for #69
  if(it.q.includes('Сколько электродов имеет СМТ')){
    it.answers = [{text:'2 электрода',correct:true}];
  }

  // dedupe by text
  const seen=new Set();
  it.answers = it.answers.filter(a=>{const n=norm(a.text); if(!n||seen.has(n)) return false; seen.add(n); return true;});

  // keep first correct + up to 3 wrong from own answers
  let correct = it.answers.find(a=>a.correct);
  if(!correct){ correct={text: correctTexts[0] || 'Правильный ответ', correct:true}; }
  const wrongs = it.answers.filter(a=>!a.correct).slice(0,3).map(a=>a.text);
  const used = new Set([norm(correct.text), ...wrongs.map(norm)]);
  while(wrongs.length<3){
    // special numeric distractors for electrode question
    if(it.q.includes('Сколько электродов имеет СМТ') && wrongs.length===0){wrongs.push('1 электрод'); used.add(norm('1 электрод')); continue;}
    if(it.q.includes('Сколько электродов имеет СМТ') && wrongs.length===1){wrongs.push('4 электрода'); used.add(norm('4 электрода')); continue;}
    if(it.q.includes('Сколько электродов имеет СМТ') && wrongs.length===2){wrongs.push('6 электродов'); used.add(norm('6 электродов')); continue;}
    wrongs.push(pickWrong(used));
  }
  const answers=[{text:correct.text,correct:true},...wrongs.map(t=>({text:t,correct:false}))];
  for(let j=answers.length-1;j>0;j--){const k=Math.floor(Math.random()*(j+1));[answers[j],answers[k]]=[answers[k],answers[j]];}
  it.answers=answers;
}

fs.writeFileSync('questions-data.json', JSON.stringify(items,null,2), 'utf8');
fs.writeFileSync('questions-embedded.js', 'const QUESTIONS = '+JSON.stringify(items)+';', 'utf8');
console.log('Loaded questions:', items.length);
