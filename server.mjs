import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('.',import.meta.url));
const port=Number(process.env.PORT || 8096);
const publicFiles=new Set(['index.html','style.css','src/app.mjs','src/engine.mjs','assets/mark.svg']);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{try{if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}const url=new URL(req.url,'http://localhost');const file=decodeURIComponent(url.pathname).replace(/^\//,'')||'index.html';if(!publicFiles.has(file)){res.writeHead(404);return res.end('Not found');}const data=await readFile(path.join(root,file));res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:data);}catch{res.writeHead(400);res.end('Bad request');}}).listen(port,'127.0.0.1',()=>console.log(`Brain Patch → http://127.0.0.1:${port}`));
