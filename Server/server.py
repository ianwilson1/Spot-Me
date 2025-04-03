import asyncio
import bcrypt
import json
import pymongo
from datetime import datetime
import websockets
import re

#################################################### Constants

PORT = 15024
DISCONNECT_MESSAGE = "!DISCONNECT"

DB_CLIENT = pymongo.MongoClient('localhost', 27017)
DB = DB_CLIENT['spotme']
USERS_COL = DB['users']
SPOTS_COL = DB['lots']

REGISTERED_LOTS = ["P6","P5"]

#################################################### Server-side helper functions

async def UpdCongAvg(lot, week, day, index):
    print(f"[UPD_CONG_AVG] Updating congestion average for {lot}")
    key = f"histData.{day}"
    doc = SPOTS_COL.find_one({"lot_id": lot}, {key:1, "_id": 0})
    congHist = doc["histData"][day]

    sum = 0
    divisor = 0

    for i in range(0,4):
        sum += congHist[i][index] if congHist[i][index] != -1 else 0
        divisor += 1 if congHist[i][index] != -1 else 0

    # if no data exists for that day in any of the 4 weeks, set the average to 0
    if divisor == 0:
        avg = -1
    else:
        avg = sum / divisor

    avg = sum / divisor

    key = f"avgCong.{day}.{index}"
    SPOTS_COL.update_one(
        {"lot_id": lot},
        {"$set": {key:avg}}
    )

    print(f"[UPD_CONG_AVG] Successfully updated {lot}.")

async def UpdLotCongHist(lot, key):
    doc = SPOTS_COL.find_one({"lot_id": lot}, {"congestion_percent": 1, "_id": 0})
    currCong = doc["congestion_percent"]
    SPOTS_COL.update_one(
        {"lot_id": lot},
        {"$set": {key: currCong}}
    )

async def UpdCongHist():
    print('[UPD_CONG_HIST] Updating congestion history!')

    currTime = datetime.now()
    currDay = currTime.weekday() # 0 - 6, Monday - Sunday
    currHour = currTime.hour
    currMinute = currTime.minute

    currDayStr = "monday"    if currDay == 0 else   \
                 "tuesday"   if currDay == 1 else   \
                 "wednesday" if currDay == 2 else   \
                 "thursday"  if currDay == 3 else   \
                 "friday"

    doc = SPOTS_COL.find_one({"lot_id": "P6"}, {"histData.weekNumber": 1, "_id": 0})
    currWeekOfHist = doc["histData"]["weekNumber"] if doc else None

    if currWeekOfHist == None:
        print('[UPD_CONG_HIST] No document returned, doing nothing!')
        return
    
    currIndex = (currHour - 6) * 2 + (0 if currMinute >= 0 and currMinute < 30 else 1)

    # Update each lot's congestion history and then calculate the average over 4 weeks
    for lot in REGISTERED_LOTS:
        key = f"histData.{currDayStr}.{currWeekOfHist}.{currIndex}"
        await UpdLotCongHist(lot, key)

        key = f"avgCong.{currDayStr}.{currIndex}"
        await UpdCongAvg(lot, currWeekOfHist, currDayStr, currIndex)

    # Increment current week of congestion history if its the last day of the week and the last time slot
    if currDay == 4 and currIndex == 31:
        newCurrWeek = currWeekOfHist + 1 if currWeekOfHist < 3 else 0
        SPOTS_COL.update_one(
            {"lot_id": "P6"},
            {"$set": {"histData.weekNumber": newCurrWeek}}
        )

async def UpdCongHistLoop():
    print('[STARTUP] Running congestion history update loop.')
    while True:
        await asyncio.sleep(60)

        currTime = datetime.now()

        if currTime.weekday() == 5 or currTime.weekday() == 6: # Ignore weekends
            continue
        if currTime.hour < 6 or currTime.hour >= 22: # Ignore times outside of 6am - 10pm
            continue
        if currTime.minute != 0 and currTime.minute != 30: # Ignore times that aren't X:00 or X:30
            continue

        await UpdCongHist()

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

async def Login(name, passwd):
    print(f"[OPERATION] Login({name})")

    authStatus = UserAuthenticate(name, passwd)

    if authStatus != "valid":
        print("[LOGIN] Login failed: " + authStatus)
        return authStatus, ""
    
    userData = json.dumps(USERS_COL.find_one({"name":name}, {"_id": 0,"pass": 0}))
    print(userData)

    return authStatus, userData
    
async def UpdateSpot(id, status): 
    # print(f"[OPERATION] UpdateSpot({id},{status})")
    filter = {"spaces.space_id": id}  # find a spot
    doc = SPOTS_COL.find_one(filter, {"spaces.$": 1})  # retrieve the current spot data

    if doc is None:
        print(f"[UPD_SPOT] Spot {id} not found.")
        return "spot_not_found"

    current_status = doc['spaces'][0]['status']

    # prevent a transition from status 2 (soft reserved) to status 0 (unoccupied), or from occupied to reserved
    if (current_status == 2 and status == 0) or (current_status == 1 and status == 2):
        #print(f"[UPD_SPOT] Attempt to free a soft reserved spot {id} ignored.")
        return "spot_update_ignored"

    update = {"$set": {"spaces.$.status": status}}  # set new status
    SPOTS_COL.update_one(filter, update)  
    
    await CongestionCalc(id)  # update congestion level of lot
    # print("[UPD_SPOT] Updated spot successfully.")
    return "spot_updated"

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
        data = list(SPOTS_COL.find({}, {'_id': False, 'histData' : False})) # Updated parking spot/lot information (congestion, occupancy);
        print(f'[REFR_DATA] Retrieved {len(data)} records from the DB.')
        return "data_retrieved", json.dumps(data)
    
    except Exception as e:
        print('[REFR_DATA]: {e}')
        return "data_error", ""
    
async def UpdatePermits(name, passwd, newPermits):                        
    print(f'[OPERATION] UpdatePermits({name},{newPermits})')
    # [green,yellow,black,gold,handicap]

    # authStatus = UserAuthenticate(name, passwd)                            ## FIXME: Uncomment when passwd passthrough is enabled clientside!

    # if authStatus != "valid":
    #    print("[UPD_PERM] Authentication failed: " + authStatus)
    #    return authStatus

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
    
async def SaveWeeklySchedule(name, passwd, newSched):
    print(f'[OPERATION] SaveWeeklySchedule({name})')

    # authStatus = UserAuthenticate(name, passwd)                   ## FIXME: Uncomment when passwd passthrough is enabled clientside!

    # if authStatus != "valid":                                                 
    #    print("[UPD_PERM] Authentication failed: " + authStatus)
    #    return authStatus
    
    filter = {"name": name}

    update = {"$set": {"weeklySchedule": newSched}}

    result = USERS_COL.update_one(filter, update)

    if result.modified_count > 0:
        print("[UPD_PERM] Schedule updated successfully!")
        return "schedule_updated"
    else:
        print("[UPD_PERM] Schedule not updated.")
        return "schedule_updated"
    
async def QuerySpot(spot_id):
    #print(f'[OPERATION] QuerySpot({spot_id})')
    lot = SPOTS_COL.find_one({"spaces.space_id": spot_id}, {"_id": 0, "spaces.$": 1})
    if lot is None:
        print(f'[REFR_SPOT_DATA] Spot not found in the database: {spot_id}')
        return "null"

    spot_data = lot['spaces'][0]
    #print(f'[REFR_SPOT_DATA] Successfully retrieved data for spot {spot_id}.')
    status = spot_data["status"]

    if status == 0:
        return "unoccupied"
    elif status == 1:
        return "occupied"
    elif status == 2:
        return "reserved"
    else:
        print(f"[REFER_SPOT_DATA] Unknown/invalid spot status? ({status})")
        return "invalid"

async def ReserveSpot(spotId, websocket):
    print(f'[OPERATION] ReserveSpot({spotId})')

    # Client side:
    # Client calls reserve spot and starts a 10m30s timer (used later)
    # If client receives "taken" status, offer option to reserve closest spot and resend ReserveSpot()
    # If client receives "time_limit_reached" status, end reservation and cancel timer
    # If timer reaches 0, assume that connection to server has been lost and cancel reservation.

    spot = await QuerySpot(spotId)

    if spot == "occupied":
        print("[RESERVE_SPOT] Spot was already occupied!")
        status = "preoccupied"
        await websocket.send(json.dumps({"op": "ReserveSpot", "status":status}))
        return
    if spot == "reserved":
        print("[RESERVE_SPOT] Spot was pre-reserved!")
        status = "prereserved"
        await websocket.send(json.dumps({"op": "ReserveSpot", "status":status}))
        return
    
    await UpdateSpot(spotId, 2)

    for i in range(0,600):
        #print("[RESERVE_SPOT] Requerying...")
        spot = await QuerySpot(spotId)

        if spot == "occupied":
            print("[RESERVE_SPOT] Spot was taken mid-reservation!")
            status = "taken"
            await websocket.send(json.dumps({"op": "ReserveSpot", "status":status}))
            return
    
        await asyncio.sleep(1)

    spot = await QuerySpot(spotId)
    
    if spot != "occupied":
        await UpdateSpot(spotId, 1)
        await UpdateSpot(spotId, 0)
    
    print("[RESERVE_SPOT] Time limit reached!")
    status = "time_limit_reached"
    await websocket.send(json.dumps({"op": "ReserveSpot", "status":status}))
    return
    
#################################################### Websocket message handling; calls appropriate functions from JSON encoded messages

async def HandleOperation(websocket, rcvdJson):
    try:
        if rcvdJson["op"] == "Login":
            print("[HANDLE_OP] Handling LOGIN.")
            op = rcvdJson["op"]
            name = rcvdJson["name"]
            passwd = rcvdJson["passwd"]
            status, userData = await Login(name, passwd)
            await websocket.send(json.dumps({"op": op, "status": status, "userData":userData}))

        elif rcvdJson["op"] == "UpdateSpot":
            op = rcvdJson["op"]
            id = rcvdJson["id"]
            status = rcvdJson["status"]
            status = await UpdateSpot(id, status)
            await websocket.send(json.dumps({"op":op,"status": status}))

        elif rcvdJson["op"] == "CreateAccount":
            print("[HANDLE_OP] Handling CREATE_ACCOUNT.")
            op = rcvdJson["op"]
            name = rcvdJson["name"]
            passwd = rcvdJson["passwd"]
            status = await CreateAccount(name, passwd)
            await websocket.send(json.dumps({"op": op, "status": status}))

        elif rcvdJson["op"] == "UpdateName":
            print("[HANDLE_OP] Handling UPDATE_NAME.")
            op = rcvdJson["op"]
            name = rcvdJson["name"]
            passwd = rcvdJson["passwd"]
            newName = rcvdJson["newName"]
            status = await UpdateName(name, passwd, newName)
            await websocket.send(json.dumps({"op":op, "status": status}))
            
        elif rcvdJson["op"] == "UpdatePass":
            print("[HANDLE_OP] Handling UPDATE_PASS.")
            op = rcvdJson["op"]
            name = rcvdJson["name"]
            passwd = rcvdJson["passwd"]
            newPass = rcvdJson["newPass"]
            status = await UpdatePass(name, passwd, newPass)
            await websocket.send(json.dumps({"op":op, "status": status}))

        elif rcvdJson["op"] == "RefreshData":
            print("[HANDLE_OP] Handling REFRESH_DATA.")
            op = rcvdJson["op"]
            status, data = await RefreshData()
            await websocket.send(json.dumps({"op": op, "status":status, "data": data}))

        elif rcvdJson["op"] == "UpdatePermits":
            print("[HANDLE_OP] Handling UPDATE_PERMITS.")
            op = rcvdJson["op"]
            name = rcvdJson["name"]
            passwd = "PLACEHOLDER" # rcvdJson["passwd"]                     ## FIXME
            newPermits = rcvdJson["permits"]
            status = await UpdatePermits(name,passwd,newPermits)
            await websocket.send(json.dumps({"op": op, "status":status}))

        elif rcvdJson["op"] == "DeleteAccount":
            print("[HANDLE_OP] Handling DELETE_ACCOUNT.")
            op = rcvdJson["op"]
            name = rcvdJson["name"]
            passwd = rcvdJson["passwd"]
            status = await DeleteAccount(name,passwd)
            await websocket.send(json.dumps({"op": op, "status": status}))

        elif rcvdJson["op"] == "SaveWeeklySchedule":
            print("[HANDLE_OP] Handling SAVE_WEEKLY_SCHEDULE.")
            op = rcvdJson["op"]
            name = rcvdJson["name"]
            passwd = "PLACEHOLDER" # rcvdJson["passwd"]                     ##
            newSched = rcvdJson["newSched"]
            status = await SaveWeeklySchedule(name,passwd,newSched)
            await websocket.send(json.dumps({"op": op, "status": status}))

        elif rcvdJson["op"] == "QuerySpot":
            print("[HANDLE_OP] Handling QUERY_SPOT")
            op = rcvdJson["op"]
            id = rcvdJson["id"]
            status = await QuerySpot(id)
            await websocket.send(json.dumps({"op": op, "status": status}))

        elif rcvdJson["op"] == "ReserveSpot":
            print("[HANDLE_OP] Handling RESERVE_SPOT")
            id = rcvdJson["id"]
            asyncio.create_task(ReserveSpot(id, websocket))

        else:
            print(f'[HANDLE_OP] ERROR: Unrecognized operation received: {rcvdJson["op"]}')
            status = "unrecognized_operation"
            await websocket.send(json.dumps({"status": status}))
            
    except websockets.exceptions.ConnectionClosedError:
        print("[HANDLE_OP] Connection closed while handling operation.")
    except websockets.exceptions.ConnectionClosedOK:
        print("[HANDLE_OP] Connection closed with OK status.")
    except Exception as e:
        print(f"[HANDLE_OP] Unexpected error: {e}. Received JSON: {json.dumps(rcvdJson)}")

async def HandleMsg(websocket):
    async for msg in websocket:
        if msg == DISCONNECT_MESSAGE:
            return
        
        rcvdJson = json.loads(msg)
        await HandleOperation(websocket, rcvdJson)

#################################################### Database initialization (for resetting the server-side information)

async def InitDB():
    ### TODO: Make sure to change later to implement as many spots and lots as needed

    print('[INITDB] Running DB Precheck...')
    
    if (SPOTS_COL.count_documents({}) > 0):
        print('[INITDB] DB exists, doing nothing.')
        return
    
    print('[INITDB] No DB found, reinitializing!')
    lots = [
        {
            "spaces": [{"space_id": j + 1, "status": 0 } for j in range(1251)],
            "lot_id": "P6",
            "congestion_percent": 0,
            "histData" : {
                "weekNumber" : 0,
                "monday" : [
                    [-1 for i in range(0,32)],
                    [-1 for i in range(0,32)],
                    [-1 for i in range(0,32)],
                    [-1 for i in range(0,32)]
                ],
                "tuesday" : [
                    [-1 for i in range(0,32)],
                    [-1 for i in range(0,32)],
                    [-1 for i in range(0,32)],
                    [-1 for i in range(0,32)]
                ],
                "wednesday" : [
                    [-1 for i in range(0,32)],
                    [-1 for i in range(0,32)],
                    [-1 for i in range(0,32)],
                    [-1 for i in range(0,32)]
                ],
                "thursday" : [
                    [-1 for i in range(0,32)],
                    [-1 for i in range(0,32)],
                    [-1 for i in range(0,32)],
                    [-1 for i in range(0,32)]
                ],
                "friday" :[
                    [-1 for i in range(0,32)],
                    [-1 for i in range(0,32)],
                    [-1 for i in range(0,32)],
                    [-1 for i in range(0,32)]
                ]
            },
            "avgCong" : {
                "monday" :      [-1 for i in range(0,32)],
                "tuesday" :     [-1 for i in range(0,32)],
                "wednesday" :   [-1 for i in range(0,32)],
                "thursday" :    [-1 for i in range(0,32)],
                "friday" :      [-1 for i in range(0,32)]
            }
        },
        {
            "spaces": [{"space_id": j + 1, "status": 0 } for j in range(1252,1873)],
            "lot_id": "P5",
            "congestion_percent": 0,
            "histData" : {
                "monday" : [
                    [-1 for i in range(0,32)],
                    [-1 for i in range(0,32)],
                    [-1 for i in range(0,32)],
                    [-1 for i in range(0,32)]
                ],
                "tuesday" : [
                    [-1 for i in range(0,32)],
                    [-1 for i in range(0,32)],
                    [-1 for i in range(0,32)],
                    [-1 for i in range(0,32)]
                ],
                "wednesday" : [
                    [-1 for i in range(0,32)],
                    [-1 for i in range(0,32)],
                    [-1 for i in range(0,32)],
                    [-1 for i in range(0,32)]
                ],
                "thursday" : [
                    [-1 for i in range(0,32)],
                    [-1 for i in range(0,32)],
                    [-1 for i in range(0,32)],
                    [-1 for i in range(0,32)]
                ],
                "friday" :[
                    [-1 for i in range(0,32)],
                    [-1 for i in range(0,32)],
                    [-1 for i in range(0,32)],
                    [-1 for i in range(0,32)]
                ]
            },
            "avgCong" : {
                "monday" :      [-1 for i in range(0,32)],
                "tuesday" :     [-1 for i in range(0,32)],
                "wednesday" :   [-1 for i in range(0,32)],
                "thursday" :    [-1 for i in range(0,32)],
                "friday" :      [-1 for i in range(0,32)]
            }
        }
    ]
    
    SPOTS_COL.insert_many(lots) # Insert array of lots

#################################################### Server startup

async def Start():
    print('[STARTUP] Starting server...')
    await InitDB()
    asyncio.create_task(UpdCongHistLoop())
    async with websockets.serve(HandleMsg, '0.0.0.0', PORT) as server:
        print(f"[STARTUP] Server listening on port {PORT}.")
        await server.serve_forever()

if __name__ == "__main__":
    print("[STARTING]")
    asyncio.run(Start())