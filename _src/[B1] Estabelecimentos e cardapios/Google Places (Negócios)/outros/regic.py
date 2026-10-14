"""
Divisão das capitais pela REGIC 2018 (IBGE), extraída pelo autor para
Metrópoles.md. Usado pela análise de limiares (B1-a_limiares.py) e pelas
planilhas por grupo (B1-b_planilhas_regic.py).
"""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[4]
REGIC_PATH = ROOT / "dados" / "[B1] Estabelecimentos e cardapios" / "_dados-brutos" / "Metrópoles.md"

# Grupos da pesquisa (REGIC 2018, IBGE), na ordem da tabela.
GRUPOS_REGIC = ["Metrópoles", "Capitais Regionais"]
# Metrópoles.md traz os níveis no plural; a coluna REGIC usa o singular.
NIVEL_SINGULAR = {
    "Grande Metrópole Nacional": "Grande Metrópole Nacional",
    "Metrópoles Nacionais": "Metrópole Nacional",
    "Metrópoles": "Metrópole",
    "Capitais Regionais A": "Capital Regional A",
    "Capitais Regionais B": "Capital Regional B",
    "Capitais Regionais C": "Capital Regional C",
}


def load_regic():
    """Lê Metrópoles.md (divisão extraída pelo autor da REGIC 2018): '# ' é o
    grupo, '## ' o nível, '- ' a capital. Devolve capital -> (grupo, nível)."""
    regic, grupo, nivel = {}, None, None
    for linha in REGIC_PATH.read_text(encoding="utf-8").splitlines():
        linha = linha.strip()
        if linha.startswith("## "):
            nivel = NIVEL_SINGULAR[linha[3:].strip()]
        elif linha.startswith("# "):
            grupo = linha[2:].strip()
            assert grupo in GRUPOS_REGIC, grupo
        elif linha.startswith("- "):
            regic[linha[2:].strip()] = (grupo, nivel)
    return regic
