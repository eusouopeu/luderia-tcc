# Observação Luderia (app)

App Android do roteiro de observação do Bloco D (TCC Luderia). Padrões herdados: `../../_shared/tech-standards.md`.

## Mapa
- `src/domain/model.ts` — modelo: unidade (mesas, sigla, acervo), visita (ficha, NFC-e, temporizador com pausas), grupo na mesa (`Registro`, com jogos), fluxo na porta (`Fluxo`: entrada e saída com o mesmo código `BV-n`), contagens periódicas, medições de som, `config`. `normalizar` completa estados de versões antigas (só acrescentar campos com padrão). `arquivosCsv` gera os CSVs `contagem_*` lidos por `_src/[D] Contagem direta de ocupacao/analise_contagem.py` — mudou coluna, mude o script.
- `src/domain/temporizador.ts` — contagem inicial + uma a cada intervalo (padrão 3 h / 30 min), descontando pausas. `nfce.ts` — chave do QR (série/número, offline) e consulta à SEFAZ (cópia do mecanismo do app Brita, `rotinas/webapp/src/lib/nfce.ts`). `resumo.ts` — indicadores da visita. `acustica.ts` — Leq, faixas e comparações.
- `src/domain/jogos.json` — banco de jogos gerado por `python3 scripts/gerar_jogos.py` (Ludopedia do Bloco F por `qt_tem` + lista curada). Não editar à mão.
- `src/store.ts` — estado (zustand) com `comecar`/`encerrar`/`alternarPausa`; grava agrupado (300 ms) e agenda backup (5 s) e lembretes.
- `src/storage/` — `repo.ts` (JSON no SQLite/localStorage), `backup.ts` (Documentos/ObservacaoLuderia, um arquivo por dia), `lembretes.ts` (notificações locais das contagens), `exportar.ts` (compartilha vários arquivos).
- Telas: `App.tsx` (navegação, voltar do Android), `screens/Unidade.tsx` (casca: abas Mesas/Fluxo/Acústica/Temporizador + barra Início/Visita/Resumo/Ajustes), `screens/abas/*`, `screens/Visita.tsx` (ficha + leitor de QR), `Resumo.tsx`, `Ajustes.tsx`, `FormMesa.tsx`, `FormAcervo.tsx`, `Folhas.tsx`.
- Microfone (`ui/useMicrofone.ts`): dB estimado = dBFS + calibração (Ajustes). Câmera: QR da NFC-e (`ui/useLeitorQr.ts`, cópia do Brita) e fotos por `<input capture>` (`screens/abas/Fotos.tsx`).
- **Aba Ambiente** (`screens/abas/Ambiente.tsx`): Acústica, Medidas (`domain/medida.ts`: escala por objeto de referência no mesmo plano; `Medidor` marca 4 pontos arrastáveis) e Fotos (`storage/fotos.ts`: JPEG 2000 px em Documentos/ObservacaoLuderia/fotos, `arquivo` = "PASTA:caminho", miniatura em data URL no estado). OCR fica no pipeline: `_src/[D] Contagem direta de ocupacao/ocr_fotos.py`; fotos cruas no `.gitignore`.
- **Pedidos** (`Registro.pedidos`, `ui/Pedidos.tsx`): categoria + hora do pedido + chegada → espera. Atalhos na mesa ocupada (`ui/MesaDesenho.tsx`): +1 instrutor e folha de pedidos.
- **Outro celular** (`screens/Transferir.tsx`, `domain/juntar.ts`): plugin nativo `AproximacaoPlugin.java` — o NFC só dispara (quem envia emula cartão `AproximacaoHce`, AID F04F42534C5544, com código da sessão + PSM), a cópia vai por Bluetooth L2CAP sobre BLE (anúncio com o código em service data). Android 10+. Quem recebe junta (local vence no mesmo id) ou substitui. Fotos não vão (só miniaturas).
- **Tema** (`ui/tema.tsx`): `config.tema` sistema/claro/escuro; `data-tema` no `<html>` troca os valores das variáveis em `app.css` (`:root[data-tema='escuro']`); `index.html` aplica antes do 1º paint; `TemaPlugin.java` pinta o fundo atrás das barras do sistema. Botão na barra superior (fixa, `sticky`) e em Ajustes.

## Design
- Segue `../../_shared/design-standards.md` e `minimalismo.md`, exceto a cor: primária laranja dos mockups do Pedro (escala `caneta` em `app.css`) em vez do roxo. Nenhuma classe da paleta padrão do Tailwind: só tokens (`caneta`, `neutro`, `erro`, `ok`, `alerta`, `foco`, `papel`, `tinta`; `sobre` = texto sobre cor forte e `escuro` = fundo de câmera, fixos nos dois temas). Os −/+ vermelho/verde vêm dos mockups.
- Ajuda de seção: `ui/Ajuda.tsx` (ⓘ com balão), via `Secao ajuda=`; nada de texto de instrução fixo.

## Build
- Ícone: `npx tsx scripts/gerar-icone.ts` (Heroicons `puzzle-piece`).
- `npm run sync` e `cd android && JAVA_HOME=/opt/homebrew/opt/openjdk@21 ./gradlew assembleDebug`; APK na raiz como `ObservacaoLuderia-<versionName>.apk`. Repositório público: sem keystore versionado.
- Permissões no manifesto: câmera, microfone, notificações; `res/xml/network_security_config.xml` libera http só para gov.br (SEFAZ).
