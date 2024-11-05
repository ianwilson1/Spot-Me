# List of operations:
#   - UpdateSpot: update a spot's occupancy status
#   - CreateAccount: create a new account
#   - UpdateName: update a user's name
#   - UpdatePass: update a user's password
#   - UpdatePermit: update a user's list of permits

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

#DB_CLIENT = pymongo.MongoClient('localhost', 27017)
#DATABASE = DB_CLIENT['']
#COLLECTION = DATABASE['']
####################################################

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind(ADDR)

def UpdateSpot(id, status):
    print(f"[OPERATION] UpdateSpot({id},{status})")

    # TODO: Implement database interaction


def HandleOperation(rcvdJson):
    if rcvdJson["op"] == "UpdateSpot":
        id = rcvdJson["id"]
        status = rcvdJson["status"]
        UpdateSpot(id, status)

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

def Start():
    server.listen()
    print(f"[LISTENING] Listening on {SERVER}")
    while True:
        conn, addr = server.accept() 

        thread = threading.Thread(target=HandleClient, args=(conn, addr))
        thread.start()

        print(f"[ACTIVE CONNECTIONS] {threading.active_count() - 1}")

print("[STARTING]")
Start()