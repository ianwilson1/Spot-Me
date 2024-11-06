# List of operations:
#   - UpdateSpot: update a spot's occupancy status
#   - CreateAccount: create a new account
#   - UpdateName: update a user's name
#   - UpdatePass: update a user's password
#   - UpdatePermit: update a user's list of permits

import bcrypt
import socket
import threading
import json
import pymongo

#################################################### Constants
HEADER = 64
PORT = 15024
SERVER = socket.gethostbyname(socket.gethostname()) # Get the local IPv4 of current machine
ADDR = (SERVER, PORT)
FORMAT = 'utf-8'
DISCONNECT_MESSAGE = "!DISCONNECT"

DB_CLIENT = pymongo.MongoClient('localhost', 27017)
DB = DB_CLIENT['SpotMeDB']
USERS_COL = DB['userData']
SPOTS_COL = DB['spots']
####################################################

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind(ADDR)

def hash_password(password): # Password security
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_password

def UpdateSpot(id, status):
    print(f"[OPERATION] UpdateSpot({id},{status})")
    filter = {"spaces.space_id": id}
    update = {"$set": {"spaces.$.status": status}}
    
    SPOTS_COL.update_one(filter, update)

def CreateAccount(name, passwd):
    print(f"[OPERATION] CreateAccount({name},{passwd})")

    # Only make a new account if the username is unique
    if (USERS_COL.find_one({"name": name})):
        return False
    
    hashed_password = hash_password(passwd)
    
    user = {
        "name": name,
        "pass": hashed_password
    }

    USERS_COL.insert_one(user)


def UpdateName(name, passwd, newName):
    print(f"[OPERATION] UpdateName({name},{passwd},{newName})")


    if (USERS_COL.find_one({"name": newName})):
        return False
    
    filter = {"name": name}
    update = {"$set": {"name": newName}}

    USERS_COL.update_one(filter, update)



def UpdatePass(name, passwd, newPass):
    print(f"[OPERATION] CreateAccount({name},{passwd},{newPass})")
    filter = {"pass": passwd}
    update = {"$set": {"pass": newPass}}

    USERS_COL.update_one(filter, update)


def HandleOperation(rcvdJson):
    if rcvdJson["op"] == "UpdateSpot":
        id = rcvdJson["id"]
        status = rcvdJson["status"]
        UpdateSpot(id, status)

    elif rcvdJson["op"] == "CreateAccount":
        name = rcvdJson["name"]
        passwd = rcvdJson["passwd"]
        CreateAccount(name, passwd)

    elif rcvdJson["op"] == "UpdateName":
        name = rcvdJson["name"]
        passwd = rcvdJson["passwd"]
        newName = rcvdJson["newName"]
        UpdateName(name, passwd, newName)
        
    elif rcvdJson["op"] == "UpdatePass":
        name = rcvdJson["name"]
        passwd = rcvdJson["passwd"]
        newPass = rcvdJson["newPass"]
        CreateAccount(name, passwd, newPass)

    # TODO: Create branches for the rest of the operations

def HandleClient(conn, addr):
    print(f"[NEW CONNECTION] {addr} connected")
    connected = True

    while connected:
        msg_length = conn.recv(HEADER).decode(FORMAT)

        if not msg_length: # No message contents received
            continue

        msg_length = int(msg_length)
        msg = conn.recv(msg_length).decode(FORMAT)

        if msg == DISCONNECT_MESSAGE:
            connected = False

        rcvdJson = json.loads(msg)
        HandleOperation(rcvdJson)

    conn.close()

def InitDB():
    ### TODO: Make sure to change later to implement as many spots and lots as needed
    ## Example lot for testing with 10 lots
    if (SPOTS_COL.count_documents({}) > 0):
        return
    
    lots = [] 
    lot = {
        "lot_id": "P_example",
        "spaces": [{"space_id": j + 1, "status": 0, "isHandicap" : 0} for j in range(10)],
        
    }
    lots.append(lot)
    SPOTS_COL.insert_many(lots)

def Start():
    server.listen()
    print(f"[LISTENING] Listening on {SERVER}")
    while True:
        conn, addr = server.accept() 

        thread = threading.Thread(target=HandleClient, args=(conn, addr))
        thread.start()

        print(f"[ACTIVE CONNECTIONS] {threading.active_count() - 1}")

print("[STARTING]")
InitDB()
CreateAccount("Ian", "urMom123")
CreateAccount("Adrian", "goodPassword")
CreateAccount("xX360NoScoperXx720", "mySocialSecurityNumber")
Start()