from recursos import inventario

count = 0
for path, scene, name, text in inventario():
    lines = text.split('\n')
    issues = [f'linha {i}: {len(line)} caracteres' for i, line in enumerate(lines, 1) if len(line) > 18]
    if len(lines) > 3:
        issues.append(f'{len(lines)} linhas na caixa')
    if issues:
        count += 1
        print(f'{path} | {scene} | {name}: {", ".join(issues)} | {text!r}')
print(f'{count} caixas com avisos; nenhuma alteração aplicada.')
