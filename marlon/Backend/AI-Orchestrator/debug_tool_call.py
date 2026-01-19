import asyncio
import os

from app.tools import ToolClient, ToolRegistry

async def main():
    # Read config from env or use defaults in app.config
    # Set ORCHESTRATOR_TOOLS_API_KEY or TOOLS_API_KEY in env when running integration
    client = ToolClient()
    registry = ToolRegistry(client)

    try:
        print('Calling buscar_productos...')
        res = await registry.execute('buscar_productos', {'q': 'Test', 'categoria': 'Cat'})
        print('buscar_productos result:', res)
    except Exception as e:
        print('Error calling buscar_productos:', e)

    try:
        print('Calling obtener_cliente with a dummy user_id...')
        res = await registry.execute('obtener_cliente', {'user_id': '11111111-1111-1111-1111-111111111111'})
        print('obtener_cliente result:', res)
    except Exception as e:
        print('Error calling obtener_cliente:', e)

    await client.close()


if __name__ == '__main__':
    asyncio.run(main())