//Imports
const { app, BrowserWindow, ipcMain } = require('electron/main')
const path = require('node:path')
const axios = require('axios')
var XLSX = require("xlsx");
const fs = require('fs');
var request = require('request');
const crypto = require('crypto');

//Configura la ventana principal
const createWindow = () => {
  const win = new BrowserWindow({
    width: 1000,
    height: 650,
    webPreferences: {
        preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true,

  })

  win.loadFile('routes/index.html')
}

/*
//Cuando la aplicación esté lista, crea una ventana
app.whenReady().then(() => {
  createWindow()
})
*/

//Crear la ventana pero la comprobación extra es para macOS
app.whenReady().then(() => {
    ipcMain.handle('ping', () => 'pong')
    createWindow()
  
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
})

//Asegurarse de que se cierra la aplicación cuando todas las ventanas están cerradas (excepto en macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})


//Variables
var filledMatrix = [];

//Función que recibe el objeto de la hoja de cálculo y lo lee
ipcMain.on('read-excel', (event, data) => {
    console.log('read-excel');
    console.log('Excel main: ', data);
    if (!data) {
        console.log('No data');
        event.reply('read-excel-reply', null);
        return;
    }
    const workbook = XLSX.read(data, {type: 'array'});
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = sheetToJsonWithCellRefs(worksheet);
    const matrix = jsonToMatrix(jsonData);
    printMatrix(matrix);
    filledMatrix = matrix;
    //console.log(matrix);
    //console.log(matrix[1][1]);
    //console.log(jsonData);
    //event.reply('read-excel-reply', worksheet);

    console.log('filledMatrix: ', filledMatrix);

    //Llamada a la API de pruebas de redsys
    callRestApi('Emilio', 'emiliogomeznef@hotmail.com', 687349178 , 0.01);
});

function sheetToJsonWithCellRefs(sheet) {
  const result = {};
  const range = XLSX.utils.decode_range(sheet['!ref']);
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = { c: C, r: R };
      const cellRef = XLSX.utils.encode_cell(cellAddress);
      const cell = sheet[cellRef];
      if (cell && cell.v !== undefined) {
        result[cellRef] = cell.v;
      }
    }
  }
  return result;
}

//Funcion que transforma el JSON en matriz

function jsonToMatrix(json) {
  // Determinar el rango de celdas
  let minRow = Infinity, maxRow = -Infinity, minCol = Infinity, maxCol = -Infinity;
  for (const cell in json) {
    const { r, c } = XLSX.utils.decode_cell(cell);
    if (r < minRow) minRow = r;
    if (r > maxRow) maxRow = r;
    if (c < minCol) minCol = c;
    if (c > maxCol) maxCol = c;
  }

  // Crear una matriz vacía con el tamaño adecuado
  const numRows = maxRow - minRow + 1;
  const numCols = maxCol - minCol + 1;
  const matrix = Array.from({ length: numRows }, () => Array(numCols).fill(null));

  // Rellenar la matriz con los valores del JSON
  for (const cell in json) {
    const { r, c } = XLSX.utils.decode_cell(cell);
    matrix[r - minRow][c - minCol] = json[cell];
  }

  return matrix;
}

//Funcion para imprimir la matriz
function printMatrix(matrix) {
  // Imprimir encabezado de columnas
  let header = '   ';
  for (let i = 0; i < matrix[0].length; i++) {
    header += `${i} `;
  }
  console.log(header);

  // Imprimir filas con índices
  for (let i = 0; i < matrix.length; i++) {
    let row = `${i} `;
    for (let j = 0; j < matrix[i].length; j++) {
      row += `${matrix[i][j] || ''} `;
    }
    console.log(row);
  }
}

//Funcion para codificar el valor del el parametro Ds_MerchantParameters en base64 sin retorno de carros
function encodeBase64(value) {
  return Buffer.from(value).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

//Funcion para codificar en HMAC SHA256
function encodeHmacSha256(key, value) {
  return crypto.createHmac('sha256', key).update(value).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}





//LLamada a la API de pruebas de redsys('https://sis-t.redsys.es:25443/sis/realizarPago) con axios
function callRestApi(name, mail, phone, amount) {
    axios.post('https://sis-t.redsys.es:25443/sis/realizarPago', {
        "DS_MERCHANT_TRANSACTIONTYPE": "15",
        "DS_MERCHANT_AMOUNT": "001",
        "DS_MERCHANT_CUSTOMER_MOBILE": "687349178",
        "DS_MERCHANT_CUSTOMER_MAIL": "emiliogomeznef@hotmail.com",
        "DS_MERCHANT_TITULAR": "Emilio",
        "DS_MERCHANT_MERCHANTCODE":"364130880",
        "DS_MERCHANT_TERMINAL": "999",
        "DS_MERCHANT_CURRENCY": "978",
        "DS_MERCHANT_P2F_EXPIRYDATE": "14400",
        "DS_MERCHANT_ORDER": "2025TESTTPV00",
        "DS_MERCHANT_MERCHANTSIGNATURE": "sq7HjrUOBfKmC576ILgskD5srU870gJ7",
        "DS_MERCHANT_CUSTOMERSMSTEXT": "Prueba de pago",
        "DS_MERCHANT_P2F_XMLDATA": "<nombreComprador>NOMBRE DEL COMPRADOR</nombreComprador><direccionComprador>DIRECCION DEL COMPRADOR</direccionComprador> <textoLibre1>TEXTO LIBRE</textoLibre1><subjectMailCliente>ASUNTO EMAIL</subjectMailCliente>",
    })
    .then((response) => {
        console.log('Response: ', response);
        //Dunmp del contenido de response.data en un archivo de texto
        
        fs.writeFileSync('response.txt', JSON.stringify(response.data));

    })
    .catch((error) => {
        console.error('Error: ', error);
    });
}

/*
"DS_MERCHANT_TRANSACTIONTYPE":"15","DS_MERCHANT_AMOUNT":"001","DS_MERCHANT_CUSTOMER_MOBILE":"687349178","DS_MERCHANT_CUSTOMER_MAIL":"emiliogomeznef@hotmail.com","DS_MERCHANT_TITULAR":"Emilio","DS_MERCHANT_MERCHANTCODE":"364130880","DS_MERCHANT_TERMINAL":"999","DS_MERCHANT_CURRENCY":"978","DS_MERCHANT_P2F_EXPIRYDATE":"14400","DS_MERCHANT_ORDER":"2025TESTTPV00","DS_MERCHANT_CUSTOMERSMSTEXT":"Prueba de pago","DS_MERCHANT_P2F_XMLDATA":"<nombreComprador>NOMBRE DEL COMPRADOR</nombreComprador><direccionComprador>DIRECCION DEL COMPRADOR</direccionComprador><textoLibre1>TEXTO LIBRE</textoLibre1><subjectMailCliente>ASUNTO EMAIL</subjectMailCliente>"
*/

//LLamada a la API de pruebas de redsys('https://sis-t.redsys.es:25443/sis/realizarPago) sin axios

function callRestApi2(name, mail, phone, amount) {
    var options = {
        'method': 'POST',
        'url': 'https://sis-t.redsys.es:25443/sis/realizarPago',
        'headers': {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
        "DS_MERCHANT_TRANSACTIONTYPE": "F",
        "DS_MERCHANT_AMOUNT": 0.01,
        "DS_MERCHANT_CUSTOMER_MOBILE": 687349178,
        "DS_MERCHANT_CUSTOMER_MAIL": "emiliogomeznef@hotmail.com",
        "DS_MERCHANT_TITULAR": "Emilio",
        "DS_MERCHANT_MERCHANTCODE": "364130880",
        "DS_MERCHANT_TERMINAL": "999",
        "DS_MERCHANT_CURRENCY": "978",
        "DS_MERCHANT_P2F_EXPIRYDATE": "14400",
        "DS_MERCHANT_ORDER": "2025TESTTPV00",
        "DS_MERCHANT_CUSTOMERSMSTEXT": "Prueba de pago",
        "DS_MERCHANT_P2F_XMLDATA": "<nombreComprador>NOMBRE DEL COMPRADOR</nombreComprador><direccionComprador>DIRECCION DEL COMPRADOR</direccionComprador> <textoLibre1>TEXTO LIBRE</textoLibre1><subjectMailCliente>ASUNTO EMAIL</subjectMailCliente>",
        }),
    };
    request(options, function (error, response) {
        if (error) throw new Error(error);
        console.log(response.body);
    });
}
