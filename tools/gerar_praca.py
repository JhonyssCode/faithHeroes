"""Compila as colisões da praça a partir da planta e dos tiles nativos."""
import json
import re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def compress(values):
    output=[];last=None;count=0
    for value in values+[None]:
        if value!=last and count:
            output.append(f'{last:02x}'+('!' if count==1 else f'{count:x}+'));count=0
        if value is not None:last=value;count+=1
    return ''.join(output)
def generate():
    layout=json.loads((ROOT/'artes/v2/layout_praca.json').read_text())
    cells=json.loads((ROOT/'artes/v2/mapa_celulas16.json').read_text())
    grid=[0]*(56*56)
    def block(x,y,w,h):
        for yy in range(y,y+h):
            for xx in range(x,x+w):grid[yy*56+xx]=15
    block(0,0,56,1);block(0,55,56,1);block(0,0,1,56);block(55,0,1,56)
    for b in layout['buildings']:
        x,y,w,h=b['rect'];block(x,y,w,h);dx,_=b['door']
        for yy in [y+h-2,y+h-1]:
            for xx in [dx,dx+1]:grid[yy*56+xx]=0
    x,y,w,h=layout['pen']
    block(x,y,w,2);block(x,y+h-2,w,2);block(x,y,2,h);block(x+w-2,y,2,h)
    for yy in [28,29]:
        for xx in [14,15]:grid[yy*56+xx]=0
    for i,tile in enumerate(cells):
        if tile==20:block((i%28)*2,(i//28)*2,2,2)
    path=ROOT/'gospel/project/scenes/town/sample_town/scene.gbsres'
    raw=path.read_text();raw=re.sub(r'"collisions": "[^"]*"','"collisions": '+json.dumps(compress(grid)),raw);path.write_text(raw)
    (ROOT/'artes/v2/colisoes_praca.json').write_text(json.dumps(grid)+'\n')
    print('Colisões da praça compiladas: edifícios, portas, cercado e árvores.')
if __name__=='__main__':generate()
