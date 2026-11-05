import { execSync } from "child_process";
setTimeout(()=>{console.log("WATCHDOG");process.exit(3)},70000);
const out=process.argv[2], adb=process.argv[3], OFF=157;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let t; for(let i=0;i<10&&!t;i++){ try{ t=(await (await fetch("http://localhost:9333/json")).json()).find(x=>x.type==="page"); }catch{ await sleep(1500);} }
const ws=new WebSocket(t.webSocketDebuggerUrl); await new Promise(r=>ws.onopen=r);
let id=0; const w=new Map(); ws.onmessage=e=>{const m=JSON.parse(e.data); if(m.id)w.get(m.id)?.(m)};
const ev=x=>new Promise(r=>{const i=++id;w.set(i,m=>r(m.result?.result?.value));ws.send(JSON.stringify({id:i,method:"Runtime.evaluate",params:{expression:x,returnByValue:true}}))});
const state=()=>ev(`JSON.stringify({dialog:!!document.querySelector('dialog[open]'),checked:[...document.querySelectorAll('input[type=radio]')].filter(i=>i.checked).map(i=>i.value),correct:document.body.innerText.includes('Correct')})`);
const tap=(x,y)=>execSync(`${adb} shell input tap ${Math.round(x*3)} ${Math.round(y*3+OFF)}`);
await ev(`document.querySelectorAll('.switcher button')[1].click()`); await sleep(700);
let c=await ev(`(()=>{const e=[...document.querySelectorAll('div')].filter(x=>x.textContent.trim().startsWith('Change from Em7')).pop();const b=e.getBoundingClientRect();return [b.left+b.width/2,b.top+b.height/2]})()`); tap(...c); await sleep(900); console.log("opened",await state());
const rect=s=>ev(`(()=>{const e=${s};e.scrollIntoView({block:'center'});const b=e.getBoundingClientRect();return [b.left+b.width/2,b.top+b.height/2,document.elementFromPoint(b.left+b.width/2,b.top+b.height/2)?.tagName]})()`);
let r=await rect(`document.querySelectorAll('dialog[open] input[type=radio]')[1]`); await sleep(400); r=await rect(`document.querySelectorAll('dialog[open] input[type=radio]')[1]`); console.log("radio",r); tap(r[0],r[1]); await sleep(900); console.log("after radio",await state());
r=await rect(`[...document.querySelectorAll('dialog[open] button')].find(b=>b.textContent.includes('Check answer'))`); await sleep(400); r=await rect(`[...document.querySelectorAll('dialog[open] button')].find(b=>b.textContent.includes('Check answer'))`); console.log("check",r); tap(r[0],r[1]); await sleep(1400); console.log("after check",await state());
execSync(`${adb} exec-out screencap -p > ${out}/android-B-quiz.png`);
// back button closes drawer?
execSync(`${adb} shell input keyevent 4`); await sleep(900); console.log("after back",await state());
execSync(`${adb} exec-out screencap -p > ${out}/android-B-after.png`);
process.exit(0);
