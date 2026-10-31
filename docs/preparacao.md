# Etapa 0 — preparação

Projeto original importado de gospel.zip, sem edição dos recursos.

- GB Studio 4.2.0, release 10.
- Validação: 282 arquivos JSON, nenhum erro.
- Inventário: 74 caixas de texto; arquivo, cena, objeto e texto original registrados.
- Checagem de tamanho: 6 caixas originais com avisos em avisos_linhas.txt. Não foram corrigidas automaticamente.
- Scripts executáveis com Python 3, sem dependências, a partir de qualquer diretório.

## Pendente: teste visual de acentos

`defaultCharacterEncoding` está vazio; os dois arquivos de mapeamento de fontes contêm `mapping: {}`. Isso não demonstra que os acentos funcionem ou falhem.

No GB Studio, abra gospel/gospel.gbsproj e, em uma cópia temporária, teste uma caixa com `ã ç é ê õ á í ó ú`. Execute a prévia e confira todos os caracteres. Informe o resultado antes de aplicar os textos finais. Nenhum teste visual ou build de ROM foi executado aqui.

A Etapa 1 não foi iniciada. O aplicador de substituições será preparado após a confirmação dos acentos, com conferência das ocorrências de Locked... antes de alterá-las. Não foram criadas propostas nem aplicadas mudanças da Etapa 2.

## Reproduzir verificações

```sh
python tools/validar.py
python tools/inventario.py
python tools/checar_linhas.py
```
