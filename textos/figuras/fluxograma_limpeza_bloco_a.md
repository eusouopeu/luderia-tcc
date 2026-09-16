# Fluxograma de limpeza dos estabelecimentos (Bloco A)

Versão editável: `fluxograma_limpeza_bloco_a.drawio` (abrir no draw.io / diagrams.net).

```mermaid
flowchart TD
    INI([Estabelecimento na fila de triagem]) --> D0{Google Maps indica<br/>fechado permanentemente?}
    D0 -- SIM --> X0[EXCLUÍDO<br/>E0 · fechado]
    D0 -- NÃO --> P1[Reunir fotos e publicações dos últimos 24 meses<br/>Google Maps · Instagram · site]
    P1 --> D1{Há material do próprio local<br/>em ao menos uma fonte?}
    D1 -- NÃO --> X1[EXCLUÍDO<br/>E1 · sem evidência verificável]
    D1 -- SIM --> P2["Marcar cada evidência presente (1 ponto cada)<br/>A · Acervo: estante com ≥ 2 jogos de caixa completa, fora da embalagem de venda<br/>B · Uso: jogo de caixa completa aberto sobre a mesa, em uso no local<br/>C · Declaração: texto explícito de jogos disponíveis para uso no local"]
    P2 --> D2{Pontuação ≥ 2 de 3?}
    D2 -- NÃO --> X2[EXCLUÍDO<br/>E2 · evidência insuficiente]
    D2 -- SIM --> INC[INCLUÍDO<br/>I-AB · I-AC · I-BC · I-ABC]
    X0 & X1 & X2 & INC --> REG[/Registrar código em evidencia_espaco_jogo<br/>e links das evidências em observacao/]

    classDef inc fill:#d5e8d4,stroke:#82b366
    classDef exc fill:#f8cecc,stroke:#b85450
    classDef chk fill:#dae8fc,stroke:#6c8ebf
    class INC inc
    class X0,X1,X2 exc
    class P2 chk
```

## Regras de leitura

- Uma foto só conta se for do próprio estabelecimento, não imagem de divulgação.
- A sozinho não basta: a estante pode ser só de venda.
- B sozinho não basta: o jogo pode ter sido trazido pelo cliente.
- C sozinho não basta: declaração sem prova visual.
- Caso ambíguo: marcar a evidência como ausente e anotar a dúvida em `observacao`.
