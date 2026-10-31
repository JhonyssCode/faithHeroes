from recursos import ROOT, inventario

rows = list(inventario())
if not rows:
    raise SystemExit('Nenhum texto encontrado.')
lines = ['# Inventário de textos — estado atual', '', 'Arquivo, cena, objeto e texto original. Quebras de linha aparecem como `\\n`.', '']
for path, scene, name, text in rows:
    lines.append(f'- Arquivo: `{path}` | Cena: {scene!r} | Objeto: {name!r} | Texto: {text!r}')
(ROOT / 'docs').mkdir(exist_ok=True)
(ROOT / 'docs/inventario_textos.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
print(f'{len(rows)} caixas de texto inventariadas.')
