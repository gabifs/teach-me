import { chromium } from "playwright";
const out = process.argv[2];
const b = await chromium.launch({ channel: "chrome" });
const errs=[]; 
const mk = async (w,h,q) => { const p = await (await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:2,hasTouch:w<500})).newPage(); p.on("pageerror",e=>errs.push(e.message.slice(0,200))); p.on("console",m=>{if(m.type()==="error"&&!/404/.test(m.text()))errs.push(m.text().slice(0,200))}); await p.goto("http://localhost:5198/?"+q); await p.waitForTimeout(800); return p; };
// font + bridge
let p = await mk(1440,900,"variant=B&theme=neutral&mode=light");
await p.getByText("Change from Em7").first().click({timeout:4000}); await p.waitForTimeout(400);
console.log("computed", JSON.stringify(await p.evaluate(()=>{const g=(s,k)=>getComputedStyle(document.querySelector(s))[k];return {pFont:g(".lesson p","fontFamily").slice(0,20),h2Font:g(".lesson h2","fontFamily").slice(0,20),hdrBg:g("header","backgroundColor"),hdrBorder:g("header","borderBottomColor"),varSurface:getComputedStyle(document.documentElement).getPropertyValue("--color-background-surface").slice(0,40)}})));
await p.screenshot({path:`${out}/B-open-desktop.png`});
// quiz on desktop B
await p.getByLabel("Middle").check({force:true}); await p.getByRole("button",{name:"Check answer"}).click(); await p.waitForTimeout(1100);
console.log("quiz: teacher reply present:", await p.getByText("that's the whole trick").count(), "banner:", await p.getByText("Correct",{exact:true}).count());
await p.screenshot({path:`${out}/B-quiz-desktop.png`});
// stream on phone A: where does scroll go?
p = await mk(390,844,"variant=A&theme=neutral&mode=light");
const scroll = ()=>p.evaluate(()=>{const e=[...document.querySelectorAll(".app *")].find(x=>x.scrollHeight>x.clientHeight+5&&/auto|scroll/.test(getComputedStyle(x).overflowY));const h=document.querySelector(".lesson h2").getBoundingClientRect().top;return {top:Math.round(e?.scrollTop??-1),sh:e?.scrollHeight,lessonTitleY:Math.round(h)}});
console.log("A phone at load",JSON.stringify(await scroll()));
await p.getByRole("button",{name:"stream"}).click(); await p.waitForTimeout(250); await p.screenshot({path:`${out}/A-stream0-phone.png`});
for (const t of [1500,1800,2200]) { await p.waitForTimeout(t); console.log("A phone streaming",JSON.stringify(await scroll())); }
await p.screenshot({path:`${out}/A-streamed-phone.png`});
// C phone sheet
p = await mk(390,844,"variant=C&theme=neutral&mode=light");
await p.screenshot({path:`${out}/C-phone.png`});
await p.getByRole("button",{name:"Talk to your Teacher"}).click(); await p.waitForTimeout(700); await p.screenshot({path:`${out}/C-sheet-phone.png`});
// themes
for (const [t,mo] of [["stone","light"],["gothic","dark"],["neutral","dark"]]) { p = await mk(390,844,`variant=B&theme=${t}&mode=${mo}`); await p.screenshot({path:`${out}/theme-${t}-${mo}-phone.png`}); console.log(t,mo,await p.evaluate(()=>getComputedStyle(document.body).backgroundColor+" | "+getComputedStyle(document.querySelector(".app header")).backgroundColor)); }
console.log("errors:",[...new Set(errs)].join("\n")||"none");
await b.close();
