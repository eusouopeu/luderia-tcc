"""
Converte as tabelas da análise de conteúdo do B2 na grade 2 (22 temas; B2a_temas_grade2.py)
em src/conteudo/b2-temas.json, que a aba "Análise de conteúdo" do site lê.

Uso: python3 scripts/sincronizar_b2.py   (ou: pnpm run b2)
"""
import csv
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[4]
ENTRADA = RAIZ / "dados" / "B2_avaliacoes" / "_dados-agregados" / "analise_conteudo"
SAIDA = Path(__file__).resolve().parents[1] / "src" / "conteudo" / "b2-temas.json"


def ler(nome):
    with open(ENTRADA / nome, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f, delimiter=";"))


def n(x):
    return None if x in ("", None) else float(x)


def main():
    temas = [{"tema": r["tema"], "elogio": int(r["comentarios_elogio"]), "critica": int(r["comentarios_critica"]),
              "comTema": int(r["comentarios_com_tema"]), "pctElogio": n(r["pct_elogio"]), "pctCritica": n(r["pct_critica"]),
              "pctTema": n(r["pct_com_tema"]), "notaElogio": n(r["nota_media_elogio"]), "notaCritica": n(r["nota_media_critica"])}
             for r in ler("B2_temas_frequencia.csv")]
    contexto = [{"contexto": r["contexto"], "comentarios": int(r["comentarios"]), "pct": n(r["pct_comentarios"])}
                for r in ler("B2_temas_contexto.csv")]
    estab = [{"metropole": r["metropole"], "nome": r["estabelecimento"], "comentarios": int(r["comentarios"]),
              "comTema": int(r["comentarios_com_tema"])} for r in ler("B2_temas_estabelecimentos.csv")]
    kappa = [{"rodada": int(r["rodada"]), "variavel": r["variavel"], "linhas": int(r["linhas"]), "kappa": n(r["kappa"]),
              "aceita": r["aceita"] == "sim"} for r in ler("B2_recodificacao_kappa.csv")]
    total = sum(e["comentarios"] for e in estab)
    assert total == 1628, total  # a tabela por estabelecimento fecha com o total do B2
    saida = {"_leiaMe": "Gerado por scripts/sincronizar_b2.py a partir de dados/B2_avaliacoes/_dados-agregados/analise_conteudo/B2_temas_*.csv e B2_recodificacao_kappa.csv. Não editar à mão.",
             "comentarios": total, "estabelecimentos": len(estab), "temas": temas, "contexto": contexto,
             "porEstabelecimento": estab, "kappa": kappa}
    SAIDA.write_text(json.dumps(saida, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{total} comentários, {len(estab)} estabelecimentos, {len(temas)} temas -> {SAIDA.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
