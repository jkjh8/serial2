'use strict'

import { app, protocol, BrowserWindow, ipcMain } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
// import { dgram } from 'dgram'
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

  console.log('Client Connect: %s:%s',Client.remoteAddress, Client.remotePort);

  // win.webContents.send('onConnect', Client.remoteAddress, Client.remotePort)

  Client.on('data', function (data) {
    console.log('Tcp Server Recv Data %d: %s', Client.remotePort,data.toString());
    // win.webContents.send('tcpServer', data)
    // if (!data) return
    connectedSocketClient.broadcast(data)
  })
  Client.on('close', function() {
    connectedSocketClient.delete(Client)
  })
})

server.on('error', function(err) {
  // Tcp server Error Report
  console.log('tcp server err = ' + err);
})

server.listen(59432, function() {
  console.log('Server listening: '+ JSON.stringify(server.address()));
  server.on('close', function(){
    console.log("Server Close");
  })
  server.on('error', function(err){
    console.log('Server Error: ',JSON.stringify(err));
  })
})

ipcMain.on('onConnect', (event, arg) => {
  console.log(arg)
  connectedSocketClient.broadcast("ok")

})