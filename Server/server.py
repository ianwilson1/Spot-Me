# List of operations:
#   - UpdateSpot: update a spot's occupancy status
#   - CreateAccount: create a new account
#   - UpdateName: update a user's name
#   - UpdatePass: update a user's password
#   - UpdatePermit: update a user's list of permits

import bcrypt
import json
import pymongo
import asyncio
import websockets

#################################################### Constants
PORT = 15024
DISCONNECT_MESSAGE = "!DISCONNECT"

DB_CLIENT = pymongo.MongoClient('localhost', 27017)
DB = DB_CLIENT['SpotMeDB']
USERS_COL = DB['userData']
SPOTS_COL = DB['spots']
####################################################

def hash_password(password): # Password security
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_password

async def congestionCalc(id):
    lot = SPOTS_COL.find_one({"spaces": {"$elemMatch": {"space_id": id}}})
    print(lot)

    #lot_length = lot.spaces.len()
    #print(lot_length)

    #for spots in lot.spaces:
    #    if spots.status == 1 or spots.status == 2:
    #       sum = sum + 1

    SPOTS_COL.lot.update_one()

async def Login(name, passwd):
    print(f"[OPERATION] logIn({name},{passwd})")
    user = USERS_COL.find_one({"name": name})
    
    if (user):
        if bcrypt.checkpw(passwd.encode('utf-8'), user["pass"]):
            print("Login successful!")
            return True
        else:
            print("Login failed.")
            return False
    else:
        print("User not found.")
        return False
    
async def UpdateSpot(id, status):

    print(f"[OPERATION] UpdateSpot({id},{status})")
    filter = {"spaces.space_id": id}
    update = {"$set": {"spaces.$.status": status}}
    
    SPOTS_COL.update_one(filter, update)
    await congestionCalc(id)

async def CreateAccount(name, passwd):
    print(f"[OPERATION] CreateAccount({name},{passwd})")

    # Only make a new account if the username is unique
    if (USERS_COL.find_one({"name": name})):
        print("Error: user already exists.")
        return False
    
    hashed_password = hash_password(passwd)
    
    user = {
        "name": name,
        "pass": hashed_password
    }

    USERS_COL.insert_one(user)
    return True

async def UpdateName(name, passwd, newName):                    # FIXME: does not check password!
    print(f"[OPERATION] UpdateName({name},{passwd},{newName})")

    if (USERS_COL.find_one({"name": newName})):
        print("Error: name in use")
        return False
    
    filter = {"name": name}
    update = {"$set": {"name": newName}}

    USERS_COL.update_one(filter, update)
    return True

async def UpdatePass(name, passwd, newPass):                              # FIXME: same thing
    print(f"[OPERATION] CreateAccount({name},{passwd},{newPass})")
    filter = {"pass": passwd}
    update = {"$set": {"pass": newPass}}

    USERS_COL.update_one(filter, update)

async def HandleOperation(websocket, rcvdJson):
    if rcvdJson["op"] == "Login":
        name = rcvdJson["name"]
        passwd = rcvdJson["passwd"]
        success = await Login(name, passwd)
        await websocket.send(json.dumps({"success": success}))

    elif rcvdJson["op"] == "UpdateSpot":
        id = rcvdJson["id"]
        status = rcvdJson["status"]
        await UpdateSpot(id, status)
        await websocket.send(json.dumps({"status": "updated"}))

    elif rcvdJson["op"] == "CreateAccount":
        name = rcvdJson["name"]
        passwd = rcvdJson["passwd"]
        success = await CreateAccount(name, passwd)
        await websocket.send(json.dumps({"success": success}))

    elif rcvdJson["op"] == "UpdateName":
        name = rcvdJson["name"]
        passwd = rcvdJson["passwd"]
        newName = rcvdJson["newName"]
        success = await UpdateName(name, passwd, newName)
        await websocket.send(json.dumps({"success": success}))
        
    elif rcvdJson["op"] == "UpdatePass":
        name = rcvdJson["name"]
        passwd = rcvdJson["passwd"]
        newPass = rcvdJson["newPass"]
        success = await UpdatePass(name, passwd, newPass)
        await websocket.send(json.dumps({"success": success}))


    # TODO: Create branches for the rest of the operations

async def HandleMsg(websocket):
    async for msg in websocket:
        if msg == DISCONNECT_MESSAGE:
            break
        
        rcvdJson = json.loads(msg)
        await HandleOperation(websocket, rcvdJson)


async def InitDB():
    ### TODO: Make sure to change later to implement as many spots and lots as needed
    ## Example lot for testing with 10 lots
    if (SPOTS_COL.count_documents({}) > 0):
        return
    
    lots = [] 
    lot = {
        "lot_id": "P_example",
        "permit_required": 0,
        "spaces": [{"space_id": j + 1, "status": 0, "isHandicap" : 0} for j in range(10)],
        "congestion_percent": 0
    }
    
    lots.append(lot)
    SPOTS_COL.insert_many(lots)

async def Start():
    await InitDB()
    async with websockets.serve(HandleMsg, '0.0.0.0', PORT) as server:
        print(f"[LISTENING] Server listening on port {PORT}")
        await server.serve_forever()


print("[STARTING]")
asyncio.run(Start())