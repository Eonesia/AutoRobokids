//Este script es el que se ejecuta en el proceso de renderizado.
//Se puede usar para acceder a funciones o variables del proceso principal y mostrarlas.

//Prueba
const information = document.getElementById('info')
information.innerText = `This app is using Chrome (v${versions.chrome()}), Node.js (v${versions.node()}), and Electron (v${versions.electron()})`

//Función de debug para comprobar que la comunicación entre procesos funciona
const func = async () => {
    const response = await window.versions.ping()
    console.log(response) // prints out 'pong'
  }
  
func()


//Drag&Drop
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');

//Funcion para evitar el comportamiento por defecto del "navegador"
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

dropArea.addEventListener('dragover', preventDefaults);
dropArea.addEventListener('dragenter', preventDefaults);
dropArea.addEventListener('dragleave', preventDefaults);


// Manejar comportamiento cuando dropear un archivo
dropArea.addEventListener('drop', handleDrop);

//Cambia el estilo del css cuando pones un archivo encima
dropArea.addEventListener('dragover', () => {
    dropArea.classList.add('drag-over');
});
  
  dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('drag-over');
});