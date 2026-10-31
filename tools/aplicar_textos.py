"""Substituições exatas da Etapa 1; preserva a formatação dos recursos."""
import json
from recursos import ROOT

MAPA = {'No Save Data\nFound...': 'Nenhum jogo\nsalvo...', 'Still the best\ncontroller.': 'Meu cajado de\npastor. Me guiou\npor muito chão.', 'My trusty\nGame Box 128.': 'Minha harpa\nvelha...', 'Nice poster!': 'Um mapa antigo da\nTerra Prometida.', 'My TV.': 'Minha janela.', 'It has a VHS\nplayer built in!': 'Dá para ver o\ntemplo ao longe.', 'Such a nice day to\ngo into town!': 'Que dia lindo\npara ir à vila!', 'Clothes...': 'Túnicas...', 'More clothes...': 'Mais túnicas...', 'Even more\nclothes...': 'Ainda mais\ntúnicas...', 'My collection\nof games...': 'Meus rolos de\nescrituras...', 'Check out\ngbstudio.dev/docs': 'Tua palavra é luz\npara o meu\ncaminho. Sl 119:105', 'Have you seen my\ncat anywhere?': 'Perdi uma das\nminhas cem\novelhas!', "He's by the\nNorthern house?\nThank you!": 'Ela está perto da\ncasa do norte?\nObrigado!', 'Meow!': 'Mééé!', 'I guess it was a\nmisunderstanding.': 'Achei que você\nfosse ladrão.\nDesculpe!', 'What is that guy\nlooking at?': 'Aquele homem\nestá olhando o quê?', 'Check out this\nsweet duck!': 'Olha aquela ave!\nDeus cuida delas.', 'Oh you got me!': 'Você me achou!\nSó queria ver\nde longe.', "Sample Town Lake.\nDON'T FEED\nTHE DUCKS!": 'Vila de Belém.\nPortais: Arca,\nVale e Cova.', 'HEY!!!\nKEEP OFF MY\nFLOWERS!': 'EI!!!\nSAIA DA\nMINHA HORTA!', 'Locked...': 'Selado. Reúna 4\nfragmentos.'}

for old, new in MAPA.items():
    a, b = json.dumps(old, ensure_ascii=False), json.dumps(new, ensure_ascii=False)
    found = []
    for path in sorted((ROOT / 'gospel/project').rglob('*.gbsres')):
        if not any(part in path.parts for part in ('players_house', 'sample_town', 'title_screen')):
            continue
        raw = path.read_text(encoding='utf-8')
        count = raw.count(a)
        if count:
            found.append(f'{path.relative_to(ROOT)} ({count} ocorrência(s))')
            path.write_text(raw.replace(a, b), encoding='utf-8')
    print(f'{old!r}: ' + ('; '.join(found) if found else 'NÃO ENCONTRADO'))
