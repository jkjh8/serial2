import sys, socket, serial, binascii, threading, json, struct
from time import sleep
from _thread import *
from PySide2.QtWidgets import QApplication, QWidget
from PySide2.QtCore import Qt, Slot, Signal, QThread

class Main(QWidget):
    commRtMsg = Signal(str)
    
    serialOpen = Signal(str, int); serialClose = Signal(); serialMsg = Signal(str)
    tcpServOpen = Signal(str, int); tcpServClose = Signal(); tcpServMsg = Signal(str)
    tcpClientOpen = Signal(str, int); tcpClientClose = Signal(); tcpClientMsg = Signal(str)
    udpServOpen = Signal(str, int); udpServClose = Signal()
    multiUdpServOpen = Signal(str, int); multiUdpServClose = Signal()

    def __init__(self):
        super().__init__()
        self.MainCommModule = MainCommModule()
        self.SerialPort = SerialPort()
        self.TcpServer = TcpServer()        
        self.TcpClient = TcpClient()
        self.UdpServer = UdpServer()
        self.MuticastServer = MuticastServer()

        self.MainCommModule.start()
        self.TcpServer.start()

        self.commRtMsg.connect(self.MainCommModule.send)
        self.MainCommModule.commMsg.connect(self.commParsing)
        self.SerialPort.serialRtMsg.connect(self.commParsing)
        self.TcpServer.tcpServMsg.connect(self.commParsing)
        self.TcpClient.tcpClientMsg.connect(self.commParsing)
        self.UdpServer.udpServRtMsg.connect(self.commParsing)
        self.MuticastServer.multiUdpRtMsg.connect(self.commParsing)

        self.serialOpen.connect(self.SerialPort.serialOpen)
        self.serialClose.connect(self.SerialPort.serialClose)
        self.serialMsg.connect(self.SerialPort.serialMsg)

        self.tcpServOpen.connect(self.TcpServer.tcpServerOpen)
        self.tcpServClose.connect(self.TcpServer.tcpServeClose)
        self.tcpServMsg.connect(self.TcpServer.tcpServSend)

        self.serialOpen.connect(self.SerialPort.serialOpen)
        self.serialClose.connect(self.SerialPort.serialClose)
        self.serialMsg.connect(self.SerialPort.serialMsg)

        self.tcpClientOpen.connect(self.TcpClient.tcpClientOpen)
        self.tcpClientClose.connect(self.TcpClient.tcpClientClose)
        self.tcpClientMsg.connect(self.TcpClient.tcpClientSend)        

        self.udpServOpen.connect(self.UdpServer.udpServOpen)
        self.udpServClose.connect(self.UdpServer.udpServClose)

        self.multiUdpServOpen.connect(self.MuticastServer.multiUdpServOpen)
        self.multiUdpServClose.connect(self.MuticastServer.multiUdpServClose)

    @Slot(str)
    def commParsing(self, msg):
        print("parsing ",msg)        
        pars_msg = json.loads(msg)
        if 'status' in pars_msg:
            ip = pars_msg['ip']
            port = int(pars_msg['port'])
            status = pars_msg['status']

            
            if status == True:
                if pars_msg['protocol'] == 0:
                    self.serialOpen.emit(ip,port)
                elif pars_msg['protocol'] == 1:
                    self.tcpServOpen.emit(ip,port)
                elif pars_msg['protocol'] == 2:
                    self.tcpClientOpen.emit(ip,port)
                elif pars_msg['protocol'] == 3:
                    self.udpSenderIP = ip
                    self.udpSenderPort = port
                elif pars_msg['protocol'] == 4:
                    self.udpservOpen.emit(ip, port)
            else:
                if pars_msg['protocol'] == 0:
                    self.serialClose.emit()
                elif pars_msg['protocol'] == 1:
                    self.tcpServClose.emit()
                elif pars_msg['protocol'] == 2:
                    self.tcpClientClose.emit()
                elif pars_msg['protocol'] == 3:
                    self.udpSenderIP = ip
                    self.udpSenderPort = port
                elif pars_msg['protocol'] == 4:
                    self.udpservClose.emit()
        # self.tcpServRun.emit(int(msg))

    def udpSender(self, ip, port, msg):
        udpsender = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        udpsender.sendto(msg,(ip, port))
        udpsender.close()
    
    def multicastUdpSender(self, grp, port, msg):
        MULTICAST_TTL = 2
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
        sock.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, MULTICAST_TTL)
        sock.sendto(msg, (grp, port))

class MainCommModule(QThread):
    commMsg = Signal(str)

    def __init__(self, parent = None):
        super(MainCommModule, self).__init__(parent)
    
    def run(self):
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.connect(('127.0.0.1', 60000))
            # print("start port")
            self.socket.sendall((json.dumps({'CommModule':'ready'})).encode())
            while True:
                msg = self.socket.recv(4096)
                if not msg:
                    self.socket.close()
                    self.reConnect()
                self.commMsg.emit(msg.decode())
                # print(msg)

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

class SerialPort(QThread):
    serialRtMsg = Signal(str)

    def __init__(self, parent = None):
        super(SerialPort, self).__init__(parent)

    @Slot(str,int)
    def serialOpen(self, com, baud):
        try:
            self.serial = serial.Serial(com, baud)
            print('serial port open')

            while self.serial.isOpen():
                msg = self.serial.readline()
                if not msg:
                    pass
                else:
                    self.serialRtMsg.emit(msg)
                    print(msg)
        except:
            self.serialRtMsg.emit('serialerror')
    
    @Slot()
    def serialClose(self):
        self.serial.close()

    @Slot()
    def serialMsg(self, msg):
        if self.serial.isOpen():
            self.serial.write(msg)

class TcpServer(QThread):
    tcpServMsg = Signal(str)
    def __init__(self, parent=None):
        super(TcpServer, self).__init__(parent)
        self.tcpClients = []
        self.tcpPrintLock = threading.Lock()

    @Slot(str, int)
    def tcpServerOpen(self, ip, port):        
        self.tcpServSock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        print(port)
        self.tcpServSock.bind(("",port))
        
        self.tcpServSock.listen(50)

        while True:
            print("tcp server wait client")
            client, clientAddr = self.tcpServSock.accept()
            print('connect : ',clientAddr[0], clientAddr[1])

            if client:
                self.tcpClients.append(client)
                # self.tcpServeSend("{} : Connected".format(client))
                start_new_thread(self.tcpClientThread,(client, clientAddr))
        self.tcpServSock.close()
        print('close server')
            
    def tcpClientThread(self, c, addr):
        while True:
            try:
                msg = c.recv(4096)
            except:
                break
            if not msg:
                print(addr, 'disconnect')
                break
            self.tcpPrintLock.acquire()
            self.tcpServSend(msg)

            self.tcpServMsg.emit(msg)
            self.tcpPrintLock.release()
        c.close()
        self.tcpClients.remove(c)


    @Slot()
    def tcpServeClose(self):
        self.tcpServSock.close()

    @Slot(str)
    def tcpServSend(self, msg):
        if self.tcpClients:
            for c in self.tcpClients:
                print(c)
                c.send(msg)

class TcpClient(QThread):
    tcpClientMsg = Signal(str)

    def __init__(self, parent = None):
        super(TcpClient, self).__init__(parent)
    
    def tcpClientOpen(self):
        try:
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.sock.connect(('127.0.0.1', 60000))
            # print("start port")
            self.sock.sendall((json.dumps({'CommModule':'ready'})).encode())
            while True:
                msg = self.sock.recv(4096)
                if not msg:
                    self.sock.close()
                    self.reConnect()
                self.tcpClientMsg.emit(msg.decode())
                # print(msg)

        except:
            self.tcpClientMsg.emit('tcpClientDisconnect'.decode())

    @Slot(str) 
    def tcpClientSend(self, msg):
        self.socket.sendall(msg.encode())

    @Slot()
    def tcpClientClose(self):
        self.sock.close()

class UdpServer(QThread):
    udpServRtMsg = Signal(str)
    def __init__(self, parent = None):
        super(UdpServer, self).__init__(parent)

    @Slot(str, int)
    def udpServOpen(self, ip, port):
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.sock.bind(())

        while True:
            msg, addr = self.recvfrom(4096)
            print(msg)
            self.udpServRtMsg.emit(msg)
    
    @Slot()
    def udpServClose(self):
        self.sock.close()
            
class MuticastServer(QThread):
    multiUdpRtMsg = Signal(str)

    def __init__(self, parent = None):
        super(MuticastServer, self).__init__(parent)

    @Slot(str, int, bool)
    def multiUdpServOpen(self, grp, port, listenAll=False):
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
        self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        if listenAll:
            self.sock.bind(('',port))
        else:
            self.sock.bind((grp, port))
        mreq = struct.pack("4sl", socket.inet_aton(grp), socket.INADDR_ANY)
        self.sock.setsockopt(socket.IPPROTO_IP, socket.IP_ADD_MEMBERSHIP, mreq)

        while True:
            msg = self.sock.recv(10240)
            print(msg)
            self.multiUdpRtMsg.emit(msg)
    
    @Slot()
    def multiUdpServClose(self):
        self.sock.close()
   


if __name__=="__main__":
  app = QApplication(sys.argv)
  main = Main()
  sys.exit(app.exec_())