//Este script se carga antes de que se inicie el programa y se ejecuta en el proceso principal.
//Se puede usar para exponer funciones o variables al proceso de renderizado(El cual no tiene acceso al sistema).
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('exposed', {
  // Funcion que envie el archivo al proceso principal
  readExcel: (file) => {
    const reader = new FileReader()
    reader.onload = () => {
      ipcRenderer.send('read-excel', reader.result)
    }
    reader.readAsArrayBuffer(file)
  },
  sendReceipts: (emailText) => {
    ipcRenderer.send('send-receipts', emailText)
  },
  onData: (callback) => ipcRenderer.on('data', callback), // Nueva función para escuchar eventos 'data'
  saveFile: (file) => ipcRenderer.send('save-file', file)
})
