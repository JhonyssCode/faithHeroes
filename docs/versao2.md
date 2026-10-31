# Versão 2 — As quatro relíquias

## O que muda no jogo

A praça tem um mapa próprio, com seis entradas e um cercado. Os quatro marcos no centro acendem conforme as relíquias são recuperadas. O rolo central e o diário indicam a próxima missão. A ordem é livre e os avisos mostram a quantidade realmente reunida, não apenas o número da missão.

Noé agora pede o resgate de três pares de animais, com contador e interação por A. Os ratos são obstáculos; derrotá-los não concede a relíquia. Ao concluir os resgates, é preciso conversar com Noé.

Golias tem uma arena própria, cinco pontos de resistência, três poses e ataques anunciados. O jogador tem três vidas, proteção breve após um impacto e pode sair pela pausa em B. Derrotas reiniciam o duelo, sem refazer a aproximação. Depois de chegar ao duelo pela primeira vez, o templo passa a encaminhar diretamente à arena; depois da vitória, leva ao acampamento.

Cinco trilhas originais foram criadas em UGE6: Praça das Relíquias, Dois a Dois, No Silêncio, Cinco Pedras e Memória da Fé. Elas substituem os eventos de música do modelo. Efeitos curtos destacam resgates, acertos e recompensas.

## Bugs tratados

- **Pixels e instabilidade visual:** removidas as trocas de tiles que usavam índices da arte antiga; zerados os atributos de cor dos fundos antigos; normalizadas as paletas e os atributos por peça dos sprites. Removidos os tremores de câmera herdados.
- **Conversão de arte:** a nova praça é montada com um tileset nativo de 32 peças de 16×16. Não usa a substituição aproximada de tiles que deformava o desenho anterior.
- **Samuel na plataforma:** a folha irregular foi substituída por seis poses completas, com recortes regulares. As peças não se sobrepõem nas mesmas linhas; a caixa de colisão original foi mantida.
- **Arca:** removida a separação em camadas de parallax. O barco é uma ilustração única e atravessava as faixas com velocidades diferentes, o que separava partes do desenho durante a rolagem.
- **Golias:** o novo duelo usa um contador global declarado de resistência e colisões dedicadas: pedras do grupo 2 atingem o chefe do grupo 3 pelo evento hit2. A resistência só é inicializada na entrada da arena; o update não a reinicia. Cinco acertos levam à pose de derrota, relíquia e acampamento.
- **Sprites por linha:** pedras e lanças usam uma única peça 8×16. Os tempos e dimensões reais resultam em um orçamento conservador de oito sprites por linha na área do duelo, abaixo do limite de dez. O HUD ocupa outra faixa.
- **Cova:** o reset exige confirmação; um enigma resolvido não é desfeito. A posição do bloco é guardada após empurrá-lo e restaurada ao voltar do diário.
- **Novo jogo:** usa o reset oficial de todas as variáveis, incluindo locais. O formato do save tem assinatura própria e é verificado antes de carregar. Saves anteriores são preservados, mas não carregados como se fossem desta versão.
- **Pacote completo:** incluído explicitamente o banco de efeitos FX Hammer `.sav` original, que era omitido pela regra genérica de saves do Git. Não é um arquivo de progresso do jogador.
- **Entradas e saídas:** os retornos à praça foram deslocados para fora dos gatilhos. O templo não depende mais da posição exata de um NPC para funcionar.

## Como jogar e encontrar as relíquias

1. Extraia em uma pasta nova, abra `gospel/gospel.gbsproj` no GB Studio 4.2.0 e escolha **Novo jogo**.
2. Na Casa, interaja com o rolo. Na praça, **A** conversa e **Start** abre a pista do diário.
3. **Cuidado:** encontre a ovelha no cercado a oeste e volte ao pastor ao lado dele.
4. **Promessa:** entre na oficina da Arca, a noroeste. Siga a trilha à esquerda, resgate os três pares usando A e converse com Noé.
5. **Coragem:** entre no templo a nordeste e use seu portal. No duelo, mova-se para desviar, use A para lançar pedras à direita e acerte Golias cinco vezes. B oferece pausa/retorno à praça.
6. **Fé:** entre na cova a sudoeste, leve o bloco à marca, siga pela passagem e abra o baú da câmara.
7. Com as quatro, entre no santuário ao norte. A casa sudeste é a Casa dos Salmos; o sábio fica ao sul.
8. A pedra de memória ao sul da praça salva a partida. Os saves criados nesta versão podem ser usados em Continuar.

Os controles físicos das plataformas foram preservados. Os diálogos permanecem em português e as citações seguem como paráfrases/adaptações.

## Validação e limites

As verificações estão em `validacao_v2.txt`. Incluem caminhos com a largura do personagem, portais, combinações de missões, coleta fora da ordem, contadores, pausa, proteção de dano, retry, persistência do bloco, cinco disparos pela rota real de grupos de colisão, integridade dos PNGs, recortes e formato das cinco trilhas.

Isso é validação estrutural e simulação restrita de eventos. **Não foi compilada nem executada uma ROM neste ambiente.** O leitor de UGE usado nas verificações é o código oficial do GB Studio 4.2.0, com licença MIT preservada em `tools/vendor/gbstudio/`.

A conferência no emulador deve priorizar: flicker durante o combate, cinco impactos e pose de derrota, animações em movimento, resgates, áudio/mixagem e reabertura de um save novo. O orçamento estático reduz causas de flicker, mas não é uma medição em hardware.

## Ferramentas

```sh
python tools/validar.py
python tools/checar_linhas.py
python tools/verificar_demo.py
node tools/verificar_arte.mjs
node tools/verificar_trilhas.mjs
```

Para preparar os assets a partir das fontes, com Node 20.11+, ImageMagick 7 e Python 3:

```sh
node tools/preparar_arte_v2.mjs
python tools/gerar_praca.py
```

`node tools/compilar_arte.mjs` prepara também a base visual anterior e reaplica os assets v2 ao final. `node tools/compor_trilhas.mjs` reproduz os arquivos de música a partir das melodias declaradas no script.
