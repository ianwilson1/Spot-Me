# Summary of operation:
#   - Pick a random spot from the list of spots by ID.
#   - Initialize a "ParkingSpot" dictionary object initialized with this ID
#     and a random state to change it to (0 = free, 1 = occupied, 2 = reserved)
#   - Stringify this dictionary into a JSON string.
#   - Send this JSON string to the server.
#   - Repeat every 3 seconds.

import json
import random
import socket
import time

#################################################### Constants
HEADER = 64
PORT = 15024
FORMAT = 'utf-8'
SERVER = '34.105.119.88' # <- put public address of server machine here
SERVER = socket.gethostbyname(socket.gethostname()) # For local machine testing only; COMMENT OUT WHEN TESTING ON SERVER
ADDR = (SERVER, PORT)
DISCONNECT_MESSAGE = "!DISCONNECT"

MAX_SPOTS = 10          # Number of parking spots we currently have implemented. CHANGE AS NEEDED
####################################################

client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
client.connect(ADDR)

def send(msg):
    message = msg.encode(FORMAT)
    msg_length = len(message)

    send_length = str(msg_length).encode(FORMAT)
    send_length += b" " * (HEADER - len(send_length))

    client.send(send_length)
    client.send(message)

while True:
    spotID = random.randint(1, MAX_SPOTS)

    updSpotInfo = {
        "op": "UpdateSpot",
        "id": spotID,
        "status": random.randint(0,2),
    }
    
    msg = json.dumps(updSpotInfo)
    print(f"[OUTBOUND] {msg}")
    send(msg)

    time.sleep(3)