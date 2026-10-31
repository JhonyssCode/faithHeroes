"""Regressões dos bugs relatados e das mecânicas novas; não emula o GB Studio."""
import copy
import heapq
import itertools
import json
import math
import re
from collections import deque
from pathlib import Path
from recursos import ROOT, arquivos, textos
P=ROOT/'gospel/project'
def load(rel):return json.loads((P/rel).read_text())
def walk(value):
    if isinstance(value,dict):
        if 'command'in value:yield value
        for v in value.values():yield from walk(v)
    elif isinstance(value,list):
        for v in value:yield from walk(v)
def decompress(s):
    result=[];offset=0
    while offset<len(s):
        value=int(s[offset:offset+2],16);offset+=2
        if s[offset]=='!':count=1;offset+=1
        else:end=s.index('+',offset);count=int(s[offset:end],16);offset=end+1
        result.extend([value]*count)
    return result
class VM:
    def __init__(self,state=None):
        self.state=dict(state or{});self.time=0;self.queue=[];self.serial=0;self.trace=[];self.frames={};self.active={};self.positions={};self.inputs={};self.cooldowns={};self.scene=None;self.push_target=None;self.choice=0;self.saved={}
    def value(self,v):
        t=v['type']
        if t=='variable':return self.state.get(v['value'],0)
        if t=='number':return v['value']
        if t in('true','false'):return int(t=='true')
        a=self.value(v['valueA']);b=self.value(v['valueB'])
        return {'eq':lambda:a==b,'gte':lambda:a>=b,'gt':lambda:a>b,'lte':lambda:a<=b,'lt':lambda:a<b,'and':lambda:bool(a and b),'or':lambda:bool(a or b)}[t]()
    def events(self,script,actor,context):
        for e in script:
            if context['switched']:return
            cmd=e['command'];a=e.get('args',{});who=a.get('actorId',actor);who=actor if who=='$self$'else who
            if cmd=='EVENT_IF':
                branch='true'if self.value(a['condition'])else'false';yield from self.events(e['children'].get(branch,[]),actor,context)
            elif cmd=='EVENT_IF_ACTOR_AT_POSITION':
                branch='true'if self.positions.get(who)==(self.value(a['x']),self.value(a['y']))else'false';yield from self.events(e['children'].get(branch,[]),actor,context)
            elif cmd=='EVENT_SET_VALUE':self.state[a['variable']]=self.value(a['value'])
            elif cmd in('EVENT_INC_VALUE','EVENT_DEC_VALUE'):self.state[a['variable']]=self.state.get(a['variable'],0)+(1 if cmd=='EVENT_INC_VALUE'else-1)
            elif cmd=='EVENT_RESET_VARIABLES':self.state.clear()
            elif cmd=='EVENT_PEEK_DATA':self.state[a['variableDest']]=self.saved.get(a['variableSource'],0)
            elif cmd=='EVENT_LOAD_DATA':self.trace.append(('load',a['saveSlot']))
            elif cmd=='EVENT_WAIT':yield self.value(a['time'])
            elif cmd=='EVENT_TEXT':self.trace.append(('text',a['text']))
            elif cmd=='EVENT_SOUND_PLAY_EFFECT':self.trace.append(('sound',a.get('pitch')))
            elif cmd=='EVENT_ACTOR_SET_FRAME':self.frames[who]=self.value(a['frame'])
            elif cmd=='EVENT_ACTOR_ACTIVATE':self.active[who]=True
            elif cmd=='EVENT_ACTOR_DEACTIVATE':self.active[who]=False
            elif cmd=='EVENT_ACTOR_SET_POSITION':self.positions[who]=(self.value(a['x']),self.value(a['y']))
            elif cmd=='EVENT_ACTOR_GET_POSITION':self.state[a['vectorX']],self.state[a['vectorY']]=self.positions[who]
            elif cmd=='EVENT_ACTOR_MOVE_RELATIVE':
                x,y=self.positions.get(who,(0,0));self.positions[who]=(x+self.value(a['x']),y+self.value(a['y']))
            elif cmd=='EVENT_ACTOR_PUSH':self.positions[actor]=self.push_target
            elif cmd=='EVENT_SET_INPUT_SCRIPT':
                for button in a['input']:self.inputs[button]=e.get('children',{}).get('true',[])
            elif cmd=='EVENT_REMOVE_INPUT_SCRIPT':
                for button in a['input']:self.inputs.pop(button,None)
            elif cmd=='EVENT_RATE_LIMIT':
                key=a['variable']
                if self.time>=self.cooldowns.get(key,0):
                    self.cooldowns[key]=self.time+self.value(a['time']);yield from self.events(e['children']['true'],actor,context)
            elif cmd=='EVENT_CHOICE':self.state[a['variable']]=self.choice
            elif cmd=='EVENT_LAUNCH_PROJECTILE':self.trace.append(('projectile',copy.deepcopy(a)))
            elif cmd=='EVENT_SWITCH_SCENE':self.scene=a['sceneId'];self.trace.append(('scene',a['sceneId'],self.value(a['x']),self.value(a['y'])));context['switched']=True
            elif cmd in('EVENT_MUSIC_PLAY','EVENT_MUSIC_STOP','EVENT_ACTOR_SET_STATE','EVENT_ACTOR_COLLISIONS_DISABLE','EVENT_ACTOR_STOP_UPDATE','EVENT_AWAIT_INPUT','EVENT_ACTOR_SET_DIRECTION','EVENT_ACTOR_EMOTE'):pass
            else:raise AssertionError('Evento não modelado: '+cmd)
    def resume(self,gen):
        try:
            delay=next(gen);self.serial+=1;heapq.heappush(self.queue,(self.time+delay,self.serial,gen))
        except StopIteration:pass
    def invoke(self,script,actor='player'):
        self.resume(self.events(script,actor,{'switched':False}))
    def advance(self,duration=1):
        target=self.time+duration
        while self.queue and self.queue[0][0]<=target:
            when,_,gen=heapq.heappop(self.queue);self.time=when;self.resume(gen)
        self.time=target

def main():
    cfg=json.loads((ROOT/'artes/v2/config.json').read_text());resources=[(p,json.loads(p.read_text()))for p in arquivos()]
    scenes={d['id']:d for p,d in resources if d.get('_resourceType')=='scene'}
    assert len(scenes)==18
    assert not load('scenes/path/parallax_example/scene.gbsres').get('parallax'), 'A arte da Arca deve rolar como uma única imagem'
    variables={v['id']for v in load('variables.gbsres')['variables']}
    music={d['id']:d for p,d in resources if d.get('_resourceType')=='music'}
    for p,d in resources:
        ids=[e['id']for e in walk(d)];assert len(ids)==len(set(ids)),p
        if d.get('filename'):assert (p.parent/d['filename']).exists(),('asset ausente',p,d['filename'])
        for msg in textos(d):assert len(msg.split('\n'))<=3 and all(len(line)<=18 for line in msg.split('\n')),(p,msg)
        for e in walk(d):
            a=e.get('args',{});assert not e['command'].startswith('EVENT_REPLACE_TILE'),p;assert e['command']!='EVENT_CAMERA_SHAKE',p
            if e['command']=='EVENT_SWITCH_SCENE':
                dest=scenes[a['sceneId']];assert 0<=a['x']['value']<dest['width'] and 0<=a['y']['value']<dest['height'],p
            if e['command']=='EVENT_MUSIC_PLAY':assert music[a['musicId']]['filename'].startswith('HF_'),p
        if d.get('_resourceType')=='scene'and d.get('collisions'):
            assert len(decompress(d['collisions']))==d['width']*d['height'],p
    for folder in(P/'scenes').rglob('actors'):assert len(list(folder.glob('*.gbsres')))<=20,folder
    print(f'Estrutura: {len(resources)} recursos, 18 cenas; textos, destinos, colisões e limites de atores válidos.')
    # Novo jogo limpa também locais e recebe assinatura; save incompatível não é carregado.
    title=load('scenes/ui/title_screen/scene.gbsres')
    newgame=next(e for e in walk(title)if e['command']=='EVENT_IF'and e['args'].get('variable')=='L0')['children']['true']
    vm=VM({v:1 for v in variables});vm.state['npc__L0']=99;vm.invoke(newgame)
    assert vm.state=={'34':31415} and vm.scene==load('scenes/players_house/scene.gbsres')['id']
    continue_script=next(e for e in walk(title)if e['command']=='EVENT_IF_SAVED_DATA')['children']['true']
    for signature in(0,1,31415):
        vm=VM();vm.saved={'34':signature};vm.invoke(continue_script);assert any(t[0]=='load'for t in vm.trace)==(signature==31415)
    print('Reinício/save: variáveis locais zeradas; assinatura nova aceita, saves antigos rejeitados sem apagar dados.')
    # Praca: testar com a largura real de colisão 16x8 do personagem.
    hub=load('scenes/town/sample_town/scene.gbsres');grid=decompress(hub['collisions']);layout=json.loads((ROOT/'artes/v2/layout_praca.json').read_text())
    assert grid==json.loads((ROOT/'artes/v2/colisoes_praca.json').read_text())
    def free(x,y):return 0<=x<55 and 0<=y<56 and not(grid[y*56+x]&15 or grid[y*56+x+1]&15)
    start=tuple(layout['spawn']);assert free(*start);seen={start};queue=deque([start])
    while queue:
        x,y=queue.popleft()
        for p in[(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
            if p not in seen and free(*p):seen.add(p);queue.append(p)
    for b in layout['buildings']:assert tuple(b['door'])in seen,('porta inacessível',b)
    for name in('sheep','pastor'):assert tuple(layout[name])in seen,name
    for xy in layout['relics']:assert tuple(xy)in seen,xy
    active=[json.loads(p.read_text())for p in(P/'scenes/town/sample_town/triggers').glob('*.gbsres')if json.loads(p.read_text())['script']]
    assert len(active)==6
    for p,d in resources:
        for e in walk(d):
            if e['command']=='EVENT_SWITCH_SCENE'and e['args']['sceneId']==hub['id']:
                x=e['args']['x']['value'];y=e['args']['y']['value'];assert free(x,y),(p,'retorno bloqueado')
                assert not any(t['x']<=x<t['x']+t['width'] and t['y']<=y<t['y']+t['height']for t in active),(p,'retorno dentro de portal')
    print('Praça: seis portas, ovelha, pastor e quatro marcos alcançáveis; retornos fora dos portais.')
    # Portão final continua exigindo todos os objetivos; diário acompanha as 16 combinações.
    gate=load('scenes/town/sample_town/triggers/trigger_8.gbsres')['script'];final=load('scenes/town/top_house/scene.gbsres')['id']
    for bits in itertools.product((0,1),repeat=4):
        state=dict(zip(map(str,range(4)),bits));vm=VM(state);vm.invoke(gate);assert(vm.scene==final)==all(bits)
        for i,got in enumerate(bits):
            actor=load(f'scenes/ui/menu/menu_page_1/actors/quest{i+1}.gbsres');ui=VM(state);ui.frames[actor['id']]=0;ui.invoke(actor['startScript'],actor['id']);assert ui.frames[actor['id']]==got
    ending=load('scenes/town/top_house/scene.gbsres')['script'][-1:]
    for bits in itertools.product((0,1),repeat=4):
        vm=VM(dict(zip(map(str,range(4)),bits)));vm.invoke(ending);assert any('Obrigado'in str(t)for t in vm.trace)==all(bits)
        if all(bits):
            before=len(vm.trace);vm.invoke(ending);assert len(vm.trace)==before
    print('Relíquias/diário/final: portão, quatro indicadores e mensagem final corretos nas 16 combinações; final não repete.')
    # Cuidado e Promessa: matar os ratos não substitui resgatar pares.
    owner=load('scenes/town/sample_town/actors/pet_owner.gbsres')
    for found in(0,1):
        vm=VM({'13':found});vm.invoke(owner['script']);vm.advance();assert vm.state.get('0',0)==found
    noe=load('scenes/path/path_to_sample_town/actors/gardener.gbsres')
    for bits in itertools.product((0,1),repeat=3):
        vm=VM({'12':0,**dict(zip(cfg['variables']['pairs'],bits))});vm.invoke(noe['script']);vm.advance();assert vm.state.get('1',0)==all(bits)
    pair=load('scenes/path/path_to_sample_town/actors/par_0_0.gbsres');vm=VM();vm.invoke(pair['script'],pair['id']);vm.advance();first=len(vm.trace);vm.invoke(pair['script'],pair['id']);vm.advance();assert len(vm.trace)==first and vm.state['20']==1 and vm.state['38']==1
    print('Resgate: ovelha/pastor e oito combinações dos pares; ratos não concedem a relíquia; coleta não duplica.')
    # Cova: não reposicionar bloco depois de resolvido; cancelamento não o move.
    sign=load('scenes/caves/underground/actors/sign_post.gbsres');puzzle=cfg['puzzle'];block=load('scenes/caves/underground/actors/ice_block.gbsres')['id']
    for solved,choice in itertools.product((0,1),repeat=2):
        vm=VM({puzzle:solved});vm.choice=choice;vm.positions[block]=(15,10);vm.invoke(sign['script']);assert vm.positions[block]==((24,18)if not solved and choice else(15,10))
    chest=load('scenes/caves/deeper_underground/actors/chest.gbsres');vm=VM();vm.invoke(chest['script']);vm.advance();assert vm.state['3']==1;before=len(vm.trace);vm.invoke(chest['script']);vm.advance();assert not any('Fé renovada'in str(t)for t in vm.trace[before:])
    block_actor=load('scenes/caves/underground/actors/ice_block.gbsres');vm=VM({puzzle:0});vm.positions[block]=(24,18);vm.push_target=(22,18);vm.invoke(block_actor['script'],block);assert (vm.state['35'],vm.state['36'])==(22,18)
    resumed=VM(vm.state);resumed.positions[block]=(24,18);resumed.invoke(load('scenes/caves/underground/scene.gbsres')['script'][-1:]);assert resumed.positions[block]==(22,18)
    print('Cova: solução persistente, reset por confirmação, posição preservada ao abrir diário e baú sem duplicação.')
    # Usar o registro A real e o grupo do projétil real para escolher o handler de dano.
    arena=load('scenes/space/vale_desafio/scene.gbsres');boss=load('scenes/space/vale_desafio/actors/golias.gbsres');hp=cfg['variables']['bossHP'];ready=cfg['variables']['ready']
    vm=VM();vm.invoke(arena['script']);vm.advance();assert vm.state[hp]==5 and vm.state['18']==3 and vm.state[ready]==1 and 'a'in vm.inputs
    assert boss['collisionGroup']=='3'
    for hit in range(1,6):
        before_shots=sum(t[0]=='projectile'for t in vm.trace);vm.invoke(vm.inputs['a']);assert sum(t[0]=='projectile'for t in vm.trace)==before_shots+1;shot=next(t[1]for t in reversed(vm.trace)if t[0]=='projectile');assert boss['collisionGroup']in shot['collisionMask']
        # Mapeamento oficial GB Studio: grupo 1 -> hit1, 2 -> hit2, 3 -> hit3.
        handler=boss[f"hit{shot['collisionGroup']}Script"];assert handler
        vm.invoke(handler,boss['id']);assert vm.state[hp]==5-hit;vm.advance(.4)
    assert vm.state['2']==1 and vm.scene==load('scenes/space/deep_space/scene.gbsres')['id']
    assert not any(e['command']=='EVENT_SET_VALUE'and e['args'].get('variable')==hp for e in walk(boss['updateScript']))
    before=vm.state[hp];vm.invoke(boss['hit2Script'],boss['id']);vm.advance();assert vm.state[hp]==before
    assert vm.state['39']==1
    # Coletar fora da ordem ainda mostra a quantidade correta, sem confundir o índice da missão.
    free=VM({'13':1,'20':1,'21':1,'22':1});free.invoke(chest['script']);free.advance();free.invoke(owner['script']);free.advance();free.invoke(noe['script']);free.advance();assert free.state['39']==3
    free.invoke(arena['script']);free.advance()
    for _ in range(5):free.invoke(boss['hit2Script'],boss['id']);free.advance(.4)
    assert free.state['39']==4
    free.invoke(chest['script']);free.advance();free.invoke(noe['script']);free.advance();assert free.state['39']==4
    print('Golias: cinco disparos registrados pelo grupo real causam cinco danos e vitória; vida não reinicia. Contagem 1–4 funciona fora da ordem.')
    # Proteção contra contato repetido e retry no mesmo duelo.
    vm=VM();vm.invoke(arena['script']);vm.advance();damage=arena['playerHit1Script'];vm.invoke(damage);assert vm.state['18']==2;vm.invoke(damage);assert vm.state['18']==2
    vm.advance(.6);vm.invoke(damage);assert vm.state['18']==1;vm.advance(.6);vm.invoke(damage);assert vm.state['18']==0;vm.advance();assert vm.scene==arena['id']
    paused=VM();paused.invoke(arena['script']);paused.advance();paused.choice=0;paused.invoke(paused.inputs['b']);assert paused.state[ready]==1
    paused.choice=1;paused.invoke(paused.inputs['b']);assert paused.scene==hub['id']
    print('Duelo: invulnerabilidade bloqueia impactos repetidos; derrota reinicia a arena; pausa permite voltar à praça.')
    # Não há o antigo chefe ativo ou prêmio adiantado no rádio/sábio.
    legacy=load(cfg['originalBoss']);assert not legacy['hit1Script'] and not legacy['updateScript']
    expected={'0':'scenes/town/sample_town/actors/pet_owner.gbsres','1':'scenes/path/path_to_sample_town/actors/gardener.gbsres','2':'scenes/space/vale_desafio/actors/golias.gbsres','3':'scenes/caves/deeper_underground/actors/chest.gbsres'}
    for p,d in resources:
        for e in walk(d):
            a=e.get('args',{})
            if e['command']=='EVENT_SET_VALUE'and a.get('variable')in expected and a.get('value',{}).get('type')=='true':assert p.relative_to(P).as_posix()==expected[a['variable']],p
    print('PASSOU — regressões de arquivos e simulação de eventos; não é teste de ROM/emulador.')
if __name__=='__main__':main()
