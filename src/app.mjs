import { SCENARIOS, reviewDecision } from './engine.mjs';
const $ = id => document.getElementById(id);
let report, baseline = null;
const storageKey = 'brain-patch-journal-v1';
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let reviewPhase=-1;
let journal = [];
try { const saved = JSON.parse(localStorage.getItem(storageKey) || '[]'); if (Array.isArray(saved)) journal = saved.filter(r => r?.report?.decision?.thesis && typeof r.id === 'string').slice(0,50); } catch { /* Storage may be disabled or malformed. */ }
function el(tag, className, content) { const node = document.createElement(tag); if(className) node.className=className; if(content !== undefined) node.textContent=content; return node; }
const fields = { title:'title', thesis:'thesis', evidence:'evidence', invalidation:'invalidation', action:'action', horizon:'horizon', positionPct:'position', maxPositionPct:'limit' };
function readForm() { return Object.fromEntries(Object.entries(fields).map(([key,id]) => [key,$(id).value])); }
function fillForm(data) { for(const [key,id] of Object.entries(fields)) $(id).value = data[key] ?? ''; }
function renderReport(animate=false) {
  $('flag-number').textContent = report.flagCount;
  $('review-summary').textContent = report.flagCount ? 'Inspect these cues before the chart becomes your explanation. Each flag is a question worth checking.' : 'No configured cues matched. This does not verify your evidence, reasoning or the safety of the decision.';
  $('findings').replaceChildren();
  for (const item of report.findings) {
    const card=el('article','finding'), head=el('div','finding-head');
    head.append(el('h3','',item.name),el('span','tag','PHRASE MATCH'));
    card.append(head,el('p','',item.note),el('p','quote',`Detected wording: “${item.cue}”`),el('p','question',item.question));
    $('findings').append(card);
  }
  for(const item of report.checks) { const card=el('article','finding check'),head=el('div','finding-head'); head.append(el('h3','',item.title),el('span','tag',item.role.toUpperCase()));card.append(head,el('p','',item.detail));$('findings').append(card); }
  $('changes').replaceChildren();
  for(const item of report.changes) { const card=el('div','change');card.append(el('b','',`${item.field} changed`),el('p','',`Before: ${item.before || '(empty)'}`),el('p','',`Now: ${item.after || '(empty)'}`));$('changes').append(card); }
  if(animate && !reduced) document.querySelectorAll('#findings .finding, #changes .change').forEach((card,index)=>card.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:350,delay:index*65,fill:'backwards',easing:'ease-out'}));
}
async function animateReview() {
  const roles=[...document.querySelectorAll('.roles>div')];
  const messages=['Checking supplied evidence…','Checking the reconsideration condition…','Comparing your position with your limit…','Comparing with the saved receipt…'];
  document.documentElement.classList.add('is-reviewing');
  roles.forEach(role=>role.classList.remove('is-active','is-complete'));
  for(let i=0;i<roles.length;i++){
    reviewPhase=i;roles[i].classList.add('is-active');$('brain-status').textContent=messages[i];
    if(!reduced) await new Promise(resolve=>setTimeout(resolve,230));
    roles[i].classList.replace('is-active','is-complete');
  }
  reviewPhase=-1;$('brain-status').textContent='Review ready. Your decision stays yours.';
}
function renderJournal() {
  $('journal-count').textContent=journal.length;
  $('journal-list').replaceChildren();
  if(!journal.length) $('journal-list').append(el('div','empty-journal','Nothing saved yet. Review a decision, then save a receipt to keep a timestamped snapshot.'));
  for(const row of journal) { const card=el('article','journal-item'),body=el('div');body.append(el('h3','',row.report.decision.title || 'Untitled decision'),el('p','',`${new Date(row.savedAt).toLocaleString()} · ${row.report.flagCount} flags · local snapshot`));const btn=el('button','','Compare with this receipt ↗');btn.addEventListener('click',()=>{ baseline=row.report.decision;fillForm(baseline);report=reviewDecision(baseline,baseline);renderReport();$('review-state').textContent='COMPARISON BASELINE LOADED';$('notice').textContent='Receipt loaded. Edit your reasoning and run another review to compare.';$('workspace').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}); });card.append(body,btn);$('journal-list').append(card); }
}
function download(data,name) {const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
document.querySelectorAll('[data-scenario]').forEach(btn=>btn.addEventListener('click',()=>{baseline=null;fillForm(SCENARIOS[btn.dataset.scenario]);document.querySelectorAll('[data-scenario]').forEach(b=>b.classList.toggle('active',b===btn));report=reviewDecision(readForm());renderReport();$('review-state').textContent='EXAMPLE REVIEW';$('error').textContent='';}));
$('decision-form').addEventListener('submit', async event=>{
  event.preventDefault();$('error').textContent='';
  const controls=[...document.querySelectorAll('#decision-form input, #decision-form textarea, #decision-form select, #decision-form button, [data-scenario], .review-actions button, .journal-item button')];
  try{report=reviewDecision(readForm(),baseline);controls.forEach(control=>control.disabled=true);$('decision-form').setAttribute('aria-busy','true');await animateReview();renderReport(true);$('review-state').textContent='LOCAL CHECK COMPLETE';}
  catch(error){$('error').textContent=error.message;}
  finally{controls.forEach(control=>control.disabled=false);$('decision-form').removeAttribute('aria-busy');document.documentElement.classList.remove('is-reviewing');reviewPhase=-1;}
});
$('save').addEventListener('click',()=>{try { report=reviewDecision(readForm(),baseline);const row={id:crypto.randomUUID(),savedAt:new Date().toISOString(),report};const next=[row,...journal].slice(0,50);localStorage.setItem(storageKey,JSON.stringify(next));journal=next;baseline=report.decision;renderReport();renderJournal();$('notice').textContent='Receipt saved in this browser. Changes after this point can be compared.';$('save').textContent='Receipt saved ✓';setTimeout(()=>$('save').textContent='Save decision receipt ＋',1700);}catch(error){$('error').textContent=`Could not save: ${error.message}`;}});
$('export-review').addEventListener('click',()=>{try{download(reviewDecision(readForm(),baseline),'brain-patch-review.json');}catch(error){$('error').textContent=error.message;}});
$('export-journal').addEventListener('click',()=>download({version:1,exportedAt:new Date().toISOString(),receipts:journal},'brain-patch-journal.json'));
fillForm(SCENARIOS.peak);report=reviewDecision(readForm());renderReport();renderJournal();

// A decorative, seeded 3D point cloud. It is not a connectome or measured activity.
const canvas=$('brain'),ctx=canvas.getContext('2d');
let width=600,height=264,seed=73,frame=0;
const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
const nodes=[];
for(let i=0;i<620;i++){const side=i%2?1:-1,u=random()*Math.PI*2,v=Math.acos(2*random()-1),shell=.73+random()*.27;const x=side*(.28+Math.abs(Math.cos(u)*Math.sin(v))*.66)*shell;const y=Math.cos(v)*.70*shell,z=Math.sin(u)*Math.sin(v)*.58*shell;nodes.push({x,y,z,side});}
const links=[];for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j],dist=(a.x-b.x)**2+(a.y-b.y)**2+(a.z-b.z)**2;if(dist<.055&&random()<.20)links.push([i,j]);}
function resize(){const r=canvas.getBoundingClientRect();width=r.width;height=r.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
new ResizeObserver(resize).observe(canvas);
function draw(){frame++;ctx.clearRect(0,0,width,height);const t=reduced?.6:frame*.004,rotation=Math.sin(t)*.35+.2,scale=Math.min(width*.23,height*.44);const projected=nodes.map(p=>{const x=p.x*Math.cos(rotation)+p.z*Math.sin(rotation),z=-p.x*Math.sin(rotation)+p.z*Math.cos(rotation);return{x:width/2+x*scale,y:height*.49+p.y*scale+z*scale*.19,z};});
  ctx.lineWidth=.6;for(const [i,j] of links){const a=projected[i],b=projected[j];ctx.strokeStyle=`rgba(112,178,190,${.08+(a.z+1)*.12})`;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
  if(!reduced)for(let k=0;k<links.length;k+=reviewPhase>=0?11:29){const [i,j]=links[k],a=projected[i],b=projected[j],progress=(t*(reviewPhase>=0?5:2)+k*.19)%1;ctx.fillStyle=reviewPhase>=0?'#f5bc8e':'#9bdde5';ctx.shadowBlur=7;ctx.shadowColor=ctx.fillStyle;ctx.beginPath();ctx.arc(a.x+(b.x-a.x)*progress,a.y+(b.y-a.y)*progress,reviewPhase>=0?1.6:1.1,0,Math.PI*2);ctx.fill();}ctx.shadowBlur=0;
  projected.forEach((p,i)=>{const cluster=(nodes[i].side>0?2:0)+(nodes[i].y>0?1:0),hot=(Math.sin(t*3+i*.11)>.986)||(reviewPhase===cluster&&i%4===0);ctx.fillStyle=hot?'#f7c18f':`rgba(129,194,205,${.25+(p.z+1)*.27})`;ctx.beginPath();ctx.arc(p.x,p.y,hot?2.0:1.05,0,Math.PI*2);ctx.fill();});
  ctx.strokeStyle='#d9a67b99';ctx.lineWidth=.8;ctx.beginPath();ctx.ellipse(width/2,height*.50,scale*1.3,scale*.22,-.24,0,Math.PI*2);ctx.stroke();
  if(!reduced){const orbit=t*.7,ox=Math.cos(orbit)*scale*1.3,oy=Math.sin(orbit)*scale*.22;ctx.fillStyle='#efbb8f';ctx.beginPath();ctx.arc(width/2+ox*Math.cos(-.24)-oy*Math.sin(-.24),height*.5+ox*Math.sin(-.24)+oy*Math.cos(-.24),2.5,0,Math.PI*2);ctx.fill();}
  if(!reduced)requestAnimationFrame(draw);
}resize();draw();
