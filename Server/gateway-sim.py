import asyncio
import json
import random
import websockets

#################################################### Constants

ADDR = 'ws://34.105.119.88:15024'   # Public address + port of server machine
DISCON_MSG = "!DISCONNECT"          # String to send to cleanly disconnect from the server

MAX_SPOTS = 10                      # Number of parking spots we currently have implemented. CHANGE AS NEEDED

# vvv For local testing only (comment out when testing on server)
ADDR = 'ws://localhost:15024'

####################################################

async def Send(websocket, msg):
    await websocket.send(msg)

async def Start():
    async with websockets.connect(ADDR) as websocket:

        # Summary of operation:
        #   - Pick a random spot from the list of spots by ID.
        #   - Initialize a "ParkingSpot" dictionary object initialized with this ID
        #     and a random state to change it to (0 = free, 1 = occupied, 2 = reserved)
        #   - Stringify this dictionary into a JSON string.
        #   - Send this JSON string to the server.
        #   - Repeat every 3 seconds.

        while True:
            spotID = random.randint(1, MAX_SPOTS)

            updSpotInfo = {
                "op": "UpdateSpot",
                "id": spotID,
                "status": random.randint(0,2),
            }
            
            msg = json.dumps(updSpotInfo)
            print(f"[OUTBOUND] {msg}")
            await Send(websocket, msg)

            await asyncio.sleep(3)

asyncio.run(Start())