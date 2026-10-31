# HERÓIS DA FÉ — demo adaptada

Abra `gospel/gospel.gbsproj` no **GB Studio 4.2.0**. O projeto contém todos os ativos recebidos e as adaptações de texto, progressão e final. Não inclui ROM compilada.

## Como conferir

1. Faça uma cópia do projeto antes de salvar em outra versão do GB Studio.
2. Execute a prévia pelo editor e escolha **Novo jogo**. Saves do modelo antigo não devem ser usados para validar a nova progressão.
3. Na Casa do Samuel, examine o pergaminho (ponto de interação do antigo guia). A história leva à Vila.
4. Procure a ovelha perto da casa ao norte e volte ao pastor para obter o fragmento 1.
5. Siga a oeste para o caminho de Noé. Supere os três obstáculos do modelo e fale com Noé para obter o fragmento 2. A área lateral dos animais da Arca também pode ser explorada.
6. No Templo dos Portais, fale com o escriba e entre no portão quando ele estiver à esquerda. Use A para lançar pedras e acerte cinco vezes o chefe no fim do percurso. Isso concede o fragmento 3. Se não derrotá-lo, a saída reinicia o trecho. O portal do acampamento retorna à Vila.
7. Entre na cova, empurre o bloco até a marca e siga pela passagem. Abra o baú na Câmara do Anjo para obter o fragmento 4.
8. Use Start para consultar o diário fora das cenas que não tinham esse atalho no modelo.
9. Volte ao portão selado da Vila ou à porta da Câmara do Pergaminho. Ambos exigem os quatro fragmentos. A mensagem final aparece na entrada.
10. Confira Salvar jogo e Continuar por um ponto de salvamento.

## O que está validado

Com Python 3, sem dependências:

```sh
python tools/validar.py
python tools/checar_linhas.py
python tools/verificar_demo.py
```

283 recursos JSON válidos, 17 cenas, 112 caixas de texto, nenhuma linha acima de 18 caracteres ou caixa acima de três linhas. Condições de progressão, referências de cena, limites das coordenadas e UUIDs de eventos passaram na verificação. Acentos foram confirmados pelo usuário antes da adaptação.

A verificação de progressão é uma simulação restrita dos eventos, não uma execução da engine. **A ROM não foi compilada e a jogabilidade não foi testada no emulador.** Confira posições de entrada, colisões, tempo disponível para os cinco impactos, música e save no editor antes de distribuir como jogo pronto.

## Arte integrada e áudio

Esta versão inclui 62 PNGs de jogo com arte bíblica integrada: 19 fundos, 42 folhas de sprites substituídas e uma folha exclusiva de Golias. As fontes, emotes e elementos técnicos de leitura foram preservados. Veja `artes/LEIA-ME.md`, `artes/previa-cenarios.png` e `artes/previa-sprites.png`.

Os fundos do título e diário agora usam português. Personagens, objetos modernos e elementos espaciais receberam substituições temáticas, com as dimensões e recortes originais. A conferência visual no editor continua necessária; a validação dos arquivos não é um teste de jogabilidade.

As músicas e sons continuam sendo as faixas do modelo. Nenhuma música foi composta.

Os versículos em diálogo são adaptações/paráfrases, sem escolha de uma tradução bíblica específica. Samuel e o título são os padrões provisórios do guia. O Sonho de Jacó permanece como cena opcional fora do percurso obrigatório. Fases futuras com Jesus não foram implementadas.

Veja `docs/relatorio_final.md`, `docs/logica_fragmentos.md` e `docs/resultado_validacao.txt`.
