"""Cliente para a Google Places API (New) (https://places.googleapis.com/v1)."""
import os
import time

import requests
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "https://places.googleapis.com/v1"

SEARCH_FIELD_MASK = ",".join(
    [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.location",
    ]
)

DETAILS_FIELD_MASK = ",".join(
    [
        "id",
        "displayName",
        "formattedAddress",
        "rating",
        "userRatingCount",
        "priceLevel",
        "websiteUri",
        "internationalPhoneNumber",
        "googleMapsUri",
        "types",
        "businessStatus",
        "reviews",
    ]
)


class PlacesClient:
    def __init__(self, api_key=None, max_retries=5, backoff=2.0, request_delay=0.2):
        self.api_key = api_key or os.environ["GOOGLE_PLACES_API_KEY"]
        self.max_retries = max_retries
        self.backoff = backoff
        self.request_delay = request_delay
        self.session = requests.Session()

    def _post(self, path, json_body, field_mask):
        url = f"{BASE_URL}/{path}"
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": self.api_key,
            "X-Goog-FieldMask": field_mask,
        }
        last_exc = None
        for attempt in range(1, self.max_retries + 1):
            try:
                resp = self.session.post(url, json=json_body, headers=headers, timeout=20)
                if resp.status_code == 429:
                    time.sleep(self.backoff * attempt)
                    continue
                resp.raise_for_status()
                time.sleep(self.request_delay)
                return resp.json()
            except requests.RequestException as exc:
                last_exc = exc
                time.sleep(self.backoff * attempt)
        raise RuntimeError(f"Falha ao consultar {url}: {last_exc}")

    def _get(self, path, field_mask):
        url = f"{BASE_URL}/{path}"
        headers = {
            "X-Goog-Api-Key": self.api_key,
            "X-Goog-FieldMask": field_mask,
        }
        last_exc = None
        for attempt in range(1, self.max_retries + 1):
            try:
                resp = self.session.get(url, headers=headers, timeout=20)
                if resp.status_code == 429:
                    time.sleep(self.backoff * attempt)
                    continue
                resp.raise_for_status()
                time.sleep(self.request_delay)
                return resp.json()
            except requests.RequestException as exc:
                last_exc = exc
                time.sleep(self.backoff * attempt)
        raise RuntimeError(f"Falha ao consultar {url}: {last_exc}")

    def text_search(self, query, page_token=None):
        body = {"textQuery": query, "languageCode": "pt-BR"}
        if page_token:
            body["pageToken"] = page_token
        return self._post("places:searchText", body, SEARCH_FIELD_MASK)

    def text_search_all(self, query):
        """Pagina textSearch até esgotar (Places New pagina até 60 resultados, 3 páginas de 20)."""
        results = []
        page_token = None
        while True:
            data = self.text_search(query, page_token=page_token)
            results.extend(data.get("places", []))
            page_token = data.get("nextPageToken")
            if not page_token:
                break
            time.sleep(2.0)
        return results

    def place_details(self, place_id):
        return self._get(f"places/{place_id}", DETAILS_FIELD_MASK)
