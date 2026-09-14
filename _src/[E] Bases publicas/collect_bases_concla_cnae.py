"""
Coleta na API do IBGE (CONCLA) as subclasses CNAE candidatas ao enquadramento da
luderia e das atividades secundárias (8.1).

Saída: _data/raw/[E] Bases publicas/concla/cnae_subclasses.json
"""

from bases_comum import DATA_COLETA, RAW_DIR, baixar, salvar_json

API = "https://servicodados.ibge.gov.br/api/v2/cnae/subclasses/{}"
OUT_PATH = RAW_DIR / "concla" / "cnae_subclasses.json"

# Subclasse -> papel no enquadramento
SUBCLASSES = {
    "5611205": "Principal candidata: bar com entretenimento",
    "5611204": "Alternativa: bar sem entretenimento",
    "5611201": "Alternativa: restaurante (cozinha própria)",
    "5611203": "Alternativa: lanchonete",
    "9329899": "Secundária: recreação e lazer não especificados (jogos de mesa)",
    "9329804": "Secundária: exploração de jogos eletrônicos recreativos",
    "8230001": "Secundária: organização de festas e eventos",
    "5620102": "Secundária: bufê para eventos",
    "4763601": "Secundária: venda de jogos (brinquedos e artigos recreativos)",
    "7729202": "Secundária: aluguel de artigos de uso pessoal (locação de jogos)",
}


def main() -> None:
    registros = {}
    for sub, papel in SUBCLASSES.items():
        resposta = baixar(API.format(sub)).json()
        if not resposta:
            print("sem resposta:", sub)
            continue
        registros[sub] = {"papel_no_plano": papel, "resposta": resposta}
        item = resposta[0] if isinstance(resposta, list) else resposta
        print(sub, item.get("descricao"))
    salvar_json({"fonte": API, "data_coleta": DATA_COLETA, "subclasses": registros}, OUT_PATH)


if __name__ == "__main__":
    main()
