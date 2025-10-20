import asyncio
import websockets

async def main():
    uri = "ws://localhost:8080"
    async with websockets.connect(uri) as ws:
        print('Connected to', uri)
        try:
            while True:
                msg = await ws.recv()
                print('Received:', msg)
        except Exception as e:
            print('Connection closed:', e)

if __name__ == '__main__':
    asyncio.run(main())
