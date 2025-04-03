//Este script es el que se ejecuta en el proceso de renderizado.
//Se puede usar para acceder a funciones o variables del proceso principal y mostrarlas.


//Mensajes de exito y error de la api
document.addEventListener('DOMContentLoaded', () => {
  //Mensajes de exito y error
const successMessage = document.getElementById('successModal');
const successClose = document.getElementById('successClose');
const errorMessage = document.getElementById('errorModal');
const errorClose = document.getElementById('errorClose');
  // Seleccionar el elemento errorAPIModal
    const errorApiMessage = document.getElementById('errorAPIModal');
    const errorApiClose = document.getElementById('errorApiClose');
    const successApiMessage = document.getElementById('successAPIModal'); 
    const successApiClose = document.getElementById('successApiClose');
    const successText = document.getElementById('successText');

  //loading
  const uploadSection = document.getElementById('drop-area');
  const loadingGif = document.getElementById('loadinggif');
  const loadingdiv = document.getElementById('loading'); 

 



//Funcion para mostrar mensaje de exito eliminandole la clase hidden
function showSuccessMessage() {
    successMessage.classList.remove('hidden');
}

function hideSuccessMessage() {
  successMessage.classList.add('hidden');
}

successClose.addEventListener('click', () => {
    hideSuccessMessage();
    //successText.textContent = 'Archivo subido correctamente';
  }
);

//Funcion para mostrar mensaje de error eliminandole la clase hidden
function showErrorMessage() {
    errorMessage.classList.remove('hidden');
}

function hideErrorMessage() {
  errorMessage.classList.add('hidden');
}

errorClose.addEventListener('click', () => {
    hideErrorMessage();
  }
);

//Funcion para mostrar mensaje de error de la api eliminandole la clase hidden
function showApiErrorMessage(message) {
  document.getElementById('textError').textContent= 'Ha ocurrido un error: ' + message;
  errorApiMessage.classList.remove('hidden');
}

errorApiClose.addEventListener('click', () => {
    errorApiMessage.classList.add('hidden');
  }
);

function showApiSuccessMessage() {
  successApiMessage.classList.remove('hidden');
}

successApiClose.addEventListener('click', () => {
  successApiMessage.classList.add('hidden');
}
);

// Seleccionar el input message
const messageInput = document.getElementById('message');
let messageValue = '';

// Actualizar la variable messageValue cada vez que el usuario cambie el valor del input
messageInput.addEventListener('input', (event) => {
    messageValue = event.target.value;
    console.log('Message Value: ', messageValue); // Para debug
});



//Drag&Drop
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const fileInputManual = document.getElementById('loadButton');
const fileNameDisplay = document.getElementById('fileName');
const receiptButton = document.getElementById('receiptButton');

//Añade al boton un onlcick que triggerea la funcion de mandar la llamada
receiptButton.addEventListener('click', () => {
    
    // Reproducir el sonido
    const audio = new Audio('../assets/Cash_Register_Open1.wav');
    audio.play();


    window.exposed.sendReceipts(messageValue);
    uploadSection.classList.add('hidden');
    loadingGif.classList.remove('hidden');
    loadingdiv.classList.remove('hidden');
    document.getElementById('message').value = '';
    // Después de unos segundos, volver a mostrar la sección de carga y ocultar el GIF
    setTimeout(() => {
      uploadSection.classList.remove('hidden');
      loadingdiv.classList.add('hidden');
      loadingGif.classList.add('hidden');
    }, 2000); // Cambia el tiempo según sea necesario

});
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
  
      handleFiles(files);
    }
}

//Funcion que coge el archvio añadido por el campo input y llama a handleFiles
fileInputManual.addEventListener('change', (e) => {
    const files = e.target.files;
    handleFiles(files);
});
//Funcion para manejar los archivos
function handleFiles(files) {
  for (const file of files) {
    // Initializing the FileReader API and reading the file
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);

    // Once the file has been loaded, fire the processing
    reader.onloadend = function (e) {
      if (isValidFileType(file)) {
          //Logica si el archivo añadido es una tabla
          showSuccessMessage();
          //Muestra el archivo tambien en el input manual
          fileNameDisplay.textContent = file.name;
          window.exposed.readExcel(file);
          //Muestra el boton de enviar factura
          receiptButton.classList.remove('hidden');
          // Enviar el archivo al proceso principal para guardarlo
          const bufferR = reader.result;
          window.exposed.saveFile({ name: file.name, buffer: bufferR });
          console.log('enviao');

      }else{
          //Muestra una alerta si el archivo no es una tabla
          showErrorMessage();
          //Elimina el archivo del input
          fileInput.value = '';
          fileInputManual.value = '';
          fileNameDisplay.textContent = '';
          console.log(fileInput.files);
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


// Escuchar eventos 'data' desde el proceso principal
window.exposed.onData((event, data) => {
  console.log('Data received from main process:', data);
  setTimeout(() => {
    if (data === undefined){
      //showApiSuccessMessage();
      successText.textContent = 'Operación completada correctamente';
      showSuccessMessage();
      
      //Elimina el archivo del input
      fileInput.value = '';
      fileInputManual.value = '';
      fileNameDisplay.textContent = '';
  
    }else
    if(data.includes('SIS')){
      showApiErrorMessage(data);
      //Elimina el archivo del input
      fileInput.value = '';
      fileInputManual.value = '';
      fileNameDisplay.textContent = '';
    }
  }, 2000); 
  

});

});