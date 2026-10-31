/** Auditoria dos PNGs para o GB Studio 4.2.0. Requer Node e ImageMagick. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync as exec} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const inventory=JSON.parse(fs.readFileSync(path.join(root,'artes/inventario_assets.json')));
const report=JSON.parse(fs.readFileSync(path.join(root,'artes/resultado_compilacao.json')));
const changed=new Set(report.map(e=>`gospel/assets/${e.file}`));changed.add('gospel/assets/sprites/golias.png');
const bgPal=new Set(['224,248,207','134,192,108','48,104,80','7,24,33']);
const spPal=new Set(['101,255,0','224,248,207','134,192,108','7,24,33']);
let backgrounds=0,sprites=0,frames=0;
function size(b){return [b.readUInt32BE(16),b.readUInt32BE(20)]}
function pixels(p){return exec('magick',[p,'-alpha','off','-depth','8','RGB:-'],{maxBuffer:32*1024*1024})}
function index(g){return g<65?3:g<130?2:g<205?1:0;}
function walk(v,visit){if(Array.isArray(v))v.forEach(x=>walk(x,visit));else if(v&&typeof v==='object'){visit(v);Object.values(v).forEach(x=>walk(x,visit));}}
for(const asset of [...inventory,{arquivo:'gospel/assets/sprites/golias.png',largura:64,altura:32,categoria:'sprites'}]){
 const p=path.join(root,asset.arquivo),buffer=fs.readFileSync(p),[w,h]=size(buffer);
 assert.deepEqual([w,h],[asset.largura,asset.altura],asset.arquivo);
 assert.equal(w%8,0);assert.equal(h%8,0);
 if(!changed.has(asset.arquivo))continue;
 const rgb=pixels(p),colors=new Set();for(let i=0;i<rgb.length;i+=3)colors.add(`${rgb[i]},${rgb[i+1]},${rgb[i+2]}`);
 assert(colors.size<=4,`${asset.arquivo}: ${colors.size} cores`);
 const allowed=asset.categoria==='backgrounds'?bgPal:spPal;for(const c of colors)assert(allowed.has(c),`${asset.arquivo}: cor ${c}`);
 if(asset.categoria==='backgrounds'){
  const tiles=new Set();for(let y=0;y<h;y+=8)for(let x=0;x<w;x+=8){let t='';for(let j=0;j<8;j++)for(let i=0;i<8;i++)t+=index(rgb[((y+j)*w+x+i)*3+1]);tiles.add(t);}
  assert(tiles.size<=192,`${asset.arquivo}: ${tiles.size} tiles`);backgrounds++;
 } else {
  assert(colors.has('101,255,0'),`Chave transparente ausente: ${asset.arquivo}`);
  const meta=JSON.parse(fs.readFileSync(p+'.gbsres'));
  walk(meta,v=>{
   if(v.sliceX!==undefined){assert(v.sliceX>=0&&v.sliceX+8<=w,asset.arquivo);assert(v.sliceY>=0&&v.sliceY+16<=h,asset.arquivo);}
   if(Array.isArray(v.tiles)&&v.tiles.length){let ink=0;for(const tile of v.tiles)for(let y=tile.sliceY;y<tile.sliceY+16;y++)for(let x=tile.sliceX;x<tile.sliceX+8;x++)if(`${rgb[(y*w+x)*3]},${rgb[(y*w+x)*3+1]},${rgb[(y*w+x)*3+2]}`!=='101,255,0')ink++;assert(ink>0,`Quadro vazio: ${asset.arquivo}, ${v.id}`);frames++;}
  });sprites++;
 }
}
// Metadados de todos os assets originais e mapas de colisão continuam intactos.
const baseline=JSON.parse(fs.readFileSync(path.join(root,'artes/referencias-integridade.json')));
let collisions=0,metadata=0;
for(const [rel,hash]of Object.entries(baseline.metadados)){
 const now=fs.readFileSync(path.join(root,rel));
 assert.equal(createHash('sha256').update(now).digest('hex'),hash,`Metadados alterados: ${rel}`);metadata++;
}
for(const [rel,a]of Object.entries(baseline.cenas)){
 const b=JSON.parse(fs.readFileSync(path.join(root,rel)));assert.equal(a.collisions,b.collisions,rel);assert.deepEqual([a.width,a.height],[b.width,b.height]);collisions++;
}
console.log(`Arte: ${backgrounds} fundos e ${sprites} folhas de sprites preparados; ${frames} quadros referenciados não vazios.`);
console.log(`Todos os PNGs: dimensões preservadas; arte nova com até 4 cores; fundos com até 192 tiles; recortes 8x16 válidos.`);
console.log(`Integridade: ${metadata} metadados originais idênticos; ${collisions} mapas de colisão preservados.`);
console.log('PASSOU — validação de arquivos; não executa ROM nem substitui conferência visual no GB Studio.');
