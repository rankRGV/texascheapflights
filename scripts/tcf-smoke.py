import re
import time
from urllib.request import urlopen

try:
    from playwright.sync_api import sync_playwright
except ModuleNotFoundError:
    sync_playwright = None


BASE_URL = "http://127.0.0.1:4321"
PATHS = ["/", "/past-deals", "/guides/dfw", "/blog", "/sitemap-index.xml"]


def main():
    if sync_playwright is None:
        run_http_fallback()
        return

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page()
        for path in PATHS:
            response = page.goto(BASE_URL + path, wait_until="networkidle")
            assert response is not None and response.ok, f"{path}: HTTP failure"
            if path.endswith(".xml"):
                assert "urlset" in page.content(), f"{path}: sitemap body missing"
                continue

            assert page.title(), f"{path}: missing title"
            assert page.locator('link[rel="canonical"]').count() == 1, f"{path}: canonical missing"
            assert page.locator('script[src*="googletagmanager.com/gtag/js"]').count() == 1, (
                f"{path}: analytics loader missing or duplicated"
            )

        page.goto(BASE_URL + "/", wait_until="networkidle")
        assert page.locator('form[data-tcf-form="homepage_waitlist"]').count() == 1
        assert page.locator('[data-tcf-event="cta_clicked"]').count() >= 1
        assert "Active email subscribers" in page.text_content("body")
        browser.close()


def run_http_fallback():
    for path in PATHS:
        body = ""
        for attempt in range(3):
            try:
                with urlopen(BASE_URL + path, timeout=20) as response:
                    assert response.status == 200, f"{path}: HTTP failure"
                    body = response.read().decode("utf-8")
                break
            except ConnectionResetError:
                if attempt == 2:
                    raise
                time.sleep(1)
        if path.endswith(".xml"):
            assert "urlset" in body, f"{path}: sitemap body missing"
            continue

        assert re.search(r"<title>[^<]+</title>", body), f"{path}: missing title"
        assert len(re.findall(r'<link[^>]+rel="canonical"', body)) == 1, (
            f"{path}: canonical missing"
        )
        assert len(re.findall(r"googletagmanager\.com/gtag/js", body)) == 1, (
            f"{path}: analytics loader missing or duplicated"
        )

    with urlopen(BASE_URL + "/", timeout=20) as response:
        body = response.read().decode("utf-8")
    assert 'data-tcf-form="homepage_waitlist"' in body
    assert 'data-tcf-event="cta_clicked"' in body
    assert "Active email subscribers" in body


if __name__ == "__main__":
    main()
