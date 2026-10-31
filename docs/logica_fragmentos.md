# Lógica dos fragmentos

## Estado

- Variável 0, Frag Ovelha: interagir com a ovelha (gato original) e retornar ao pastor na Vila.
- Variável 1, Frag Arca: superar os três obstáculos do caminho e falar com Noé (jardineiro original).
- Variável 2, Frag Golias: acertar cinco projéteis no ator novo Golias, no fim do shmup. Sair da fase exige a vitória; caso contrário, o trecho reinicia.
- Variável 3, Frag Daniel: abrir o baú da Câmara do Anjo.

As recompensas têm mensagem única. O baú usa Frag Daniel para persistir aberto. As variáveis e símbolos originais foram mantidos; as antigas concessões das variáveis 4–11 foram convertidas em estado local, pois esses fragmentos estão reservados.

Três variáveis auxiliares novas: Cova Resolvida, Rolo Encontrado e Mensagem Final Lida. O bloco, a escada e a transição da cova usam Cova Resolvida; não concedem o fragmento da Arca. A conversa com o sábio não concede Daniel; o shofar não concede Golias.

## Fluxo

Logo → Título → Casa do Samuel. Na casa, o ponto de interação do antigo guia de documentação representa o pergaminho. A interação apresenta o prólogo e leva à Vila. A saída original da casa continua disponível para exploração do caminho.

A placa na Vila indica destinos. O Templo dos Portais mantém a interação original com o escriba: fale com ele, acompanhe seu deslocamento para a esquerda e entre no portão. A batalha conserva o percurso shmup e os obstáculos originais. Golias é um ator adicional sem prefab, com folha de sprite exclusiva na versão de arte, contador local de impactos e movimento vertical.

Após a batalha, o portal do acampamento volta diretamente à Vila. O Sonho de Jacó permanece no projeto como cena opcional, sem ligação obrigatória na demo.

Os dois acessos à Câmara do Pergaminho (porta original e portão antes selado) verificam as quatro variáveis por condições aninhadas. Com as quatro, a entrada dispara a mensagem final uma única vez. É possível sair e revisitar.

Start abre o diário nas cenas em que o modelo já tinha esse atalho. Os quatro estados são apresentados em português; os marcadores visuais originais continuam ligados às mesmas variáveis.

Novo jogo zera o estado das missões e auxiliares, preservando a função Continuar e o save existente. Para testar esta adaptação, comece um jogo novo; saves antigos do modelo podem conter recompensas incompatíveis.

## Verificação

`python tools/verificar_demo.py` valida a estrutura e simula as condições de progressão dos arquivos reais: 32 combinações dos dois portões, 16 combinações do final, estados de missão da ovelha e da Arca, cinco impactos no chefe e repetição do baú.

A simulação não reproduz a engine: movimento, colisões, input, renderização, persistência em cartucho e acessibilidade das rotas precisam de teste no GB Studio.
