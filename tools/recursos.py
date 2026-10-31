"""Leitura dos recursos sem alterar o projeto original."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def arquivos():
    return sorted((ROOT / 'gospel').rglob('*.gbsres')) + [ROOT / 'gospel/gospel.gbsproj']

def textos(obj):
    if isinstance(obj, dict):
        if obj.get('command') == 'EVENT_TEXT':
            value = (obj.get('args') or {}).get('text')
            for text in value if isinstance(value, list) else [value]:
                if isinstance(text, str):
                    yield text
        for value in obj.values():
            yield from textos(value)
    elif isinstance(obj, list):
        for value in obj:
            yield from textos(value)

def inventario():
    for path in sorted((ROOT / 'gospel/project').rglob('*.gbsres')):
        data = json.loads(path.read_text(encoding='utf-8'))
        scene_file = next((p / 'scene.gbsres' for p in path.parents if (p / 'scene.gbsres').is_file()), None)
        scene = json.loads(scene_file.read_text(encoding='utf-8')).get('name', '') if scene_file else 'Script global'
        for text in textos(data):
            yield path.relative_to(ROOT).as_posix(), scene, data.get('name', path.stem), text
