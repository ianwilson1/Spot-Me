import json
import random
import socket
import time

#################################################### Constants

HEADER = 64                 # The initial size of messages that the server expects
PORT = 15024                # The port that the server is listening on (must be 15024)
FORMAT = 'utf-8'            # The format messages will be encoded in (must be utf-8)
SERVER = '34.105.119.88'    # public address of server machine
ADDR = (SERVER, PORT)       # Full routing identifier
DISCON_MSG = "!DISCONNECT"  # String to send to cleanly disconnect from the server

MAX_SPOTS = 10              # Number of parking spots we currently have implemented. CHANGE AS NEEDED

# vvv For local machine testing only; COMMENT OUT WHEN TESTING ON SERVER
# SERVER = socket.gethostbyname(socket.gethostname())

####################################################
                                                            # General process for setting up connection:
client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)  # Create the connection socket
client.connect(ADDR)                                        # Connect to the server

                                                        # SEND FUNCTION: This gets called EVERY MESSAGE you want to send!
def send(msg):                                          # msg is the string you want to send
    message = msg.encode(FORMAT)                        # encode the string in utf-8
    msg_length = len(message)                           # save the length of the encoded message

    send_length = str(msg_length).encode(FORMAT)        # initialize the length of the string so the server knows what to expect
    send_length += b" " * (HEADER - len(send_length))   # pad this message to 64 bytes (very important, the server only interprets
                                                        # 64 byte-long messages at first before you define the length)

    client.send(send_length)                            # Send the message's length; this will tell the server the size of message to 
                                                        # expect and will resize the server's header size for this message
    client.send(message)                                # Send the message itself


# Summary of operation:
#   - Pick a random spot from the list of spots by ID.
#   - Initialize a "ParkingSpot" dictionary object initialized with this ID
#     and a random state to change it to (0 = free, 1 = occupied, 2 = reserved)
#   - Stringify this dictionary into a JSON string.
#   - Send this JSON string to the server.
#   - Repeat every 3 seconds.

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

    time.sleep(0.001)