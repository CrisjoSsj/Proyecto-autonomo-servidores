import requests
import json
import base64

# URL del servidor GraphQL
# Por defecto Next.js usa puerto 3000, pero puedes cambiarlo con: npm run dev -- -p 3002
url = 'http://localhost:3000/api/graphql'

# Query GraphQL
query = {
    'query': '''
    query {
        reportePDF(periodo: "hoy")
    }
    '''
}

print("🚀 Enviando query a GraphQL en:", url)
print("📤 Query:", query['query'])

try:
    response = requests.post(url, json=query, headers={'Content-Type': 'application/json'})
    print(f"✅ Response status: {response.status_code}")
    
    data = response.json()
    
    if 'errors' in data and data['errors']:
        print(f"❌ GraphQL errors: {data['errors']}")
    else:
        pdf_base64 = data.get('data', {}).get('reportePDF')
        
        if pdf_base64:
            print(f"✅ PDF base64 recibido, tamaño: {len(pdf_base64)} caracteres")
            
            # Intentar guardar el PDF
            pdf_data = base64.b64decode(pdf_base64)
            print(f"✅ PDF decodificado, tamaño: {len(pdf_data)} bytes")
            
            with open('reporte-operacional.pdf', 'wb') as f:
                f.write(pdf_data)
            print("✅ PDF guardado como 'reporte-operacional.pdf'")
        else:
            print("❌ No se recibió datos del PDF")
            
except Exception as e:
    print(f"❌ Error: {e}")
