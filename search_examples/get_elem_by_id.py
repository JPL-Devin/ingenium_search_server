import requests
import json

params = {
    'pretty': 'true'
}

elem_id = 'a96f2b10-1a94-4de6-a45c-03d2f18b29f8'
url = f'http://localhost:19200/element/_doc/{elem_id}'

res = requests.get(url, params=params)
print(f'status_code: {res.status_code}')
print(json.dumps(res.json(), indent=4))

