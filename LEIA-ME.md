# HERÓIS DA FÉ — versão 2

Extraia o projeto em uma pasta nova e abra **gospel/gospel.gbsproj** no **GB Studio 4.2.0**. Escolha **Novo jogo**: esta versão muda o mapa e as missões. Saves anteriores não são apagados, mas não são carregados por Continuar; saves feitos nesta versão são aceitos.

## O jogo

Samuel encontra um rolo e recupera quatro relíquias: Cuidado, Promessa, Coragem e Fé. A praça tem quatro marcos que mostram o progresso e um rolo que oferece pistas. Start abre o diário nas áreas de exploração.

- **Cuidado:** ovelha no cercado a oeste; depois, volte ao pastor.
- **Promessa:** Arca a noroeste; resgate três pares e fale com Noé. Os pares estão na trilha à esquerda da entrada.
- **Coragem:** templo a nordeste; atravesse a aproximação e vença Golias na arena. Direcionais desviam, A atira à direita, B pausa ou permite voltar. Cinco acertos vencem; três vidas por tentativa.
- **Fé:** cova a sudoeste; resolva o bloco, siga pela passagem e abra o baú.

O santuário fica ao norte e exige as quatro. A Casa dos Salmos está a sudeste; o sábio, ao sul. A pedra de memória ao sul da praça salva a partida. A ordem das relíquias é livre.

## Mudanças desta versão

Mapa próprio montado com tiles nativos, resgate de animais, arena e estados visuais próprios para Golias, indicadores de resistência/vida, pistas curtas, contagem de relíquias, animações regulares de Samuel e cinco trilhas próprias em UGE6.

Foram removidas as trocas de tiles e os atributos de cor herdados, os tremores de câmera e o parallax que separava partes do desenho da Arca. O reinício zera todas as variáveis; o bloco da cova preserva posição e só reinicia por confirmação.

## Validação

Veja [o relatório da versão 2](docs/versao2.md) e [os resultados](docs/validacao_v2.txt).

**A ROM ainda precisa de conferência no editor/emulador.** As verificações executadas validam arquivos, simulação de eventos, acessibilidade das portas, recortes, orçamento de sprites e formato de música. Não substituem o teste de jogabilidade e áudio.

As versões e referências anteriores permanecem no repositório para comparação. A fonte com acentos foi preservada, assim como as ligações por UUID dos recursos existentes.
