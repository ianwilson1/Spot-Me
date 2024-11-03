import socket
import threading
import json

#################################################### Constants
HEADER = 128
PORT = 15024
SERVER = socket.gethostbyname(socket.gethostname()) # Get the local IPv4 of current machine
ADDR = (SERVER, PORT)
FORMAT = 'utf-8'
DISCONNECT_MESSAGE = "!DISCONNECT"
####################################################

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM) # Create socket
server.bind(ADDR)

def handle_client(conn, addr):
    print(f"[NEW CONNECTION] {addr} connected")

    connected = True
    while connected:
        msg_length = conn.recv(HEADER).decode(FORMAT)
        if msg_length:
            msg_length = int(msg_length)
            msg = conn.recv(msg_length).decode(FORMAT)

            if msg == DISCONNECT_MESSAGE:
                connected = False

            print(f"[{addr}] {msg}")

    conn.close()
    

def start():
    server.listen() # Listen for new connections
    print(f"[LISTENING] Listening on {SERVER}")
    while True:
        # Store connection and socket to communicate back
        conn, addr = server.accept() 

        thread = threading.Thread(target=handle_client, args=(conn, addr))
        thread.start()

        print(f"[ACTIVE CONNECTIONS] {threading.active_count() - 1}")

print("[STARTING]")
start()