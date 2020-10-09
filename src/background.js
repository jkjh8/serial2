'use strict'

import { app, protocol, BrowserWindow, ipcMain, Menu} from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
const dgram = require('dgram');
const isDevelopment = process.env.NODE_ENV !== 'production'

const serialport = require("serialport").SerialPort
let port

const Datastore = require('nedb-promises')
let db = Datastore.create('/path/to/db.db')

const net = require('net')
const connectedSocketClient = new Set()

let win
let moment = require('moment')
let udpSenderStatus = {
  ip:'',
  port:'',
  status:false
}

let viewSetup = {
  showHex:false,
  sendHex:false,
  sendCrLf:false
}

let onlineState = {
  serial:false,
  tcpserver:false,
  tcpclient:false,
  udpserver:false,
  udpsender:false
}

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })
  // Menu.setApplicationMenu(null)

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    win.loadURL('app://./index.html')
  }

  win.on('closed', () => {
    win = null
  })
  //Remove Menu Tab
  Menu.setApplicationMenu(null)
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})

app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}


async function writedb(protocol, from, data) {
  const returnMsg = {
    createAt: moment().format("YYYY-MM-DD HH:mm:ss"),
    protocol: protocol,
    from: from,
    msg : dataDecode(data)
  }
  const wd = await db.insert(returnMsg)
  readdb()
}

async function readdb() {
  const rd = await db.find()
  win.webContents.send('rtMsg', rd)
  // console.log(rd)
}

function removeAll () {
  db.remove({}, {multi:true}) 
}

function dataDecode (data) {
  if (viewSetup.showHex === true) {
    let msg = data.toString('hex').replace(/(.{2})/g,"$1,")
    return msg = 'hex '+msg.slice(0,-1)
  } else {
    return data.toString()
  }
}

function serialPortConnent(com, baud) {
  try {
    port = new serialport(com, {
      buadrate: baud,
      // parser: serialport.parsers.readline('\n')
    })
  } catch(err) {
    win.webContents.send('alert', JSON.stringify(err));
    onlineState.serial = false
    win.webContents.send('onlineStatus', onlineState)
  }

  onlineState.serial = true
  win.webContents.send('onlineStatus', onlineState)

  port.on('data', data => {
    console.log(data)
    writedb("Serial",com,data)
  })

  port.on('close', function(err) {
    console.log('serialport Close', err)
    onlineState.serial = false
    win.webContents.send('onlineStatus', onlineState)
  })
}

serialPortConnent.disconnect = () => {
  port.close();
}

function serialWrite(data) {
  port.write(data)
  writedb("Serial",'This',data)
}


// TCP Server to Client Broadcast Message
connectedSocketClient.broadcast = function (text, except) {
  for (let Client of this) {
    if (Client !== except) {
      Client.write(text)
    }
  }
  writedb("TcpServer",'This',text)
}

// TCP Server
const server = net.createServer (function (Client) {
  connectedSocketClient.add(Client)
  
  Client.on('data', function (data) {
    // console.log('Tcp Server Recv Data %d: %s', Client.remotePort,data.toString());
    if (!data) return
    let address = (`${Client.remoteAddress}:${Client.remotePort}`)
    writedb("TcpServer",address,data)
  })

  Client.on('close', function() {
    connectedSocketClient.delete(Client)
  })
})

server.on('error', function(err) {
  // Tcp server Error Report
  win.webContents.send('alert', JSON.stringify(err));
})

function tcpServerConnect(ip, port) {
  try {
    server.listen(port, function() {
      console.log('Server listening: '+ JSON.stringify(server.address()));
      onlineState.tcpserver = true
      win.webContents.send('onlineStatus', onlineState)
  
      server.on('close', function(){
        console.log("Server Close");
        onlineState.tcpserver = false
        win.webContents.send('onlineStatus', onlineState)
      })
    })
  } catch (err) {
    win.webContents.send('alert', JSON.stringify(err));
    onlineState.tcpserver = false
    win.webContents.send('onlineStatus', onlineState)
  }  
}

tcpServerConnect.disconnect = () => {
  for (let Clinet of connectedSocketClient) {Clinet.destroy()}
  server.close(function() {server.unref()})
}


// TcpClient Module
let TcpClient

const tcpClientConnect = (ip, port) => {
  try {
    TcpClient = net.connect({port:port, host:ip}, ()=>{
      console.log('connected tcp clinet : '+ ip + ',' + port)
      onlineState.tcpclient = true
      win.webContents.send('onlineStatus', onlineState)
    })
    TcpClient.on('close', function() {
      console.log('tcpclinet disconnected')
      onlineState.tcpclient = false
      win.webContents.send('onlineStatus', onlineState)
    })
    TcpClient.on('data', function(data) {
      const address = ip+':'+port
      writedb("TcpClient",address,data)
    })
    TcpClient.on('end', function() {
      console.log('client end')
      onlineState.tcpclient = false
      win.webContents.send('onlineStatus', onlineState)
    })
    TcpClient.on('error', function(err) {
      win.webContents.send('alert', JSON.stringify(err));
      onlineState.tcpclient = false
      win.webContents.send('onlineStatus', onlineState)
    })
    return TcpClient
  } catch (err) {
    win.webContents.send('alert', JSON.stringify(err));
    onlineState.tcpclient = false
    win.webContents.send('onlineStatus', onlineState)
  }
}

tcpClientConnect.disconnect = () => {
  TcpClient.end()
}

function tcpClientWrite (data) {
  TcpClient.write(data)
  writedb("TcpClient",'This',data)
}

let UdpServer = dgram.createSocket('udp4')
//UDP Server
function udpServerConnect(ip,port) {
  try {
    UdpServer.on('error',(err) =>{
      win.webContents.send('alert', JSON.stringify(err));
    });
  
    UdpServer.on('message', (data, rinfo) =>{
      const address = (`${rinfo.address}:${rinfo.port}`);
      writedb("UdpServer",address,data)
    });
  
    UdpServer.on('listening', () => {
      const address = UdpServer.address();
      console.log(`server listening ${address.address}:${address.port}`);
      onlineState.udpserver = true
      win.webContents.send('onlineStatus', onlineState)
  
    });
  
    UdpServer.on('close', () => {
      console.log('UdpServer Close')
      onlineState.udpserver = false
      win.webContents.send('onlineStatus', onlineState)
      UdpServer = null
      UdpServer = dgram.createSocket('udp4')
    })
  
    UdpServer.bind(port,ip)
    // UdpServer.close()
  } catch (err) {
    win.webContents.send('alert', JSON.stringify(err));
    onlineState.udpserver = false
    win.webContents.send('onlineStatus', onlineState)
  }
}

udpServerConnect.disconnect = function() {
  UdpServer.close()
}

let UdpClinet = dgram.createSocket('udp4');

function udpSenderWrite (msg) {
  // let message = new Buffer(msg);
  UdpClinet.send(msg, 0, msg.length, udpSenderStatus.port, udpSenderStatus.ip, function(err){
    if (err) {
      win.webContents.send('alert', JSON.stringify(err));
    }
    writedb("UdpBroad",'This',msg)
  })
}

function udpSenderConnect(ip, port) {
  udpSenderStatus.ip = ip;
  udpSenderStatus.port = port;
  onlineState.udpsender = true
  win.webContents.send('onlineStatus', onlineState)
}

udpSenderConnect.disconnect = () => {
  udpSenderStatus.ip = null;
  udpSenderStatus.port = null;
  onlineState.udpsender = false;
  win.webContents.send('onlineStatus', onlineState);
}

const connections = [serialPortConnent, tcpServerConnect, tcpClientConnect, udpServerConnect, udpSenderConnect]


ipcMain.on('OnConnect', (e, connect) => {
  if (connect.state === true){
    connections[connect.protocol](connect.ip,Number(connect.port))
  }
  else {
    connections[connect.protocol].disconnect()
  }
})

ipcMain.on('sendMsg', (event, msg) => {
  if (viewSetup.sendHex === true) {
    msg = msg.replace(",","")
    if(msg.length % 2 !== 0) {
      win.webContents.send('alert', "Byte 수를 확인 해주세요")     
    } else {
      let procMsg = hexToBytes(msg)
      let message = Buffer.from(procMsg)
      sendMsg(message)
    }
  } else {
    if (viewSetup.sendCrLf === true) {
      msg = msg+"\n"
    }
    let message = Buffer.from(msg)
    sendMsg(message)
  }
  
})

function hexToBytes(hex) {  
  for (var bytes = [], c = 0; c < hex.length; c += 2)
  bytes.push(parseInt(hex.substr(c, 2), 16));

  if (viewSetup.sendCrLf === true){
    bytes.push(0x0d,0x0a)
  }
  return bytes;
}

function sendMsg (msg) {
  if (onlineState.serial === true) {
    serialWrite(msg)
  }
  if (onlineState.tcpserver === true) {
    connectedSocketClient.broadcast(msg)
  }
  if (onlineState.tcpclient === true) {
    tcpClientWrite(msg)
  }
  if (onlineState.udpsender === true) {
    udpSenderWrite(msg)
  }
}

ipcMain.on('viewSetup',(e,value) => {
  viewSetup = value
  console.log(value)
} )
removeAll()


// sendHex:false,
// sendCrLf:false