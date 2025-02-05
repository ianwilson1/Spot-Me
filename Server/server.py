import bcrypt
import json
import pymongo
import asyncio
import websockets
import ret

#################################################### Constants

PORT = 15024
DISCONNECT_MESSAGE = "!DISCONNECT"

DB_CLIENT = pymongo.MongoClient('localhost', 27017)
DB = DB_CLIENT['SpotMeDB']
USERS_COL = DB['userData']
SPOTS_COL = DB['spots']

#################################################### Server-side helper functions

def ValidatePassword(passwd):
    # 8 characters in length minimum 
    if len(passwd) < 8:
        print("Password is not at least 8 characters long!")
        return "short_pass"
        
    # at least one number
    if not re.search(r"\d", passwd):
        print("Password needs at least one number!")
        return "no_num"
    
    # at least one capital letter
    if not re.search(r"[A-Z]", passwd):
        print("Password needs at least one capital letter!")
        return "no_caps"
    
    # at least one non-alphanumeric character
    if not re.search(r"[^\w]", passwd): 
        print("Password needs at least one special character!")
        return "no_spec_chars"
    
    # passes all cases
    return "valid"

def hash_password(password): #encrypts user's password
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_password

def UserAuthenticate(name, passwd):
    user = USERS_COL.find_one({"name": name}) # Finds a user by their unique username

    if not user:
        return "null_user"
    
    if not bcrypt.checkpw(passwd.encode("utf-8"), user['pass']):
        return "invalid_pass"

    return "valid"

async def CongestionCalc(id):
    sum = 0
    lot = SPOTS_COL.find_one({"spaces": {"$elemMatch": {"space_id": id}}})

    lot_length = len(lot['spaces']) # Total parking spaces in lot

    for spots in lot['spaces']: # Counts how many lots are occupied at time of call
        if spots['status'] == 1 or spots['status'] == 2:
           sum = sum + 1

    SPOTS_COL.update_one({"spaces": {"$elemMatch": {"space_id": id}}}, {"$set": {"congestion_percent": sum / lot_length }}) # Update congestion field with sum of filled lots by total spaces

#################################################### Server<->Client Functions

async def Login(name, passwd):                                  ## TODO: Send the user's data when they log in!
    print(f"[OPERATION] Login({name})")

    authStatus = UserAuthenticate(name, passwd)

    if authStatus != "valid":
        print("[LOGIN] Login failed: " + authStatus)
        return authStatus, {}
    
    userData = USERS_COL.find_one({"name":name}, {"pass": 0, "permits":1})                                          ## TODO: retrieved user data goes here

    return authStatus, userData
    
async def UpdateSpot(id, status): 
    print(f"[OPERATION] UpdateSpot({id},{status})")
    filter = {"spaces.space_id": id} # Find spot
    update = {"$set": {"spaces.$.status": status}} # Set new status; # 0 = empty, 1 = full, 2 = soft reserved
    
    SPOTS_COL.update_one(filter, update) # Update document
    await CongestionCalc(id) # Update congestion level of lot
    print("[UPD_SPOT] Updated spot successfully.")

async def CreateAccount(name, passwd): 
    print(f"[OPERATION] CreateAccount({name})")

    if (USERS_COL.find_one({"name": name})): # Only make a new account if the username is unique
        print("[CRTE_ACC] User already exists.")
        return "name_used"

    passwordValidationStatus = ValidatePassword(passwd)
    
    if passwordValidationStatus != "valid":
        print("[CRTE_ACC] Password requirements not met: " + passwordValidationStatus)
        return passwordValidationStatus
    
    hashed_password = hash_password(passwd) # Create the hashed password
    
    user = { # Set document
        "name": name,
        "pass": hashed_password,
        "permits": [False, False, False, False, False] # [green,yellow,black,gold,handicap]
    }

    USERS_COL.insert_one(user) # Insert document
    print("[CRTE_ACC] New user created successfully.")
    return "account_created"

async def UpdateName(name, passwd, newName):
    print(f"[OPERATION] UpdateName({name},{newName})")

    if (USERS_COL.find_one({"name": newName})): # Ensures new username is unique
        print("[UPD_NAME] User already exists.")
        return "name_used"
    
    authStatus = UserAuthenticate(name, passwd)

    if authStatus == "valid":
        filter = {"name": name} # Find document with old name
        update = {"$set": {"name": newName}} # Set new name
        USERS_COL.update_one(filter, update) # Update document
        print("[UPD_NAME] New username is set!")
        return "updated_name"
    else:
        print("[UPD_NAME] Authentication failed: " + authStatus)
        return authStatus

async def UpdatePass(name, passwd, newPass):
    print(f"[OPERATION] UpdatePass({name})")
    
    authStatus = UserAuthenticate(name, passwd) # Check user's name and password

    if authStatus == "valid":
        if passwd == newPass: # Make sure the new password is not the same as the old password
            print("[UPD_PASS] new password is the same as the old one.")
            return "same_pass"

        passwordValidationStatus = ValidatePassword(newPass)

        if passwordValidationStatus != "valid":
            print("[UPD_PASS] Password requirements not met: " + passwordValidationStatus)
            return passwordValidationStatus

        hashed_password = hash_password(newPass) # Hash new password
        filter = {"name": name} # Find document
        update = {"$set": {"pass": hashed_password}} # Set new password
        USERS_COL.update_one(filter, update) # Push update to that document
        print("[UPD_PASS] New password set!")
        return "pass_updated"

    else:
        print("[UPD_PASS] Failed authentication: " + authStatus)
        return authStatus
        
async def RefreshData():
    print('[OPERATION] RefreshData()')
    try:
        data = list(SPOTS_COL.find({}, {'_id': False})) # Updated parking spot/lot information (congestion, occupancy);
        print(f'[REFR_DATA] Retrieved {len(data)} records from the DB.')
        return "data_retrieved", json.dumps(data)
    
    except Exception as e:
        print('[REFR_DATA]: {e}')
        return "data_error", ""
    
async def UpdatePermits(name, newPermits):                        
    print(f'[OPERATION] UpdatePermits({name},{newPermits})')
    # [green,yellow,black,gold,handicap]

    filter = {"name": name}
    update = {"$set": {"permits": newPermits}}
        
    result = USERS_COL.update_one(filter, update)
        
    if result.modified_count > 0:
        print("[UPD_PERM] Permits updated successfully!")
        return "permits_updated"
    else:
        print("[UPD_PERM] Permits not updated.")
        return "permits_unchanged"

async def DeleteAccount(name, passwd):                      
    print(f'[OPERATION] DeleteAccount({name})')
    
    authStatus = UserAuthenticate(name, passwd)

    if authStatus == "valid":
        filter = {"name": name}
        result = await USERS_COL.delete_one(filter)
        print(f"[DEL_ACC] Account deleted successfully.")
        return "account_deleted"
    else:
        print("[DEL_ACC] Failed authentication: " + authStatus)
        return authStatus
 
#################################################### Websocket message handling; calls appropriate functions from JSON encoded messages

async def HandleOperation(websocket, rcvdJson):
    try:
        if rcvdJson["op"] == "Login":
            name = rcvdJson["name"]
            passwd = rcvdJson["passwd"]
            status = await Login(name, passwd)
            await websocket.send(json.dumps({"status": status, "userData":userData}))

        elif rcvdJson["op"] == "UpdateSpot":
            id = rcvdJson["id"]
            status = rcvdJson["status"]
            await UpdateSpot(id, status)

        elif rcvdJson["op"] == "CreateAccount":
            name = rcvdJson["name"]
            passwd = rcvdJson["passwd"]
            status = await CreateAccount(name, passwd)
            await websocket.send(json.dumps({"status": status}))

        elif rcvdJson["op"] == "UpdateName":
            name = rcvdJson["name"]
            passwd = rcvdJson["passwd"]
            newName = rcvdJson["newName"]
            status = await UpdateName(name, passwd, newName)
            await websocket.send(json.dumps({"status": status}))
            
        elif rcvdJson["op"] == "UpdatePass":
            name = rcvdJson["name"]
            passwd = rcvdJson["passwd"]
            newPass = rcvdJson["newPass"]
            status = await UpdatePass(name, passwd, newPass)
            await websocket.send(json.dumps({"status": status}))

        elif rcvdJson["op"] == "RefreshData":
            status, data = await RefreshData()
            await websocket.send(json.dumps({"status":status, "data": data}))

        elif rcvdJson["op"] == "UpdatePermits":
            name = rcvdJson["name"]
            newPermits = rcvdJson["permits"]
            status = await UpdatePermits(name, newPermits)
            await websocket.send(json.dumps({"status":status}))

        elif rcvdJson["op"] == "DeleteAccount":
            name = rcvdJson["name"]
            passwd = rcvdJson["passwd"]
            status = await DeleteAccount(name,passwd)
            await websocket.send(json.dumps({"status": status}))
            
    except websockets.exceptions.ConnectionClosedError:
        print("[HANDLE_OP] Connection closed while handling operation.")
    except websockets.exceptions.ConnectionClosedOK:
        print("[HANDLE_OP] Connection closed with OK status.")
    except Exception as e:
        print(f"[HANDLE_OP] Unexpected error: {e}")


    # TODO: Create branches for the rest of the operations

async def HandleMsg(websocket):
    async for msg in websocket:
        if msg == DISCONNECT_MESSAGE:
            return
        
        rcvdJson = json.loads(msg)
        await HandleOperation(websocket, rcvdJson)

#################################################### Database initialization (for resetting the server-side information)

async def InitDB():
    ### TODO: Make sure to change later to implement as many spots and lots as needed
    
    if (SPOTS_COL.count_documents({}) > 0):
        return
    
    print('[DATABASE] No parking lot info found, reinitializing database')
    lots = [
        {
            "spaces": [{"space_id": j + 1, "status": 0 } for j in range(1251)],
            "lot_id": "P6",
            "congestion_percent": 0
        },
        {
            "spaces": [{"space_id": j + 1, "status": 0 } for j in range(1252,1873)],
            "lot_id": "P5",
            "congestion_percent": 0
        }
    ]
    
    SPOTS_COL.insert_many(lots) # Insert array of lots

#################################################### Server startup

async def Start():
    await InitDB()
    async with websockets.serve(HandleMsg, '0.0.0.0', PORT) as server:
        print(f"[LISTENING] Server listening on port {PORT}")
        await server.serve_forever()

print("[STARTING]")
asyncio.run(Start())