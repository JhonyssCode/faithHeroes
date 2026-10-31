# Relatório final — adaptação da demo

## Entregue

- Importação integral dos arquivos do ZIP original, preservando ativos.
- Tradução dos diálogos e opções Salvar, Cancelar, Novo jogo e Continuar.
- Nomes de cenas adaptados sem renomear pastas/arquivos nem trocar seus IDs.
- Prólogo do rolo, quatro missões, diário em português, portões condicionais e mensagem final.
- Chefe Golias adicional com sprite placeholder e cinco impactos.
- Correção dos conflitos de variáveis entre as recompensas do modelo e os fragmentos bíblicos.
- Scripts de inventário, validação, checagem de tamanho e simulação de progressão.
- Documentação de execução e conferência no editor.

Etapas 2–5 realizadas após autorização para seguir e entregar o projeto completo. As decisões recomendadas do guia foram mantidas provisoriamente; não houve publicação do ambiente nem envio a serviço externo.

## Evidência

Os resultados atuais estão em resultado_validacao.txt. O inventário original foi preservado em inventario_textos_original.md; inventario_textos.md representa os textos atuais. A conferência de integridade preservou os 385 arquivos originais versionados, os IDs originais presentes em cada recurso e suas referências principais a sprites/fundos. Um arquivo .sav de efeitos sonoros recebido no ZIP é ignorado pelo Git e também está no pacote.

As novas variáveis e eventos receberam UUIDs novos. As transições intencionalmente adaptadas são Título → Casa, pergaminho → Vila, acessos finais, reinício de tentativa da batalha e portal do acampamento → Vila. O restante das ligações foi conservado.

## Limites e itens para o humano

1. Abrir no GB Studio 4.2.0, compilar e completar uma partida nova. Não foi executado build de ROM nem emulador neste ambiente; a CLI do GB Studio não está instalada. Nenhum comando de build não verificado foi usado.
2. Validar visualmente o spawn da Casa, o ponto do pergaminho, as duas portas finais e as saídas das fases.
3. Validar o ritmo do chefe com cinco impactos no percurso de rolagem automática. O teste estático verifica o contador, sem medir o tempo de jogo.
4. Testar save/continue, reinício e estados de retorno às fases no editor.
5. Substituir logo, título, fundos, sprites e arte do diário. Textos embutidos nos PNGs podem continuar em inglês. Os ativos são os placeholders originais por exigência do guia.
6. Substituir/confirmar faixas de música, sons e paletas. Nenhuma música foi composta.
7. Confirmar título definitivo, tradução bíblica e futuras fases; nada disso bloqueou a demo textual com os padrões recomendados.

Este é um projeto-fonte adaptado com validação estrutural e lógica estática. A aprovação de jogabilidade e o acabamento visual permanecem pendentes.
