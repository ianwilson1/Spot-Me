import asyncio
import json
import random
import websockets

#################################################### Constants

ADDR = 'ws://34.169.42.70:15024'   # Public address + port of server machine
DISCON_MSG = "!DISCONNECT"          # String to send to cleanly disconnect from the server

MAX_SPOTS = 1251                     # ONLY FOR P6; P5 will be manually updated to test pin colors

# vvv For local testing only (comment out when running on server)
# ADDR = 'ws://localhost:15024'

####################################################

async def Send(websocket, msg):
    await websocket.send(msg)
    response = await websocket.recv()
    return response

async def Start():
    async with websockets.connect(ADDR) as websocket:

        # Summary of operation:
        #   - Pick a random spot from the list of spots by ID.
        #   - Initialize a "ParkingSpot" dictionary object initialized with this ID
        #     and a random state to change it to (0 = free, 1 = occupied, 2 = reserved)
        #   - Stringify this dictionary into a JSON string.
        #   - Send this JSON string to the server.
        #   - Repeat every second.

        while True:
            spotID = random.randint(1, MAX_SPOTS)

            updSpotInfo = {
                "op": "UpdateSpot",
                "id": spotID,
                "status": random.randint(0,2),
            }
            
            msg = json.dumps(updSpotInfo)
            print(f"[OUTBOUND] {msg}")
            response = await Send(websocket, msg)
            print(f"[RECEIVED] {response}")

            await asyncio.sleep(1)

asyncio.run(Start())