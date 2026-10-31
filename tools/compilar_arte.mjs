/** Preparação técnica dos PNGs gerados: recorte, paleta, dimensões e tiles.
 * Desenho criativo: image_gen. Não cria personagens nem cenários por código.
 * Uso: node tools/compilar_arte.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync as exec} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const palette=[[224,248,207],[134,192,108],[48,104,80],[7,24,33]];
const spritePalette=[[101,255,0],palette[0],palette[1],palette[3]];
const inventory=JSON.parse(fs.readFileSync(path.join(root,'artes/inventario_assets.json')));
const meta=new Map(inventory.map(x=>[x.arquivo,x]));
const report=[];
function size(p){return exec('magick',['identify','-format','%w %h',p],{encoding:'utf8'}).trim().split(' ').map(Number)}
function raw(p,args=[]){return exec('magick',[p,...args,'-alpha','off','-depth','8','RGB:-'],{maxBuffer:32*1024*1024})}
function closest(rgb,pal){let best=0,d=Infinity;for(let i=0;i<pal.length;i++){const q=pal[i];const n=(rgb[0]-q[0])**2+(rgb[1]-q[1])**2+(rgb[2]-q[2])**2;if(n<d){d=n;best=i;}}return best;}
function indices(bytes,pal){const a=new Uint8Array(bytes.length/3);for(let i=0;i<a.length;i++)a[i]=closest(bytes.subarray(i*3,i*3+3),pal);return a;}
function writePNG(p,w,h,px,pal){const bytes=Buffer.alloc(w*h*3);for(let i=0;i<px.length;i++)for(let c=0;c<3;c++)bytes[i*3+c]=pal[px[i]][c];exec('magick',['-size',`${w}x${h}`,'-depth','8','RGB:-','-define','png:color-type=2',p],{input:bytes});}
function getTile(px,w,x,y){const t=new Uint8Array(64);for(let j=0;j<8;j++)t.set(px.subarray((y+j)*w+x,(y+j)*w+x+8),j*8);return t;}
function putTile(px,w,x,y,t){for(let j=0;j<8;j++)px.set(t.subarray(j*8,j*8+8),(y+j)*w+x);}
function key(t){return Buffer.from(t).toString('base64')}
function dist(a,b){let n=0;for(let j=0;j<64;j++)n+=(a[j]-b[j])**2;return n;}
function original(rel){const b=exec('unzip',['-p',path.join(root,'artes/modelo-png-original.zip'),rel],{maxBuffer:32*1024*1024});return exec('magick',['PNG:-','-alpha','off','-depth','8','RGB:-'],{input:b,maxBuffer:32*1024*1024});}
function projectTiles(ref,img,w,h){
 const groups=new Map();
 for(let y=0;y<h;y+=8)for(let x=0;x<w;x+=8){const k=key(getTile(ref,w,x,y));if(!groups.has(k))groups.set(k,[]);groups.get(k).push({x,y,t:getTile(img,w,x,y)});}
 const out=new Uint8Array(img.length);
 for(const cells of groups.values()){
  const mean=new Float64Array(64);for(const c of cells)for(let j=0;j<64;j++)mean[j]+=c.t[j]/cells.length;
  let chosen=cells[0],score=Infinity;for(const c of cells){const d=dist(c.t,mean);if(d<score){score=d;chosen=c;}}
  for(const c of cells)putTile(out,w,c.x,c.y,chosen.t);
 }
 return {px:out,originalTiles:groups.size};
}
function capTiles(img,w,h,max=192){
 const types=new Map();for(let y=0;y<h;y+=8)for(let x=0;x<w;x+=8){const t=getTile(img,w,x,y),k=key(t);if(!types.has(k))types.set(k,{t,n:0});types.get(k).n++;}
 const a=[...types.values()];if(a.length<=max)return img;
 a.sort((a,b)=>b.n-a.n);const chosen=[a[0].t],best=new Float64Array(a.length).fill(Infinity),which=new Uint16Array(a.length);
 for(let c=0;c<max;c++){
  let worst=-1,pick=0;for(let i=0;i<a.length;i++){const d=dist(a[i].t,chosen[c]);if(d<best[i]){best[i]=d;which[i]=c;}const score=best[i]*Math.sqrt(a[i].n);if(score>worst){worst=score;pick=i;}}
  if(c+1<max)chosen.push(a[pick].t);
 }
 const replacements=new Map(a.map((v,i)=>[key(v.t),chosen[which[i]]]));const out=new Uint8Array(img.length);
 for(let y=0;y<h;y+=8)for(let x=0;x<w;x+=8)putTile(out,w,x,y,replacements.get(key(getTile(img,w,x,y))));return out;
}
function unique(px,w,h){const all=new Set();for(let y=0;y<h;y+=8)for(let x=0;x<w;x+=8)all.add(key(getTile(px,w,x,y)));return all.size;}
function background(source,rect,name,project=true,groundRows=0){
 const rel=`backgrounds/${name}`,info=meta.get(`gospel/assets/${rel}`),w=info.largura,h=info.altura;
 const bytes=raw(source,['-crop',rect,'+repage','-filter','box','-resize',`${w}x${h-groundRows}!`]);let px=indices(bytes,palette);let originalTiles;
 if(groundRows){const full=indices(original(rel),palette);full.set(px,0);px=full;}
 if(project){const r=projectTiles(indices(original(rel),palette),px,w,h);px=r.px;originalTiles=r.originalTiles;}
 px=capTiles(px,w,h);writePNG(path.join(root,'gospel/assets',rel),w,h,px,palette);
 report.push({file:rel,width:w,height:h,tiles:unique(px,w,h),originalTiles,mode:project?'reuso da grade de tiles original':'limite de 192 tiles'});
}
const bgGroups=JSON.parse(fs.readFileSync(path.join(root,'artes/grupos_fundos.json')));
for(let i=0;i<bgGroups.length;i++){
 const source=path.join(root,`artes/fontes/fundos-${i+1}.png`);const [sw,sh]=size(source);
 bgGroups[i].forEach((name,j)=>{const x=Math.round((j%2)*sw/2),y=Math.round(Math.floor(j/2)*sh/2),w=Math.round(sw/2),h=Math.round(sh/2);background(source,`${w}x${h}+${x}+${y}`,name,!name.startsWith('menu') && !['parallax.png','stars.png','stars_wide.png','leaving_earth.png'].includes(name));});
}
const ark=path.join(root,'artes/fontes/arca-panorama.png');
if(fs.existsSync(ark)){const [aw,ah]=size(ark);background(ark,`${aw}x${Math.round(ah*0.82)}+0+0`,'parallax.png',false,32);}
const ui=path.join(root,'artes/fontes/interface.png'),[uw,uh]=size(ui);
for(const [j,name]of [[0,'logo.png'],[1,'titlescreen.png'],[2,'menu.png']])background(ui,`${Math.round(uw/2)}x${Math.round(uh/2)}+${Math.round((j%2)*uw/2)}+${Math.round(Math.floor(j/2)*uh/2)}`,name,false);
const spGroups=JSON.parse(fs.readFileSync(path.join(root,'artes/grupos_sprites.json')));
for(let i=0;i<spGroups.length;i++){
 const source=path.join(root,`artes/fontes/sprites-${i+1}.png`),[sw,sh]=size(source);
 for(const e of spGroups[i]){
  const x=Math.round(e.x*sw/1024),y=Math.round(e.y*sh/512),rw=Math.round(e.rw*sw/1024),rh=Math.round(e.rh*sh/512);
  const bytes=raw(source,['-crop',`${rw}x${rh}+${x}+${y}`,'+repage','-filter','point','-resize',`${e.w}x${e.h}!`]);const px=indices(bytes,spritePalette);
  // Preservar as áreas não usadas pelo atlas original; caixas de tile referenciadas continuam editáveis.
  const md=JSON.parse(fs.readFileSync(path.join(root,`gospel/assets/sprites/${e.file}.gbsres`)));const mask=new Uint8Array(e.w*e.h);
  function mark(v){if(Array.isArray(v))return v.forEach(mark);if(v&&typeof v==='object'){if(Number.isFinite(v.sliceX)&&Number.isFinite(v.sliceY))for(let yy=v.sliceY;yy<Math.min(e.h,v.sliceY+16);yy++)for(let xx=v.sliceX;xx<Math.min(e.w,v.sliceX+8);xx++)mask[yy*e.w+xx]=1;Object.values(v).forEach(mark);}}
  mark(md);for(let j=0;j<px.length;j++)if(!mask[j])px[j]=0;
  writePNG(path.join(root,`gospel/assets/sprites/${e.file}`),e.w,e.h,px,spritePalette);
  report.push({file:`sprites/${e.file}`,width:e.w,height:e.h,inkColors:3,transparentKey:'#65ff00'});
 }
}

// Golias usa uma folha própria; os outros inimigos usam os obstáculos de lanças.
const spriteRoot=path.join(root,'gospel/assets/sprites');
fs.copyFileSync(path.join(spriteRoot,'space_mine.png'),path.join(spriteRoot,'golias.png'));
fs.copyFileSync(path.join(spriteRoot,'enemy_ship.png'),path.join(spriteRoot,'space_mine.png'));

report.push({file:'sprites/golias.png',width:64,height:32,inkColors:3,transparentKey:'#65ff00',exclusiveBoss:true});
const finalReport=[...new Map(report.map(row=>[row.file,row])).values()];
fs.writeFileSync(path.join(root,'artes/resultado_compilacao.json'),JSON.stringify(finalReport,null,2)+'\n');
console.log(`${finalReport.length} PNGs preparados; dimensões originais e paletas fixas.`);
