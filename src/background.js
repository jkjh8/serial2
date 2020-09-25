'use strict'

import { app, protocol, BrowserWindow, ipcMain, Menu} from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
const dgram = require('dgram');
const isDevelopment = process.env.NODE_ENV !== 'production'

const net = require('net')
const connectedSocketClient = new Set()

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1280,
    height: 600,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      // nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION
      nodeIntegration: true
    }
  })
  // Menu.setApplicationMenu(null)

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  win.on('closed', () => {
    win = null
  })
  //Remove Menu Tab
  // Menu.setApplicationMenu(null)
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
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

// TCP Server to Client Broadcast Message
connectedSocketClient.broadcast = function (text, except) {
  for (let Client of this) {
    if (Client !== except) {
      Client.write(text)
    }
  }
}

// TCP Server
const server = net.createServer (function (Client) {
  connectedSocketClient.add(Client)
  win.webContents.send('onConnect', Client.remoteAddress, Client.remotePort)
  
  Client.on('data', function (data) {
    // console.log('Tcp Server Recv Data %d: %s', Client.remotePort,data.toString());
    if (!data) return
    let address = (`${Client.remoteAddress}:${Client.remotePort}`)
    win.webContents.send('rtMsg', 'Tcp Serv',address, data.toString())
    // connectedSocketClient.broadcast(data)
  })
  Client.on('close', function() {
    connectedSocketClient.delete(Client)
  })
})

server.on('error', function(err) {
  // Tcp server Error Report
  console.log('tcp server err = ' + err);
})

function tcpServer(port) {
  server.listen(port, function() {
    console.log('Server listening: '+ JSON.stringify(server.address()));
    win.webContents.send('onlineState', 1, true)
    server.on('close', function(){
      console.log("Server Close");
      win.webContents.send('onlineState', 1, false)
    })
    server.on('error', function(err){
      console.log('Server Error: ',JSON.stringify(err));
    })
  })
}

// TcpClient Module
let TcpClient = '';

const TcpClientConnect = function(ip, port) {
  win.webContents.send('onlineState', 2, true)
  TcpClient = net.connect({port:port, host:ip}, ()=>{
    console.log('connected tcp clinet : '+ ip + ',' + port)
  })
  TcpClient.on('close', function() {
    console.log('tcpclinet disconnected')
    win.webContents.send('onlineState', 2, false)
  })
  TcpClient.on('data', function(data) {
    console.log('Tcpclient recv = '+ data)
    const address = ip+':'+port
    win.webContents.send('rtMsg', 'Tcp Client',address, data.toString())
  })
  TcpClient.on('end', function() {
    console.log('client end')
  })
  TcpClient.on('error', function(err) {
    console.log('client Socket Error: '+ JSON.stringify(err));
  })
  return TcpClient
}

function TcpClientWrite(data) {
  TcpClient.write(data)
}

let UdpServer = dgram.createSocket('udp4')
//UDP Server
function UdpServerConnect(ip,port) {


  UdpServer.on('error',(err) =>{
    console.log(`server error:\n${err.stack}`)
  });

  UdpServer.on('message', (msg, rinfo) =>{
    console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
    win.webContents.send('rtMsg', 'Udp Server', rinfo.address+":"+rinfo.port, msg.toString())
  });

  UdpServer.on('listening', () => {
    const address = UdpServer.address();
    console.log(`server listening ${address.address}:${address.port}`);
    win.webContents.send('onlineState', 3, true)
  });

  UdpServer.on('close', () => {
    console.log('UdpServer Close')
    win.webContents.send('onlineState', 3, false)
    UdpServer = null
    UdpServer = dgram.createSocket('udp4')
  })

  UdpServer.bind(port,ip)
  // UdpServer.close()
}

let UdpClinet = dgram.createSocket('udp4');

function UdpSender (msg, ip, port) {
  let message = new Buffer("ok send");
  console.log(message)
  UdpClinet.send(message, 0, message.length, port, ip, function(err, bytes){
    if (err) throw err;
    console.log('UDP msg send ${ip}:${port}')
    // UdpClinet.close()
  })
}



ipcMain.on('OnConnect', (event, id, ip, port, value) => {
  console.log('on')
  switch(value) {
    case true:
      switch(id) {
        case 0: 
          //
        break
        case 1:
          tcpServer(port)
        break
        case 2:
          TcpClientConnect(ip, port)
        break
        case 3:
          UdpServerConnect(ip, port)
        break
        case 4:
          UdpSender('OK',ip,port)
        }
      break
    case false:
      switch(id) {
        case 0:
          //
          break
        case 1:
          for (let Clinet of connectedSocketClient) {
            Clinet.destroy()             
          }
          server.close(function() {
            server.unref()
          })
          break
        case 2:
          TcpClient.end()
        break
        case 3:
          UdpServer.close()
      }
  }
})

ipcMain.on('sendMsg', (event, msg) => {
  console.log('send out >>'+ msg)
  connectedSocketClient.broadcast(msg)
  TcpClientWrite(msg)

})

