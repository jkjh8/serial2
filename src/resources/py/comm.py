import sys, socket, serial, binascii, threading, json
from time import sleep
from _thread import *
from PySide2.QtWidgets import QApplication, QWidget
from PySide2.QtCore import Qt, Slot, Signal, QThread

class Main(QWidget):
    commRtMsg = Signal(str)
    tcpServRun = Signal(int)

    def __init__(self):
       super().__init__()
       self.MainCommModule = MainCommModule()
       self.TcpServer = TcpServer()

       self.MainCommModule.start()

       self.commRtMsg.connect(self.MainCommModule.send)
       self.tcpServRun.connect(self.TcpServer.TcpServerRun)
       self.MainCommModule.commMsg.connect(self.commParsing)


    @Slot(str)
    def commParsing(self, msg):
        print("parsing ",msg)
        self.tcpServRun.emit(int(msg))

class MainCommModule(QThread):
    commMsg = Signal(str)

    def __init__(self, parent = None):
        super(MainCommModule, self).__init__(parent)
    
    def run(self):
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.connect(('127.0.0.1', 60000))
            print("start port")
            self.socket.sendall((json.dumps({'CommModule':'ready'})).encode())
            while True:
                msg = self.socket.recv(4096)
                if not msg:
                    self.socket.close()
                    self.reConnect()
                self.commMsg.emit(msg.decode())
                print(msg)

        except:
            print("reconnect Main Process")
            self.socket.close()
            self.reConnect()

    @Slot(str) 
    def send(self, msg):
        self.socket.sendall(msg.encode())

    def reConnect(self):
        sleep(1)
        self.run()

class TcpServer(QThread):
    def __init__(self, parent=None):
        super(TcpServer, self).__init__(parent)
        self.tcpClients = []
        self.tcpPrintLock = threading.Lock()

    @Slot(int)
    def TcpServerRun(self, port):
        self.tcpServSock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.tcpServSock.bind(("",port))
        print("tcp server wait client")
        self.tcpServSock.listen(50)

        while True:
            client, clientAddr = self.tcpServSock.accept()
            print('connect : ',clientAddr[0], clientAddr[1])

            if client:
                self.tcpClients.append(client)
                self.tcpServeSend("{} : Connected".format(client))
            start_new_thread(self.tcpClientThread,(client, clientAddr))
        self.tcpServSock.close()
            
    def tcpClientThread(self, c, addr):
        while True:
            msg = c.recv(4096)
            if not msg:
                print(addr, 'disconnect')
                self.tcpclients.remove(c)
            self.tcpPrintLock.acquire()
            print(msg)
            self.tcpPrintLock.release()
        c.Close()

    @Slot()
    def tcpServeClose(self):
        self.tcpServSock.close()

    @Slot(str)
    def tcpServeSend(self, msg):
        if self.tcpclients:
            for c in self.tcpClients:
                c.send(msg.encode())



if __name__=="__main__":
  app = QApplication(sys.argv)
  main = Main()
  sys.exit(app.exec_())