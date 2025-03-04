//Este script se carga antes de que se inicie el programa y se ejecuta en el proceso principal.
//Se puede usar para exponer funciones o variables al proceso de renderizado(El cual no tiene acceso al sistema).
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  // Funcion de debug Ping que llama a la funcion ping del proceso principal
  ping: () => ipcRenderer.invoke('ping')
  // we can also expose variables, not just functions
})
