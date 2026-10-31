import json
from recursos import arquivos

paths = arquivos()
if len(paths) < 2:
    raise SystemExit('Projeto ausente ou sem recursos.')
bad = 0
for path in paths:
    try:
        json.loads(path.read_text(encoding='utf-8'))
    except (ValueError, OSError) as error:
        bad += 1
        print(f'INVÁLIDO: {path}: {error}')
print(f'{len(paths)} arquivos verificados; {bad} erros.')
raise SystemExit(bool(bad))
