"""Cliente para a Overpass API (OpenStreetMap).

Usado no Bloco B para contar estabelecimentos comerciais no entorno, no
lugar da Google Places API. No OSM cada feição é um objeto próprio com tags
próprias: um shopping é `shop=mall` e as lojas inquilinas são objetos
separados com suas próprias tags (`shop=clothes` etc.), sem herdar o tipo
do empreendimento - o mecanismo que inviabilizou a contagem via Google. A
Overpass também não impõe teto de resultados, então a contagem é real.

A API é um bem público mantido por doação: o cliente identifica o projeto
no User-Agent e mantém intervalo entre requisições.
"""
import time

import requests

ENDPOINT = "https://overpass-api.de/api/interpreter"

USER_AGENT = "TCC-Luderia/1.0 (pesquisa academica UFBA; coleta Bloco B)"


class OverpassClient:
    def __init__(self, endpoint=ENDPOINT, max_retries=4, backoff=5.0, request_delay=2.0):
        self.endpoint = endpoint
        self.max_retries = max_retries
        self.backoff = backoff
        self.request_delay = request_delay
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": USER_AGENT})

    def query(self, ql):
        last_exc = None
        for attempt in range(1, self.max_retries + 1):
            try:
                resp = self.session.post(self.endpoint, data={"data": ql}, timeout=180)
                # 429 (rate limit) e 504 (gateway timeout) são a forma normal
                # de a Overpass pedir para esperar - não são erro de query.
                if resp.status_code in (429, 504):
                    time.sleep(self.backoff * attempt)
                    continue
                resp.raise_for_status()
                time.sleep(self.request_delay)
                return resp.json()
            except requests.RequestException as exc:
                last_exc = exc
                time.sleep(self.backoff * attempt)
        raise RuntimeError(f"Falha ao consultar Overpass: {last_exc}")

    def pois_no_raio(self, lat, lng, raio_m, amenities):
        """Devolve os elementos com tag `shop` ou com `amenity` na lista, num
        raio de raio_m metros. `nwr` cobre node, way e relation."""
        filtro_amenity = "|".join(amenities)
        ql = f"""
[out:json][timeout:120];
(
  nwr(around:{raio_m},{lat},{lng})[shop];
  nwr(around:{raio_m},{lat},{lng})[amenity~"^({filtro_amenity})$"];
);
out tags center;
"""
        return self.query(ql).get("elements", [])
