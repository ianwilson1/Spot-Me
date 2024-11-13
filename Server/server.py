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

def hash_password(password): # Password security, will hash a given passed in password
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_password

def userAuthenticate(name, passwd):
    user = USERS_COL.find_one({"name": name}) # Finds a user by their unique username

    if (user): # Checks password for user
        if bcrypt.checkpw(passwd.encode("utf-8"), user['pass']):
            return user # Return if both username and password check out
        else:
            print("[ERROR] Wrong password :(")
    else:
        print("[ERROR] User could not be found :(")


async def congestionCalc(id): # Calculate the current congestion % of a given lot, identified by space id
    sum = 0
    lot = SPOTS_COL.find_one({"spaces": {"$elemMatch": {"space_id": id}}})

    lot_length = len(lot['spaces']) # Total parking spaces in lot

    for spots in lot['spaces']: # Counts how many lots are occupied at time of call
        if spots['status'] == 1 or spots['status'] == 2:
           sum = sum + 1

    SPOTS_COL.update_one({"spaces": {"$elemMatch": {"space_id": id}}}, {"$set": {"congestion_percent": sum / lot_length }}) # Update congestion field with sum of filled lots by total spaces

async def Login(name, passwd): # Function to return whether a login is successful or not
    print(f"[OPERATION] logIn({name},{passwd})")
    user = USERS_COL.find_one({"name": name}) # Find a user by given name; names are unique
    
    if (user):
        if bcrypt.checkpw(passwd.encode('utf-8'), user["pass"]):
            print("[SUCCESS] Login successful!")
            return True
        else:
            print("[ERROR] Login failed.")
            return False
    else: 
        print("[ERROR] User not found.")
        return False
    
async def UpdateSpot(id, status): # Function to update the parking status of a lot; 0 = empty, 1 = full, 2 = soft reserved

    print(f"[OPERATION] UpdateSpot({id},{status})")
    filter = {"spaces.space_id": id} # Find spot
    update = {"$set": {"spaces.$.status": status}} # Set new status
    
    SPOTS_COL.update_one(filter, update) # Update document
    await congestionCalc(id) # Update congestion level of lot

async def CreateAccount(name, passwd): 
    print(f"[OPERATION] CreateAccount({name},{passwd})")

    if (USERS_COL.find_one({"name": name})): # Only make a new account if the username is unique
        print("[ERROR] User already exists.")
        return False
    
    hashed_password = hash_password(passwd) # Create the hashed password
    
    user = { # Set document
        "name": name,
        "pass": hashed_password
    }

    USERS_COL.insert_one(user) # Insert document
    return True 

async def UpdateName(name, passwd, newName):                    # FIXME: does not check password!
    print(f"[OPERATION] UpdateName({name},{passwd},{newName})")

    if (USERS_COL.find_one({"name": newName})): # Ensures new username is unique
        print("[ERROR] User already exists.")
        return False
    
    user = userAuthenticate(name, passwd) # Check user's name and password

    if (user):
        filter = {"name": name} # Find document with old name
        update = {"$set": {"name": newName}} # Set new name
        USERS_COL.update_one(filter, update) # Update document
        print("New username is set!")
        return True
    else:
        print("[ERROR] could not verify user")

async def UpdatePass(name, passwd, newPass):                              # FIXME: does not check username!
    print(f"[OPERATION] CreateAccount({name},{passwd},{newPass})")
    
    user = userAuthenticate(name, passwd) # Check user's name and password

    if (user):
        filter = {"name": name} # Find document
        update = {"$set": {"pass": newPass}} # Set new password
        USERS_COL.update_one(filter, update) # Push update to that document
        print("[SUCCESS] New password set!")
        return True
    else:
        print("[ERROR] could not verify")

    

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
            return
        
        rcvdJson = json.loads(msg)
        await HandleOperation(websocket, rcvdJson)


async def InitDB():
    ### TODO: Make sure to change later to implement as many spots and lots as needed
    ## Example lot for testing with 10 lots
    if (SPOTS_COL.count_documents({}) > 0):
        return
    
    lots = [] # Set array
    lot = { # Example lot
        "lot_id": "P_example",
        "permit_required": 0,
        "spaces": [{"space_id": j + 1, "status": 0, "isHandicap" : 0} for j in range(300)],
        "congestion_percent": 0
    }
    
    lots.append(lot) # Just one append for now, incorporate loop for # of lots
    SPOTS_COL.insert_many(lots) # Insert array of lots

async def Start():
    await InitDB()
    async with websockets.serve(HandleMsg, '0.0.0.0', PORT) as server:
        print(f"[LISTENING] Server listening on port {PORT}")
        await server.serve_forever()


print("[STARTING]")
asyncio.run(Start())