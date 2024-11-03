# Summary of operation:
#   - Pick a random spot from the list of spots by ID.
#   - Initialize a "ParkingSpot" dictionary object initialized with this ID.
#   - Pick a random state to change it to (0 = free, 1 = occupied, 2 = reserved)
#   - Check if this spot is in the list of handicap spots. Set the isHandicap attribute accordingly.
#   - Stringify this dictionary into a JSON string.
#   - Send this JSON string to the server.
#   - Repeat every 3 seconds.

import json
import random
import socket
import time

#################################################### Constants
HEADER = 128
PORT = 15024
FORMAT = 'utf-8'
SERVER = socket.gethostbyname(socket.gethostname()) # <- put public address of server machine here
ADDR = (SERVER, PORT)
DISCONNECT_MESSAGE = "!DISCONNECT"

MAX_SPOTS = 10          # Number of parking spots we currently have implemented. CHANGE AS NEEDED
HANDICAP_SPOTS = []     # List of handicap spots, if any are implemented. CHANGE AS NEEDED
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
        "id": spotID,
        "status": random.randint(0,2),
        "isHandicap": spotID in HANDICAP_SPOTS
    }
    
    msg = json.dumps(updSpotInfo)
    print(f"[OUTBOUND] {msg}")
    send(msg)

    time.sleep(3)