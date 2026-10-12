# Bloco B5 (jogos) — arquivado

Retirado do trabalho em 12/10/2026, a pedido do autor: clusters e correlações de jogos não mudavam nenhuma decisão de peso do plano. O acervo passa a ser definido pelos jogos citados nas avaliações (B2) e pelo acervo declarado dos concorrentes (B1).

Conteúdo guardado para eventual uso futuro, na estrutura original de pastas:

- `_src/[B5] Ludopedia (jogos)/` — coleta na API e raspagem da Ludopedia, base de jogos, correlações e clusters;
- `_data/raw/[B5] Jogos (ludopedia)/` — ids, ranking e detalhes (os `.jsonl` ficam fora do repositório);
- `_data/processed/[B5] Jogos (ludopedia)/` — `B5_jogos*.csv`, correlações e clusters.

Os scripts calculam `ROOT` como `parents[2]`. Para rodá-los de novo, devolva a pasta de `_src/` e as de `_data/` aos lugares de origem.

O app de observação ainda usa `B5_jogos_completo.csv` para gerar o banco de jogos (`app-observacao/scripts/gerar_jogos.py`), lendo o arquivo deste local.
