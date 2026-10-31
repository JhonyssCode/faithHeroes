# Relatório final — HERÓIS DA FÉ

## Entrega atual

Projeto-fonte GB Studio 4.2.0 em português, com exploração, plataforma, batalha de funda, quebra-cabeça e final. Quatro missões concedem os fragmentos de Ovelha, Arca, Golias e Daniel. Os dois acessos à câmara final exigem os quatro; o diário mostra a progressão.

A versão visual inclui **62 PNGs de jogo**: 19 fundos, 42 folhas de sprites substituídas e uma folha exclusiva adicional para Golias. Personagens, Vila, interiores, templo, cova, Arca, batalha, diário e objetos receberam arte temática. As fontes, emotes, moldura de diálogo, fundo preto funcional e pequenos elementos técnicos compatíveis foram preservados. Áudio original mantido.

Pranchas, conceitos, inventário e cópia dos PNGs anteriores estão em `artes/`. A preparação técnica usa Node.js 20.11+, ImageMagick 7 e unzip, sem pacotes npm. O jogo abre diretamente pelo arquivo `gospel/gospel.gbsproj`.

## Evidência

- 284 arquivos JSON válidos; 17 cenas.
- Nenhuma caixa de texto acima de 18 caracteres por linha ou três linhas.
- Condições dos dois portões simuladas nas 32 combinações; final nas 16 combinações.
- Recompensas verificadas nos estados da ovelha, 0–3 obstáculos, cinco impactos de Golias e abertura/repetição do baú.
- Arte limitada a quatro cores; fundos com até 192 tiles; recortes dos sprites dentro das imagens.
- 171 quadros referenciados com desenho não vazio.
- 89 metadados originais de assets idênticos; os 17 mapas de colisão e suas dimensões foram preservados.

Resultados completos em `validacao_arte.txt`. A referência de sprites do ator Golias foi intencionalmente ligada à folha nova; as referências e IDs dos ativos originais foram mantidos.

## Conferência necessária no editor

Não foi executado build de ROM nem emulador. Os testes são de arquivos e simulação restrita de lógica. Abra no GB Studio, escolha Novo jogo e confira:

1. Recortes e direções das animações em movimento.
2. Correspondência visual de portas, plataformas e colisões, inclusive o ponto do pergaminho na Casa.
3. Rolagem das camadas de parallax da Arca.
4. Cinco impactos no chefe durante o percurso da batalha.
5. Save/continue e retorno às fases.
6. Legibilidade na resolução do Game Boy e cores no modo misto.

A arquitetura de tiles foi conservada nos mapas jogáveis para reduzir deslocamentos visuais. Isso não substitui o teste acima. As fontes com acentos foram confirmadas pelo usuário antes da adaptação.

Samuel e o título são os padrões provisórios do guia. Os versículos são adaptações/paráfrases, sem adoção de tradução específica. O Sonho de Jacó permanece opcional fora da rota obrigatória. Fases futuras com Jesus não foram implementadas.

Nenhuma música foi composta. Nenhuma publicação do ambiente foi feita durante a entrega da arte.
