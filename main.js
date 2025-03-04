const { app, BrowserWindow } = require('electron')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1000,
    height: 650
  })

  win.loadFile('routes/index.html')
}

app.whenReady().then(() => {
  createWindow()
})