import asyncio
import json
import random
import websockets

#################################################### Constants

ADDR = 'ws://34.105.119.88:15024'   # Public address + port of server machine
DISCON_MSG = "!DISCONNECT"          # String to send to cleanly disconnect from the server

# vvv For local testing only (comment out when testing on server)
# ADDR = 'ws://localhost:15024'

####################################################

async def Send(websocket, msg):
    await websocket.send(msg)

# Make sure to clear the collection before testing the next test case!
async def Start():
    async with websockets.connect(ADDR) as websocket:
        await Send(websocket, json.dumps({"op":"RefreshLot"}))
        message = await websocket.recv;
        print(message)
'''
    # Test Case 0 - Create an account with a duplicate name
        await Send(websocket, json.dumps({"op":"CreateAccount", "name":"Ian", "passwd":"Password"}))
        await Send(websocket, json.dumps({"op":"CreateAccount", "name":"Ian", "passwd":"Password123"}))


    # Test Case 1 - Everything goes correct
        await Send(websocket, json.dumps({"op":"CreateAccount", "name":"Ian", "passwd":"Password"}))
        await Send(websocket, json.dumps({"op":"UpdateName", "name":"Ian", "passwd":"Password", "newName":"NewName"}))
        await Send(websocket, json.dumps({"op":"UpdatePass", "name":"NewName", "passwd":"Password"," newPass":"NewPass"}))

    # Test Case 2 - New name is a duplicate
        await Send(websocket, json.dumps({"op":"CreateAccount", "name":"Ian", "passwd":"Password"}))
        await Send(websocket, json.dumps({"op":"UpdateName", "name":"Ian", "passwd":"Password", "newName":"Ian"}))


    # Test Case 3 - Password is incorrect
        await Send(websocket, json.dumps({"op":"CreateAccount", "name":"Ian", "passwd":"Password"}))
        await Send(websocket, json.dumps({"op":"UpdateName", "name":"Ian", "passwd":"WrongPass", "newName":"NewName"}))
        await Send(websocket, json.dumps({"op":"UpdatePass", "name":"Ian", "passwd":"WrongPass"," newPass":"NewPass"}))
        

    # Test Case 4 - Username is incorrect 
        await Send(websocket, json.dumps({"op":"CreateAccount", "name":"Ian", "passwd":"Password"}))
        await Send(websocket, json.dumps({"op":"UpdateName", "name":"WrongUser", "passwd":"Password", "newName":"NewName"}))
        await Send(websocket, json.dumps({"op":"UpdatePass", "name":"WrongUser", "passwd":"Password"," newPass":"NewPass"}))


        await Send(websocket, DISCON_MSG)
'''
    
    

    

asyncio.run(Start())