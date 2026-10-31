"""Verificação estrutural e simulação da progressão; não substitui o GB Studio."""
import itertools
import json
from recursos import ROOT, arquivos, textos

P = ROOT / 'gospel/project'
def load(name):
    return json.loads((P / name).read_text(encoding='utf-8'))
def walk(value):
    if isinstance(value, dict):
        if 'command' in value:
            yield value
        for child in value.values():
            yield from walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk(child)

# Valida todos os recursos, textos, UUIDs de evento e destinos de cena.
data = [(p, json.loads(p.read_text(encoding='utf-8'))) for p in arquivos()]
scenes = {d['id']: d for p, d in data if d.get('_resourceType') == 'scene'}
for path, resource in data:
    ids = [e['id'] for e in walk(resource)]
    assert len(ids) == len(set(ids)), f'Eventos duplicados: {path}'
    for message in textos(resource):
        assert len(message.split('\n')) <= 3, (path, message)
        assert all(len(line) <= 18 for line in message.split('\n')), (path, message)
    for e in walk(resource):
        if e['command'] == 'EVENT_SWITCH_SCENE':
            a = e['args']; target = scenes[a['sceneId']]
            assert 0 <= a['x']['value'] < target['width'], (path, a)
            assert 0 <= a['y']['value'] < target['height'], (path, a)
        if e['command'] == 'EVENT_CHOICE':
            assert max(len(e['args'][k]) for k in ('trueText', 'falseText')) <= 18
print(f'Estrutura: {len(data)} JSONs; {len(scenes)} cenas; textos e destinos válidos.')

# Interpretador restrito para os eventos de progressão que foram inseridos.
def value(x, state):
    if x['type'] == 'variable': return state.get(x['value'], 0)
    if x['type'] == 'true': return 1
    if x['type'] == 'false': return 0
    if x['type'] == 'number': return x['value']
    if x['type'] == 'eq': return value(x['valueA'], state) == value(x['valueB'], state)
    raise AssertionError(x)

def run(script, state, trace):
    for e in script:
        command, a = e['command'], e.get('args', {})
        if command == 'EVENT_IF':
            branch = 'true' if value(a['condition'], state) else 'false'
            run(e.get('children', {}).get(branch, []), state, trace)
        elif command == 'EVENT_SET_VALUE': state[a['variable']] = value(a['value'], state)
        elif command == 'EVENT_INC_VALUE': state[a['variable']] = state.get(a['variable'], 0) + 1
        elif command == 'EVENT_TEXT': trace.append(('text', a['text']))
        elif command == 'EVENT_SWITCH_SCENE':
            trace.append(('scene', a['sceneId'])); return
        elif command in {'EVENT_ACTOR_MOVE_RELATIVE', 'EVENT_ACTOR_SET_STATE', 'EVENT_ACTOR_EMOTE', 'EVENT_ACTOR_COLLISIONS_DISABLE', 'EVENT_ACTOR_STOP_UPDATE', 'EVENT_ACTOR_DEACTIVATE', 'EVENT_ACTOR_SET_DIRECTION'}: pass
        else: raise AssertionError(f'Evento não simulado: {command}')

final_id = load('scenes/town/top_house/scene.gbsres')['id']
for bits in itertools.product((0, 1), repeat=4):
    state = dict(zip(map(str, range(4)), bits))
    for path in ['scenes/town/sample_town/triggers/trigger_8.gbsres', 'scenes/town/sample_town/triggers/trigger_3.gbsres']:
        trace = []; run(load(path)['script'], state.copy(), trace)
        assert (('scene', final_id) in trace) == all(bits), (bits, path)
print('Portões: 32 combinações verificadas; ambos exigem os quatro fragmentos.')

# Apenas as missões corretas podem conceder os quatro fragmentos.
expected = {'0':'scenes/town/sample_town/actors/pet_owner.gbsres', '1':'scenes/path/path_to_sample_town/actors/gardener.gbsres', '2':'scenes/space/space_battle/actors/golias.gbsres', '3':'scenes/caves/deeper_underground/actors/chest.gbsres'}
for path, d in data:
    for e in walk(d):
        a = e.get('args', {})
        if e['command'] == 'EVENT_SET_VALUE' and a.get('variable') in expected and a.get('value', {}).get('type') == 'true':
            assert path.relative_to(P).as_posix() == expected[a['variable']], path

pet = load(expected['0'])['script'][:2]
for found in (0, 1):
    state = {'13':found}; trace = []; run(pet, state, trace)
    assert state.get('0', 0) == found
    if found:
        trace = []; run(pet, state, trace)
        assert not any('Fragmento 1/4' in str(t) for t in trace)
ark = load(expected['1'])['script'][:2]
for remaining in range(4):
    state = {'12':remaining}; trace = []; run(ark, state, trace)
    assert state.get('1', 0) == (remaining == 0)
boss = load(expected['2'])['hit1Script']; state = {}; trace = []
for hit in range(1, 6):
    run(boss, state, trace)
    assert state.get('2', 0) == (hit == 5)
chest = load(expected['3'])['script']; state = {}; trace = []
run(chest, state, trace); assert state['3'] == 1
trace = []; run(chest, state, trace)
assert not any('Fragmento 4/4' in str(t) for t in trace)
print('Recompensas: ovelha, 0–3 obstáculos, cinco impactos e baú sem duplicação verificados.')

ending = load('scenes/town/top_house/scene.gbsres')['script'][-1:]
for bits in itertools.product((0, 1), repeat=4):
    state = dict(zip(map(str, range(4)), bits)); trace = []; run(ending, state, trace)
    assert any('Obrigado' in str(t) for t in trace) == all(bits)
    if all(bits):
        trace = []; run(ending, state, trace)
        assert not trace
print('Final: 16 combinações verificadas; mensagem exibida uma vez com os quatro fragmentos.')
print('PASSOU — simulação estática; ROM e jogabilidade não executadas.')
