//Este script es el que se ejecuta en el proceso de renderizado.
//Se puede usar para acceder a funciones o variables del proceso principal y mostrarlas.
const information = document.getElementById('info')
information.innerText = `This app is using Chrome (v${versions.chrome()}), Node.js (v${versions.node()}), and Electron (v${versions.electron()})`

//Función de debug para comprobar que la comunicación entre procesos funciona
const func = async () => {
    const response = await window.versions.ping()
    console.log(response) // prints out 'pong'
  }
  
func()