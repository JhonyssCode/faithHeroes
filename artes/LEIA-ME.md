# Arte integrada — HERÓIS DA FÉ

**Versão atual:** consulte `../docs/versao2.md`. O mapa da praça, a arena, o diário, Samuel e Golias foram revisados na versão 2. A praça agora é uma montagem nativa de tiles, sem aproximação destrutiva. O conteúdo abaixo registra a primeira entrega visual e suas fontes.

## Arquivos do jogo

Os PNGs prontos estão em `gospel/assets/`. Foram redesenhados 19 fundos e 42 folhas de sprites do modelo, mais uma folha exclusiva nova para Golias: **62 PNGs de jogo** ao todo.

- Logo, título, diário e casas em português, com pergaminhos e arquitetura antiga.
- Vila de Belém, templo, cova, câmara, caminho da Arca e ambientes da batalha.
- Samuel em exploração, plataforma e com funda; Noé, anjo, moradores, ovelha, leão e soldado.
- Golias separado dos obstáculos, lanças, pedras, ratos, animais e efeitos de poeira.
- Harpa, tamborim, shofar, altares, portais, baú, placas, marcos e indicadores.

As fontes com acentos, emotes, moldura de diálogo, avatar de aviso, tilesets animados e fundo preto funcional foram preservados por já servirem à linguagem visual e à leitura do jogo. Áudio não foi alterado.

## Fontes de arte e reprodução

- `conceitos/`: título inicial e prancha dos personagens; são referências, não sprites para importar diretamente.
- `fontes/`: pranchas de arte geradas usadas na preparação dos arquivos.
- `referencias/`: composição dos ativos originais usada como guia de geometria e paleta.
- `modelo-png-original.zip`: cópia dos PNGs anteriores para comparação/restauração.
- `inventario_assets.json`: dimensões e IDs originais.
- `resultado_compilacao.json`: limites e tratamento dos PNGs finais.
- `referencias-integridade.json`: integridade dos metadados e colisões.

Com Node.js e ImageMagick disponíveis:

```sh
node tools/compilar_arte.mjs
node tools/verificar_arte.mjs
```

O compilador apenas prepara os desenhos gerados: recorta as pranchas, ajusta dimensões, restringe a paleta e reaproveita tiles. Nos mapas jogáveis, a repetição dos tiles originais orienta a aplicação da nova textura; nas telas ilustradas e fundos decorativos, a preparação limita o resultado a 192 tiles. Sprites conservam três cores de tinta e a chave verde transparente `#65ff00`. Essa chave é técnica, não uma cor do cenário.

O recorte de sprites obedece às caixas de tiles dos metadados originais. Os IDs, estados, animações e coordenadas dos ativos existentes não foram regenerados. Golias ganhou um recurso novo e somente o ator do chefe foi ligado a ele.

## Validação

A auditoria verifica dimensões, cores, limite de tiles, recortes referenciados e quadros não vazios. Também compara os metadados e os mapas de colisão com a referência anterior. Resultado em `docs/validacao_arte.txt`.

A conferência visual foi feita nas pranchas e PNGs preparados. **Não foi executado build de ROM nem emulador.** Ainda é necessário conferir a animação em movimento, o alinhamento visual de portas e plataformas, a transição das camadas parallax e a legibilidade em hardware no GB Studio 4.2.0. Preservar colisões e coordenadas não equivale a validar a correspondência visual em todas as posições.

## Referências técnicas

Os limites e a leitura de cores foram conferidos no código oficial da versão usada:

- https://github.com/chrismaltby/gb-studio/blob/v4.2.0/src/consts.ts
- https://github.com/chrismaltby/gb-studio/blob/v4.2.0/src/shared/lib/tiles/tileData.ts

O acesso às páginas de documentação do site retornou HTTP 403; a consulta do código oficial acima foi bem-sucedida.
