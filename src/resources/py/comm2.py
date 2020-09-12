import sys, socket, serial, binascii, threading, json, struct, queue
from time import sleep
from _thread import *


class MainThread(threading.Thread):
    def __init__(self, q_in, q_out):
        threading.Thread.__init__(self)
        self.q_in = q_in
        self.q_out = q_out

    def run(self):
        print('start 2')
        while True:
            print('start 2')
            msg = self.q_out.get()
            print(msg)
            # self.q_in.put(msg)
    

class MainCommModule(threading.Thread):

    def __init__(self, q_in, q_out):
        threading.Thread.__init__(self)
        self.q_in = q_in
        self.q_out = q_out
    
    def run(self):
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.connect(('127.0.0.1', 60000))
            print("start port")
            self.socket.sendall((json.dumps({'CommModule':'ready'})).encode())
            while True:
                msg = self.socket.recv(4096)
                print('socket >>',msg)
                if not msg:
                    self.socket.close()
                    self.reConnect()
                print('q_put')
                self.q_out.put(msg)

                if not self.q_in.empty():
                    self.socket.sendall(self.q_in.get())


        except:
            print("reconnect Main Process")
            self.socket.close()
            self.reConnect()


    def send(self, msg):
        self.socket.sendall(msg.encode())

    def reConnect(self):
        sleep(1)
        self.run()

q = []

def Main():
    q.append (queue.Queue())
    q.append (queue.Queue())
    Module1 = MainCommModule(q[0], q[1])
    # Module1.setDaemon(True)
    Module1.start()
    Sub()

def Sub():
    Module2 = MainThread(q[0], q[1])
    # Module1.setDaemon(True)
    Module2.start()





if __name__=="__main__":
    Main()
