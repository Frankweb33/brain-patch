import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const root=new URL('../',import.meta.url);
test('all local HTML dependencies exist',async()=>{
  const html=await readFile(new URL('index.html',root),'utf8');
  for(const match of html.matchAll(/(?:src|href)="([^"#][^"]*)"/g))if(!match[1].startsWith('http'))await access(new URL(match[1],root));
});
test('README local images exist',async()=>{
  const readme=await readFile(new URL('README.md',root),'utf8');
  for(const match of readme.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g))await access(new URL(match[1],root));
});
test('CLI example emits a structured review',()=>{
  const stdout=execFileSync(process.execPath,[new URL('cli.mjs',root).pathname,'--example'],{encoding:'utf8'});
  const data=JSON.parse(stdout);assert.equal(data.mode,'local-heuristic');assert.ok(data.findings.some(f=>f.id==='anchoring'));
});
test('CLI JSON fixture works',()=>{
  const stdout=execFileSync(process.execPath,[new URL('cli.mjs',root).pathname,'--file',new URL('examples/decision.json',root).pathname],{encoding:'utf8'});
  assert.equal(JSON.parse(stdout).decision.title,'Holding for the old high');
});
test('source does not render user input as HTML',async()=>{
  const app=await readFile(new URL('src/app.mjs',root),'utf8');
  assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|\beval\(/.test(app));
  assert.ok(!/\bfetch\(|XMLHttpRequest|WebSocket/.test(app));
});
test('motion has a reduced-motion path and a local stylesheet',async()=>{
  const css=await readFile(new URL('motion.css',root),'utf8');
  const app=await readFile(new URL('src/app.mjs',root),'utf8');
  const server=await readFile(new URL('server.mjs',root),'utf8');
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(app,/if\(!reduced\) await/);
  assert.match(server,/'motion.css'/);
});
test('article cover and animated preview have valid image headers',async()=>{
  const cover=await readFile(new URL('assets/article-cover.png',root));
  const gif=await readFile(new URL('assets/review-loop.gif',root));
  assert.equal(cover.subarray(1,4).toString(),'PNG');
  assert.match(gif.subarray(0,6).toString(),/^GIF8[79]a$/);
});
