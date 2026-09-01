"""Cliente para a API OAuth da Ludopedia (https://ludopedia.com.br/api/v1)."""
import os
import time

import requests
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "https://ludopedia.com.br/api/v1"
PAGE_SIZE = 20

# Um User-Agent customizado é bloqueado pelo WAF (Cloudflare) da Ludopedia,
# inclusive em endpoints da API — por isso usamos um UA de navegador comum.
DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)


class LudopediaClient:
    def __init__(self, access_token=None, max_retries=5, backoff=2.0, request_delay=0.4):
        self.access_token = access_token or os.environ["LUDOPEDIA_ACCESS_TOKEN"]
        self.max_retries = max_retries
        self.backoff = backoff
        self.request_delay = request_delay
        self.session = requests.Session()
        self.session.headers.update(
            {
                "Authorization": f"Bearer {self.access_token}",
                "User-Agent": DEFAULT_USER_AGENT,
            }
        )

    def _get(self, path, params=None):
        url = f"{BASE_URL}/{path}"
        last_exc = None
        for attempt in range(1, self.max_retries + 1):
            try:
                resp = self.session.get(url, params=params, timeout=20)
                if resp.status_code == 429:
                    wait = self.backoff * attempt
                    time.sleep(wait)
                    continue
                resp.raise_for_status()
                time.sleep(self.request_delay)
                return resp.json()
            except requests.RequestException as exc:
                last_exc = exc
                time.sleep(self.backoff * attempt)
        raise RuntimeError(f"Falha ao chamar {url} após {self.max_retries} tentativas: {last_exc}")

    def list_jogos_page(self, page, tp_jogo="b"):
        """Retorna uma página da listagem geral de jogos (id, nome, ano, thumb, link)."""
        return self._get("jogos", params={"page": page, "tp_jogo": tp_jogo})

    def iter_all_ids(self, tp_jogo="b"):
        """Itera por todo o catálogo paginado, produzindo (id_jogo, ano_publicacao)."""
        first = self.list_jogos_page(1, tp_jogo=tp_jogo)
        total = first["total"]
        n_pages = -(-total // PAGE_SIZE)
        for jogo in first["jogos"]:
            yield jogo["id_jogo"], jogo.get("ano_publicacao")
        for page in range(2, n_pages + 1):
            data = self.list_jogos_page(page, tp_jogo=tp_jogo)
            for jogo in data["jogos"]:
                yield jogo["id_jogo"], jogo.get("ano_publicacao")

    def get_jogo(self, id_jogo):
        """Detalhe completo de um jogo (jogadores, duração, mecânicas, contadores de usuário etc.)."""
        return self._get(f"jogos/{id_jogo}")
