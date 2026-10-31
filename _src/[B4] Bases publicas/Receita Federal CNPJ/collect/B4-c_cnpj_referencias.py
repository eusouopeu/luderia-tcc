"""
Coleta o cadastro público (Receita Federal, via BrasilAPI) dos CNPJ das duas
unidades da São Jogue, referência de forma jurídica, CNAE e regime para o 8.1.
Os CNPJ vêm das NFC-e das visitas do B3.

Saída: dados/[B4] Bases publicas/_dados-brutos/receita_cnpj/cnpj_<número>.json, sem
o quadro de sócios e os contatos.
"""

# Caminhos: _src/extras/ (log comum) e outros/ do objeto (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras"), str(_AQUI.parents[1] / "outros"), str(_AQUI.parents[2] / "Comum")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

from bases_comum import RAW_DIR, baixar_json, salvar_json

API = "https://brasilapi.com.br/api/cnpj/v1/{}"
CNPJ = {
    "34128755000198": "São Jogue Bela Vista (NFC-e 77977 e 78160)",
    "59848429000186": "São Jogue Paralela (NFC-e 12200 e 12409)",
}


def main() -> None:
    for cnpj, origem in CNPJ.items():
        _, d = baixar_json(API.format(cnpj))
        # sem dados de pessoas físicas (sócios) nem contato
        for campo in ("qsa", "email", "ddd_telefone_1", "ddd_telefone_2", "ddd_fax"):
            d.pop(campo, None)
        d["_origem_no_tcc"] = origem
        salvar_json(d, RAW_DIR / "receita_cnpj" / f"cnpj_{cnpj}.json")
        print(cnpj, d.get("razao_social"), d.get("cnae_fiscal"))


if __name__ == "__main__":
    main()
