# AGORA

Atualizado em 12/11/2026, à tarde. **TMin v32** no PDF; os `.md` e o modelo já têm a demanda pelo índice "Horários de pico", a faixa do Monte Carlo na Tabela 9.4 e o gasto da L31 (`.docx`, PDF e apêndices não regerados). Banca em 16/11. Escopo congelado: só entra o que muda o TMin.

## Fazendo agora (no máximo duas frentes)

1. **Fechar a versão v33:** regerar `.docx`, PDF, apêndices (E, G e matriz do D já atualizada no gerador; trocar `DATA_MODELO`) e pré-textuais. Provável: 843 pessoas/mês, VPL de R$ 245 mil (R$ 21 mil sem residual), TIR de 30,7%, payback de 4,3 anos, P(VPL > 0) de 62,1% (P10 −R$ 403 mil, P90 R$ 1,5 milhão); rupturas: circulação 5,89 (8% abaixo), gasto R$ 71,91 (9%).
2. **Fechamento para a banca:** citações `[AV]` e ajustes de formatação (teto de 120 páginas).

## Próximos 3 passos

1. Regerar o TMin v33 e conferir as Tabelas 6.2, 9.2 a 9.6 e 4.1 no PDF.
2. Responder o "Lote de decisões" ([pendências](docs/pendencias.md)): L1, L20 a L24, L27, L29 e L30.
3. Conferir as citações `[AV]` e passar as conferidas para citação indireta.

## Bloqueado ou aguardando

- Quantidades do investimento (N6): projeto do ponto na Pituba.
- Folha de aprovação: nomes da banca.
- Coletas do autor (aluguel, horários de pico, entorno, B2, webscripts): roteiros em [pendências](docs/pendencias.md), "Coletas em andamento".
- Webscripts (12/11): painéis do Instagram, dos cardápios e o novo coletor de acervos no kit comum (`_src/extras/kit_painel/`); instalar o carregador do `acervo_coletor` e reinstalar o do cardápio (`python3 _src/extras/gerar_carregadores.py --abrir`). Não muda o TMin.

## Onde está o resto

| Preciso de… | Arquivo |
|---|---|
| O que mudou em cada arquivo | mensagens dos commits (`git log`); Notion e divergências em [docs/registro-de-alteracoes.md](docs/registro-de-alteracoes.md) |
| Divergências entre capítulos e cortes possíveis | [docs/melhorias-texto.md](docs/melhorias-texto.md) |
| Prazos e checklist por semana | [textos/planejamento/cronograma_luderia.md](textos/planejamento/cronograma_luderia.md) |
| Situação de cada capítulo | [textos/planejamento/status_capitulos.md](textos/planejamento/status_capitulos.md) |
| O que já foi decidido | [docs/decisoes.md](docs/decisoes.md) (até 31/10 em `docs/_arquivo/`) |
| Decisões a tomar, tarefas para a banca e o que ficou para depois | [docs/pendencias.md](docs/pendencias.md) |
| Pareceres e análises avulsas | [docs/pareceres/](docs/pareceres/) |
| Modelo financeiro | `_src/Modelo financeiro/analise/`; premissas fixas em `dados/modelo_financeiro/premissas_autor.csv` |
| Que arquivo abrir para cada tarefa | [README.md](README.md), "Por onde começar" |
