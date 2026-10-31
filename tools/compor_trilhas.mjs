/** Composições originais desta adaptação, formato hUGE/UGE6. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import{createHash}from'node:crypto';
import{Song}from'./vendor/gbstudio/Song.mjs';import{PatternCell}from'./vendor/gbstudio/PatternCell.mjs';import{SubPatternCell}from'./vendor/gbstudio/SubPatternCell.mjs';import{saveUGESong,loadUGESong}from'./vendor/gbstudio/ugeHelper.mjs';
const root=path.resolve(import.meta.dirname,'..'),music=path.join(root,'gospel/assets/music');
function uuid(s){let h=createHash('sha1').update('hf/v2/music/'+s).digest('hex').slice(0,32);return`${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-8${h.slice(17,20)}-${h.slice(20)}`;}
const spec=[
 {key:'Praca',name:'Praca das Reliquias',display:'Praça das Relíquias',ticks:6,roots:[12,9,5,7],melody:[24,28,31,33,31,28,26,24,28,31,36,35,33,31,28,26]},
 {key:'Arca',name:'Dois a Dois',display:'Dois a Dois',ticks:5,roots:[5,0,2,7],melody:[29,33,36,33,31,29,26,24,29,31,33,36,38,36,33,31]},
 {key:'Cova',name:'No Silencio',display:'No Silêncio',ticks:8,roots:[2,10,5,0],melody:[26,29,33,31,29,26,24,22,26,29,36,33,31,29,26,26]},
 {key:'Coragem',name:'Cinco Pedras',display:'Cinco Pedras',ticks:4,roots:[2,0,7,2],melody:[26,26,33,31,29,26,24,26,33,33,36,38,36,33,31,26]},
 {key:'Rolo',name:'Memoria da Fe',display:'Memória da Fé',ticks:8,roots:[5,9,0,7],melody:[29,33,36,41,40,36,33,31,29,31,33,36,38,36,33,29]},
];
function instrument(name,type){return{name,length:null,initial_volume:type===2?3:8,volume_sweep_change:type===2?7:2,frequency_sweep_time:0,frequency_sweep_shift:0,duty_cycle:type===0?1:2,volume:1,wave_index:0,bit_count:15,subpattern_enabled:false,subpattern:Array.from({length:64},()=>new SubPatternCell())};}
function note(p,row,ch,n,i=0){const c=p[row][ch];c.note=n;c.instrument=i;}
const output=[];
for(const s of spec){
 const song=new Song();Object.assign(song,{name:s.name,artist:'Herois da Fe',comment:'Composicao original para a adaptacao; nao derivada das melodias do modelo.',ticks_per_row:s.ticks});
 song.duty_instruments=Array.from({length:15},(_,i)=>({...instrument(i===0?'Harpa':'Eco',0),initial_volume:i===0?8:4,duty_cycle:i===0?1:2}));
 song.wave_instruments=Array.from({length:15},()=>instrument('Baixo',1));song.noise_instruments=Array.from({length:15},()=>instrument('Passos',2));
 song.waves=Array.from({length:16},()=>Uint8Array.from(Array.from({length:32},(_,i)=>Math.round(i<16?i:31-i))));
 for(let k=0;k<4;k++){
  const p=Array.from({length:64},()=>Array.from({length:4},()=>new PatternCell()));
  for(let row=0;row<64;row+=4){const n=s.melody[(row/4+k*4)%s.melody.length];note(p,row,0,n);if(s.key!=='Cova'||row%8===0)note(p,row+2,1,n-12,1);}
  for(let bar=0;bar<4;bar++){const bass=s.roots[(bar+k)%4];for(let r=0;r<16;r+=8)note(p,bar*16+r,2,bass,0);if(!['Cova','Rolo'].includes(s.key))for(let r=0;r<16;r+=8)note(p,bar*16+r+4,3,24,0);}
  song.patterns.push(p);song.sequence.push(k);
 }
 const bytes=Buffer.from(saveUGESong(song)),filename='HF_'+s.key+'.uge';fs.writeFileSync(path.join(music,filename),bytes);
 const round=loadUGESong(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));assert.equal(round.name,song.name);assert.equal(round.sequence.length,4);assert(round.patterns.length>0);
 let events=0;for(const p of round.patterns)for(const row of p)for(const c of row)if(c.note!==null){assert(c.note>=0&&c.note<72);events++;}assert(events>=60);
 const id=uuid(s.key);fs.writeFileSync(path.join(music,filename+'.gbsres'),JSON.stringify({_resourceType:'music',id,name:s.display,symbol:'song_hf_'+s.key.toLowerCase(),settings:{},filename,type:'uge'},null,2)+'\n');
 output.push({key:s.key,id,name:s.display,file:filename,notes:events,sequence:round.sequence.length,seconds:64*4*s.ticks/60});
}
fs.mkdirSync(path.join(root,'artes/v2/audio'),{recursive:true});fs.writeFileSync(path.join(root,'artes/v2/audio/trilhas.json'),JSON.stringify(output,null,2)+'\n');
console.log(`${output.length} trilhas UGE6 gravadas e relidas pelo parser oficial do GB Studio 4.2.0.`);
