from urllib.error import HTTPError
from urllib.request import urlopen


try:
    urlopen("http://127.0.0.1:4321/api/scout?shadow=true&origin=DFW&trip_length=2,4")
except HTTPError as error:
    body = error.read().decode("utf-8")
    assert error.code == 500
    assert "SERP_API_KEY is not set" in body
else:
    raise AssertionError("Expected the local scout endpoint to fail closed without SERP_API_KEY")
