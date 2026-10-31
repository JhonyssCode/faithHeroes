/** Regressões de cor, recorte, tiles e orçamento de sprites da versão 2. */
import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import{execFileSync as exec}from'node:child_process';
const root=path.resolve(import.meta.dirname,'..'),base=path.join(root,'gospel/assets'),cfg=JSON.parse(fs.readFileSync(path.join(root,'artes/v2/config.json'))),baseline=JSON.parse(fs.readFileSync(path.join(root,'artes/v2/referencias_metadados_v1.json')));
const changes=new Map(JSON.parse(fs.readFileSync(path.join(root,'artes/v2/manifesto_assets.json'))).map(e=>['gospel/assets/'+e.file,e]));
const inventory=JSON.parse(fs.readFileSync(path.join(root,'artes/inventario_assets.json')));
for(const asset of inventory){const c=changes.get(asset.arquivo);const b=fs.readFileSync(path.join(root,asset.arquivo));assert.equal(b.readUInt32BE(16),c?c.width:asset.largura,asset.arquivo);assert.equal(b.readUInt32BE(20),c?c.height:asset.altura,asset.arquivo);}
const all=[];function files(p){for(const n of fs.readdirSync(p)){const f=path.join(p,n);if(fs.statSync(f).isDirectory())files(f);else if(f.endsWith('.png'))all.push(f);}}files(base);
function pixels(p){return exec('magick',[p,'-alpha','off','-depth','8','RGBA:-'],{maxBuffer:64*1024*1024});}
function spriteIndex(r,g,b,a){return(g>249&&r<180&&b<20)||(b>=200&&g<20)||a<200?0:g>=205?1:g>=130?2:3;}
function bgIndex(g){return g<65?3:g<130?2:g<205?1:0;}
function walk(o,fn){if(Array.isArray(o))o.forEach(v=>walk(v,fn));else if(o&&typeof o==='object'){fn(o);Object.values(o).forEach(v=>walk(v,fn));}}
let backgrounds=0,sprites=0,frames=0;const perSprite=new Map(),spriteMeta=new Map();
for(const p of all){
 const b=fs.readFileSync(p),w=b.readUInt32BE(16),h=b.readUInt32BE(20);assert.equal(w%8,0,p);assert.equal(h%8,0,p);const rgba=pixels(p),colors=new Set();for(let i=0;i<rgba.length;i+=4)colors.add(`${rgba[i]},${rgba[i+1]},${rgba[i+2]}`);
 const d=fs.existsSync(p+'.gbsres')?JSON.parse(fs.readFileSync(p+'.gbsres')):null;
 if(p.includes('/backgrounds/')){
  assert(colors.size<=4,p);assert(!d.tileColors,`Atributos de cor antigos: ${p}`);const set=new Set();for(let y=0;y<h;y+=8)for(let x=0;x<w;x+=8){let tile='';for(let j=0;j<8;j++)for(let i=0;i<8;i++)tile+=bgIndex(rgba[((y+j)*w+x+i)*4+1]);set.add(tile);}
  assert(set.size<=192,`${p}: ${set.size}`);if(p.endsWith('/sample_town.png'))assert(set.size<=128);if(p.endsWith('/vale_desafio.png'))assert(set.size<=96);backgrounds++;
 }
 if(p.includes('/sprites/')){
  assert(d,p);assert.equal(d.width,w,p);assert.equal(d.height,h,p);let maxLine=0;
  for(const s of d.states)for(const animation of s.animations)for(const frame of animation.frames){
   const lines=new Map();let ink=0;
   for(const t of frame.tiles){assert.equal(t.paletteIndex??0,0,p);assert.equal(t.objPalette??'OBP0','OBP0',p);assert(t.sliceX>=0&&t.sliceX+8<=w&&t.sliceY>=0&&t.sliceY+16<=h,`${p}: corte inválido`);
    for(let y=t.y;y<t.y+16;y++)lines.set(y,(lines.get(y)||0)+1);
    for(let y=t.sliceY;y<t.sliceY+16;y++)for(let x=t.sliceX;x<t.sliceX+8;x++){const at=(y*w+x)*4;ink+=spriteIndex(...rgba.subarray(at,at+4))!==0?1:0;}
   }
   if(frame.tiles.length){assert(ink>0,`${p}: quadro vazio`);frames++;}for(const n of lines.values())maxLine=Math.max(maxLine,n);
  }
  perSprite.set(d.id,maxLine);spriteMeta.set(d.id,d);sprites++;
 }
}
// Metadados do modelo só mudam nos três casos declarados: atributos de cor,
// a folha regular de Samuel, e a folha exclusiva de Golias.
for(const[rel,old]of Object.entries(baseline)){
 const now=JSON.parse(fs.readFileSync(path.join(root,rel)));assert.equal(now.id,old.id,rel);assert.equal(now._resourceType,old._resourceType,rel);
 if(rel.endsWith('/player_platform.png.gbsres')){
  for(const k of ['filename','symbol','canvasWidth','canvasHeight','boundsX','boundsY','boundsWidth','boundsHeight'])assert.deepEqual(now[k],old[k],`${rel}: ${k}`);
  assert.deepEqual(now.states.map(s=>s.id),old.states.map(s=>s.id));assert.equal(perSprite.get(now.id),2,'Samuel deve usar só duas peças por linha');
 }else if(rel.endsWith('/golias.png.gbsres')){assert.equal(now.canvasWidth,24);assert.equal(now.height,32);}
 else{const a=structuredClone(old),b=structuredClone(now);delete a.tileColors;delete b.tileColors;for(const obj of [a,b])walk(obj,t=>{if(t.sliceX!==undefined){if('paletteIndex'in t)t.paletteIndex=0;if('palette'in t)t.palette=0;if('objPalette'in t)t.objPalette='OBP0';}});assert.deepEqual(b,a,rel);}
}
// O orçamento do duelo usa os PNGs/metadados e os tempos reais dos eventos.
const arena=JSON.parse(fs.readFileSync(path.join(root,'gospel/project/scenes/space/vale_desafio/scene.gbsres'))),boss=JSON.parse(fs.readFileSync(path.join(root,'gospel/project/scenes/space/vale_desafio/actors/golias.gbsres')));
let stone,rate,arrow,waitSeconds=0;walk(arena,e=>{if(e.command==='EVENT_RATE_LIMIT')rate=e.args.time.value;if(e.command==='EVENT_LAUNCH_PROJECTILE')stone=e.args;});walk(boss.updateScript,e=>{if(e.command==='EVENT_LAUNCH_PROJECTILE')arrow=e.args;if(e.command==='EVENT_WAIT')waitSeconds+=e.args.time.value;});
assert(stone&&arrow&&rate);const bullets=Math.ceil(stone.lifeTime/rate),arrows=Math.ceil(arrow.lifeTime/waitSeconds),hero=perSprite.get(arena.playerSpriteSheetId),giant=perSprite.get(boss.spriteSheetId),shot=perSprite.get(stone.spriteSheetId),spear=perSprite.get(arrow.spriteSheetId);
const lineBudget=hero+giant+bullets*shot+arrows*spear;assert(lineBudget<=10,`Disputa por linha: ${lineBudget}`);assert.equal(shot,1);assert.equal(spear,1);assert.equal(giant,3);
const actorDir=path.join(root,'gospel/project/scenes/space/vale_desafio/actors');const hud=fs.readdirSync(actorDir).filter(n=>n.startsWith('hud_')).map(n=>JSON.parse(fs.readFileSync(path.join(actorDir,n))));assert.equal(hud.length,8);assert(hud.every(a=>a.isPinned&&a.y===1));assert(hud.reduce((n,a)=>n+perSprite.get(a.spriteSheetId),0)<=10);
const sceneFiles=[];function scenePaths(p){for(const n of fs.readdirSync(p)){const f=path.join(p,n);if(fs.statSync(f).isDirectory())scenePaths(f);else if(n==='scene.gbsres')sceneFiles.push(f);}}scenePaths(path.join(root,'gospel/project/scenes'));
for(const p of sceneFiles){const s=JSON.parse(fs.readFileSync(p));assert(s.paletteIds.every(id=>id===cfg.palette));assert(s.spritePaletteIds.every(id=>id===cfg.palette));}
console.log(`Arte: ${all.length} PNGs lidos, ${backgrounds} fundos e ${sprites} folhas de sprites auditados; ${frames} quadros referenciados válidos.`);
console.log('Praça montada com tiles nativos (até 128), sem substituição destrutiva de blocos; arena até 96 tiles.');
console.log('Cores: atributos antigos removidos, paleta coerente e recortes de Samuel corrigidos, sem sobreposição de peças.');
console.log(`Duelo: orçamento conservador ${lineBudget}/10 sprites por linha; HUD separado com ${hud.length}/10; pedras e lanças de uma peça.`);
console.log('PASSOU — estrutura e orçamento de projeto; percepção de flicker e colisões reais ainda requerem execução no emulador.');
