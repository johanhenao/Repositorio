import requests

url = 'http://localhost:3002/send-message'
data = {
    'message': 'Hola bot funcional',
    'phoneNumber': '573171848859'  # Número en formato internacional
}

headers = {
    'Content-Type': 'application/json'
}

response = requests.post(url, json=data, headers=headers)

# Imprimir la respuesta del servidor
print(response.text)
