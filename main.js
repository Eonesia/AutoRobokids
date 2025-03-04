const { app, BrowserWindow } = require('electron')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600
  })

  win.loadFile('routes/index.html')
}

app.whenReady().then(() => {
  createWindow()
})