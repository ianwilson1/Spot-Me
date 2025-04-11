import asyncio
import json
import random
import websockets

#################################################### Constants

ADDR = 'ws://34.169.42.70:15024'   # Public address + port of server machine
DISCON_MSG = "!DISCONNECT"          # String to send to cleanly disconnect from the server

# vvv For local testing only (comment out when running on server)
# ADDR = 'ws://localhost:15024'

####################################################

async def Send(websocket, msg):
    await websocket.send(msg)
    response = await websocket.recv()
    return response

async def Start():
    async with websockets.connect(ADDR) as websocket:

        userInput = input("Input 'red','yellow', or 'green': ")
        print("Batch updating P5... (takes a sec, dw)")

        for i in range(1252,1873):

            chance = random.random()

            if (userInput == 'red' and chance < 0.99)       \
            or (userInput == 'yellow' and chance < 0.75)    \
            or (userInput == 'green' and chance < 0.3):
                status = 1
            else:
                status = 0

            updSpotInfo = {
                "op": "UpdateSpot",
                "id": i,
                "status": status
            }
            
            msg = json.dumps(updSpotInfo)
            await Send(websocket, msg)

            await asyncio.sleep(0.001)

    print("Done.")

asyncio.run(Start())