//Este script es el que se ejecuta en el proceso de renderizado.
//Se puede usar para acceder a funciones o variables del proceso principal y mostrarlas.
//Prueba
/*
const information = document.getElementById('info')
information.innerText = `This app is using Chrome (v${versions.chrome()}), Node.js (v${versions.node()}), and Electron (v${versions.electron()})`
*/
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

function handleDrop(e) {
    // Evitar que abra el archivo al soltarlo que es el comportamiento por defecto
    e.preventDefault();
    // Eliminar la clase de drag-over
    dropArea.classList.remove('drag-over');

    // Getting the list of dragged files
    const files = e.dataTransfer.files;
    console.log(files);
    // Checking if there are any files
    if (files.length) {
      // Assigning the files to the hidden input from the first step
      fileInput.files = files;
  
      // Processing the files for previews (next step)
      handleFiles(files);
    }
}

function handleFiles(files) {
    for (const file of files) {
      // Initializing the FileReader API and reading the file
      const reader = new FileReader();
      reader.readAsDataURL(file);
  
      // Once the file has been loaded, fire the processing
      reader.onloadend = function (e) {

  
        if (isValidFileType(file)) {
            //Logica si el archivo añadido es una tabla
            console.log('Es un archivo de tabla');
            
        }
  
        
      };
    }
}

//Funcion que comprueba si el archivo es .xlsx

function isValidFileType(file) {
    return file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
}
  

//Cambia el estilo del css cuando pones un archivo encima
dropArea.addEventListener('dragover', () => {
    dropArea.classList.add('drag-over');
});
  
  dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('drag-over');
});