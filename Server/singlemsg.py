import asyncio
import json
import websockets

#################################################### Constants

ADDR = 'ws://34.169.42.70:15024'   # Public address + port of server machine
DISCON_MSG = "!DISCONNECT"          # String to send to cleanly disconnect from the server

# vvv For local testing only (comment out when running on server)
#ADDR = 'ws://localhost:15024'

####################################################

async def Send(websocket, msg):
    await websocket.send(msg)
    response = await websocket.recv()
    return response

async def Start():
    async with websockets.connect(ADDR) as websocket:

        msg = {
            "op": "ReserveSpot",
            "op": "UpdateSpot",
            "id": 19,
            "status": 1
        }
        
        msg = json.dumps(msg)
        print(f"[OUTBOUND] {msg}")
        response = await Send(websocket, msg)
        print(f"[RECEIVED] {response}")

asyncio.run(Start())