/** Preparação técnica da arte desenhada para a versão 2. */
import fs from'node:fs';import path from'node:path';import{execFileSync as exec}from'node:child_process';import{createHash}from'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),assets=path.join(root,'gospel/assets'),sources=path.join(root,'artes/v2/fontes');
const cfg=JSON.parse(fs.readFileSync(path.join(root,'artes/v2/config.json')));
const pal=[[224,248,207],[134,192,108],[48,104,80],[7,24,33]],sp=[[101,255,0],pal[0],pal[1],pal[3]];
function uid(s){const h=createHash('sha1').update('hf-v2-art/'+s).digest('hex');return`${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-8${h.slice(17,20)}-${h.slice(20,32)}`;}
function read(p,args=[]){return exec('magick',[p,...args,'-alpha','off','-depth','8','RGB:-'],{maxBuffer:64*1024*1024});}
function index(raw,palette){const out=new Uint8Array(raw.length/3);for(let i=0;i<out.length;i++){let min=Infinity;for(let j=0;j<palette.length;j++){const c=palette[j];const d=(raw[i*3]-c[0])**2+(raw[i*3+1]-c[1])**2+(raw[i*3+2]-c[2])**2;if(d<min){min=d;out[i]=j;}}}return out;}
function write(p,w,h,data,palette){const raw=Buffer.alloc(w*h*3);for(let i=0;i<data.length;i++)for(let c=0;c<3;c++)raw[i*3+c]=palette[data[i]][c];exec('magick',['-size',`${w}x${h}`,'-depth','8','RGB:-','-define','png:color-type=2',p],{input:raw});}
function tile(px,w,x,y){const t=new Uint8Array(64);for(let j=0;j<8;j++)t.set(px.subarray((y+j)*w+x,(y+j)*w+x+8),j*8);return t;}
function key(t){return Buffer.from(t).toString('base64');}
function distance(a,b){let n=0;for(let i=0;i<64;i++)n+=(a[i]-b[i])**2;return n;}
function cap(px,w,h,max){const unique=new Map();for(let y=0;y<h;y+=8)for(let x=0;x<w;x+=8){const t=tile(px,w,x,y),k=key(t);if(!unique.has(k))unique.set(k,{t,n:0});unique.get(k).n++;}const a=[...unique.values()].sort((a,b)=>b.n-a.n);if(a.length<=max)return px;
 const chosen=[a[0].t],best=new Float64Array(a.length).fill(Infinity),refs=new Uint16Array(a.length);
 for(let k=0;k<max;k++){let most=-1,pick=0;for(let i=0;i<a.length;i++){const d=distance(a[i].t,chosen[k]);if(d<best[i]){best[i]=d;refs[i]=k;}const score=best[i]*Math.sqrt(a[i].n);if(score>most){most=score;pick=i;}}if(k+1<max)chosen.push(a[pick].t);}
 const lookup=new Map(a.map((e,i)=>[key(e.t),chosen[refs[i]]]));const out=new Uint8Array(px.length);for(let y=0;y<h;y+=8)for(let x=0;x<w;x+=8){const t=lookup.get(key(tile(px,w,x,y)));for(let j=0;j<8;j++)out.set(t.subarray(j*8,j*8+8),(y+j)*w+x);}return out;
}
const manifest=[];
function bg(name,file,w,h,limit){const p=path.join(assets,'backgrounds',file);let px=index(read(path.join(sources,name+'.png'),['-filter','box','-resize',`${w}x${h}!`]),pal);if(file==='menu_page1.png')for(let y=26;y<103;y++)for(let x=12;x<32;x++)px[y*w+x]=0;px=cap(px,w,h,limit);write(p,w,h,px,pal);manifest.push({file:'backgrounds/'+file,width:w,height:h,maxTiles:limit,type:'background'});}
function nativePlaza(){
 const atlas=index(read(path.join(sources,'tileset.png'),['-filter','box','-resize','128x64!']),pal);
 const cells=Array(28*28).fill(2),cell=(x,y,t)=>{if(x>=0&&x<28&&y>=0&&y<28)cells[y*28+x]=t;};
 // Caminhos e praça são terreno, não imagens comprimidas por aproximação de tiles.
 for(let y=0;y<28;y++)for(let x=0;x<28;x++){
  if((x*7+y*11)%19===0)cell(x,y,0);
  if((x===5||x===23)&&y>=6&&y<=24)cell(x,y,1);
  if(y===14&&x>=5&&x<=23)cell(x,y,1);
  if((x===14)&&y>=4&&y<=25)cell(x,y,1);
  if(Math.hypot(x+.5-14,y+.5-14)<5.25)cell(x,y,1);
 }
 const houses=[{x:2,y:2,w:6,h:5,icon:24},{x:20,y:2,w:6,h:5,icon:25},{x:2,y:20,w:6,h:5,icon:26},{x:20,y:20,w:6,h:5,icon:27},{x:12,y:1,w:5,h:4,icon:28},{x:12,y:22,w:5,h:4,icon:29}];
 for(const b of houses){for(let y=0;y<b.h;y++)for(let x=0;x<b.w;x++){let t=15;if(y===0)t=x===0?8:x===b.w-1?9:4;else if(y===b.h-1)t=x===0?10:x===b.w-1?11:5;else if(x===0)t=6;else if(x===b.w-1)t=7;cell(b.x+x,b.y+y,t);}
 const mid=b.x+Math.floor(b.w/2);cell(mid,b.y+1,b.icon);cell(mid,b.y+b.h-1,12);cell(mid,b.y+b.h,13);}
 for(let y=11;y<=16;y++)for(let x=2;x<=7;x++)if(y===11||y===16)cell(x,y,16);else if(x===2||x===7)cell(x,y,17);
 cell(7,14,19);
 const trees=[[1,1],[8,1],[10,3],[18,1],[25,1],[1,9],[9,9],[18,9],[25,9],[1,18],[8,18],[20,18],[25,18],[1,25],[8,25],[18,25],[25,25]];
 for(const[x,y]of trees)if([0,2].includes(cells[y*28+x]))cell(x,y,20);
 const px=new Uint8Array(448*448);
 for(let y=0;y<28;y++)for(let x=0;x<28;x++){const id=cells[y*28+x],sx=(id%8)*16,sy=Math.floor(id/8)*16;for(let row=0;row<16;row++)px.set(atlas.subarray((sy+row)*128+sx,(sy+row)*128+sx+16),(y*16+row)*448+x*16);}
 write(path.join(assets,'backgrounds/sample_town.png'),448,448,px,pal);
 write(path.join(root,'artes/v2/tileset-128x64.png'),128,64,atlas,pal);
 fs.writeFileSync(path.join(root,'artes/v2/mapa_celulas16.json'),JSON.stringify(cells)+'\n');
 manifest.push({file:'backgrounds/sample_town.png',width:448,height:448,maxTiles:128,type:'background',nativeTileMap:true});
}

nativePlaza();bg('diario','menu_page1.png',160,144,112);bg('arena','vale_desafio.png',160,144,96);
function sprite(name,file,w,h,args=[]){const p=path.join(assets,'sprites',file);write(p,w,h,index(read(path.join(sources,name+'.png'),[...args,'-filter','point','-resize',`${w}x${h}!`]),sp),sp);manifest.push({file:'sprites/'+file,width:w,height:h,type:'sprite'});}
sprite('golias','golias.png',72,32);sprite('samuel','player_platform.png',96,32);
// A prancha de ícones tem uma faixa central e margem verde; recortar antes de reduzir.
const relic=path.join(sources,'reliquias.png'),[rw,rh]=exec('magick',['identify','-format','%w %h',relic],{encoding:'utf8'}).trim().split(' ').map(Number),pixels=read(relic);let y0=rh,y1=0;
for(let y=0;y<rh;y++)for(let x=0;x<rw;x++){const i=(y*rw+x)*3,r=pixels[i],g=pixels[i+1],b=pixels[i+2];if(!((g>220&&r<180&&b<45))){y0=Math.min(y0,y);y1=Math.max(y1,y);}}
sprite('reliquias','reliquias.png',128,16,['-crop',`${rw}x${y1-y0+5}+0+${Math.max(0,y0-2)}`,'+repage']);
function json(file,d){fs.writeFileSync(file,JSON.stringify(d,null,2)+'\n');}
let tileSeq=0;
function tiles(cellX,w,h,sy=0){const a=[];for(let y=0;y<h;y+=16)for(let x=0;x<w;x+=8)a.push({id:uid(`tile/${++tileSeq}/${cellX}/${w}/${h}/${sy}/${x}/${y}`),x,y,sliceX:cellX+x,sliceY:sy+y,flipX:false,flipY:false,palette:0,paletteIndex:0,objPalette:'OBP0',priority:false});return a;}
function sheet(id,name,file,w,h,canvasW,canvasH,frames,extra={}){return{_resourceType:'sprite',id,name,symbol:'sprite_hf_'+name.toLowerCase().replaceAll(' ','_'),states:[{id:uid('state/'+name),name:'',animationType:'fixed',flipLeft:false,animations:Array.from({length:8},(_,i)=>({id:uid(`anim/${name}/${i}`),frames:i===0?frames:[{id:uid(`empty/${name}/${i}`),tiles:[]}]}))}],numTiles:frames.reduce((n,f)=>n+f.tiles.length,0),canvasOriginX:0,canvasOriginY:0,canvasWidth:canvasW,canvasHeight:canvasH,boundsX:0,boundsY:0,boundsWidth:canvasW,boundsHeight:canvasH,animSpeed:15,filename:file,width:w,height:h,...extra};}
const bossFile=path.join(assets,'sprites/golias.png.gbsres'),bossOld=JSON.parse(fs.readFileSync(bossFile));
const bossFrames=[0,24,48].map((x,i)=>({id:uid('bossFrame'+i),tiles:tiles(x,24,32)}));
const bossMeta=sheet(bossOld.id,'Golias','golias.png',72,32,24,32,[bossFrames[0]],{boundsWidth:24,boundsHeight:28,boundsY:-8});
bossMeta.states=['','Preparar','Derrotado'].map((name,i)=>({id:uid('bossState/'+name),name,animationType:'fixed',flipLeft:false,animations:Array.from({length:8},(_,a)=>({id:uid('bossAnim/'+name+'/'+a),frames:a===0?[bossFrames[i]]:[{id:uid('bossEmpty/'+name+'/'+a),tiles:[]}]}))}));
bossMeta.numTiles=18;json(bossFile,bossMeta);
const platFile=path.join(assets,'sprites/player_platform.png.gbsres'),plat=JSON.parse(fs.readFileSync(platFile));
for(const state of plat.states){const hurt=state.name==='Hurt';for(let a=0;a<8;a++){const cells=a===0?[hurt?4:0]:a===2&&!hurt?[5]:a===4&&!hurt?[1,2]:a===6&&!hurt?[3]:[];state.animations[a].frames=cells.length?cells.map((cell,j)=>({id:uid(`platform/${state.id}/${a}/${j}`),tiles:tiles(cell*16,16,32)})):[{id:uid(`platformEmpty/${state.id}/${a}`),tiles:[]}];}}
Object.assign(plat,{width:96,height:32,numTiles:24});delete plat.checksum;json(platFile,plat);
json(path.join(assets,'sprites/reliquias.png.gbsres'),sheet(cfg.relicSprite,'Reliquias','reliquias.png',128,16,16,16,Array.from({length:8},(_,i)=>({id:uid('relicFrame'+i),tiles:tiles(i*16,16,16)}))));
// HUD e projéteis de uma única peça 8x16 reduzem a disputa por sprites na mesma linha.
fs.copyFileSync(path.join(assets,'sprites/hearts.png'),path.join(assets,'sprites/coracao_hud.png'));
const hudFrames=[0,8].map((x,i)=>({id:uid('hudFrame'+i),tiles:tiles(x,8,16)}));json(path.join(assets,'sprites/coracao_hud.png.gbsres'),sheet(cfg.hudSprite,'Coracao HUD','coracao_hud.png',16,16,8,16,hudFrames));manifest.push({file:'sprites/coracao_hud.png',width:16,height:16,type:'sprite'});
for(const [file,source,id,crop]of [['pedra.png','bullet.png',cfg.stoneSprite,false],['lanca.png','bullet_left.png',cfg.spearSprite,true]]){const args=crop?['-crop','16x16+0+0','+repage']:[];exec('magick',[path.join(assets,'sprites',source),...args,'-filter','point','-resize','8x8!','-background','#65ff00','-gravity','center','-extent','8x16',path.join(assets,'sprites',file)]);json(path.join(assets,'sprites',file+'.gbsres'),sheet(id,file==='pedra.png'?'Pedra':'Lanca',file,8,16,8,16,[{id:uid('projectileFrame/'+file),tiles:tiles(0,8,16)}],{boundsWidth:8,boundsHeight:8,boundsY:-4}));manifest.push({file:'sprites/'+file,width:8,height:16,type:'sprite'});}
json(path.join(assets,'backgrounds/vale_desafio.png.gbsres'),{_resourceType:'background',id:cfg.arenaBackground,name:'Vale do Desafio',symbol:'bg_hf_vale_desafio',tileColors:'',filename:'vale_desafio.png',width:20,height:18,imageWidth:160,imageHeight:144,autoColor:false});
json(path.join(root,'artes/v2/manifesto_assets.json'),manifest);
console.log(`Arte v2: ${manifest.length} PNGs preparados e metadados de quadros regulares atualizados.`);
