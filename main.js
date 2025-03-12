//Imports
const { app, BrowserWindow, ipcMain } = require('electron/main')
const path = require('node:path')
const axios = require('axios')
var XLSX = require("xlsx");
const fs = require('fs');
var request = require('request');
const cryptojs = require('crypto-js');
const { Console } = require('node:console');

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


//Función que recibe el objeto de la hoja de cálculo y lo lee (Alomejor hace más cosas, cuando tengamos la clave lo sopesamos)
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



//Codificacion y formateo de las variables

// Clave secreta
var merchant_key = "TUH2qhVi2vR4fnLXFFgePRQGqeHTTT3P";
/*
var unencrypted = {
  "DS_MERCHANT_TRANSACTIONTYPE": "F",
  "DS_MERCHANT_AMOUNT": "001",
  "DS_MERCHANT_CUSTOMER_MOBILE": "687349178",
  "DS_MERCHANT_CUSTOMER_MAIL": "emiliogomeznef@hotmail.com",
  "DS_MERCHANT_TITULAR": "Emilio",
  "DS_MERCHANT_MERCHANTCODE":"364130880",
  "DS_MERCHANT_TERMINAL": "999",
  "DS_MERCHANT_CURRENCY": "978",
  "DS_MERCHANT_P2F_EXPIRYDATE": "14400",
  "DS_MERCHANT_ORDER": "2025TESTTPV1",
  "DS_MERCHANT_MERCHANTSIGNATURE": "TUH2qhVi2vR4fnLXFFgePRQGqeHTTT3P",
  "DS_MERCHANT_CUSTOMER_SMS_TEXT": "Robokids info@rbkds.com | Cobreo cuota (mes) @URL@",
  "DS_MERCHANT_P2F_XMLDATA": "<nombreComprador>NOMBRE DEL COMPRADOR</nombreComprador><direccionComprador>DIRECCION DEL COMPRADOR</direccionComprador> <textoLibre1>TEXTO LIBRE</textoLibre1><subjectMailCliente>ASUNTO EMAIL</subjectMailCliente>"
};
*/

let amount = "";
let customerMobile = "";
let customerName = "";
let customerMail = "";


// Añadimos al codigo de pedido unos numeros para que no se repita
function generateOrderCode() {
  return "TESTTPV" + Math.floor(Math.random() * 10000);
}



function encodeAndFormat(unencrypted){
    // Codificacion de los parametros en base 64
    var merchantWordArray = cryptojs.enc.Utf8.parse(JSON.stringify(unencrypted));
    var merchantBase64 = merchantWordArray.toString(cryptojs.enc.Base64);

    // Codificacion de la clave secreta
    var keyWordArray = cryptojs.enc.Base64.parse(merchant_key);

    // Generar la clave de la transaccion
    var iv = cryptojs.enc.Hex.parse("0000000000000000");
    var cipher = cryptojs.TripleDES.encrypt(unencrypted.DS_MERCHANT_ORDER, keyWordArray, {
      iv:iv,
      mode: cryptojs.mode.CBC,
      padding: cryptojs.pad.ZeroPadding
    });

    // Hacer la firma
    var signature = cryptojs.HmacSHA256(merchantBase64, cipher.ciphertext);
    var signatureBase64 = signature.toString(cryptojs.enc.Base64);
    
    // Devolvemos los parametros y la dfirma en base 64
    return [merchantBase64, signatureBase64];
}



//Hay que hacer una funcion que itere la matriz y guarde en un vector la info de cada clientey que cuando la primera columna sea un espacio con valor null que pare de guardar info
function getCustomerInfo(matrix) {
  let customerInfo = [];
  for (let i = 0; i < matrix.length; i++) {
    if (matrix[i][0] === null) {
      break;
    }
    printMatrix(matrix);
    customerInfo.push({
      name: matrix[i][2],
      mail: matrix[i][1],
      phone: matrix[i][3],
      amount: matrix[i][4]
    });
    console.log('customerInfo: ', customerInfo);
  }
  return customerInfo;
}

//Fumcion que coje el vector de info de los clientes y llama a la API de redsys

ipcMain.on('send-receipts', async (event,emailText) => {
  console.log('send-receipts');
  console.log('Message: ', emailText); 
  const customers = getCustomerInfo(filledMatrix).slice(1);
  for (const customer of customers) {
    amount = customer.amount.toString();
    customerMobile = customer.phone.toString();
    console.log('customerMobile: ', customer.phone.toString());
    console.log('customerMobile: ', customerMobile);
    customerName = customer.name.toString();
    customerMail = customer.mail.toString();



    var unencrypted = {
      "DS_MERCHANT_TRANSACTIONTYPE": "F",
      "DS_MERCHANT_AMOUNT": "001",
      "DS_MERCHANT_CUSTOMER_MOBILE": customerMobile,
      "DS_MERCHANT_CUSTOMER_MAIL": customerMail,
      "DS_MERCHANT_TITULAR": customerName,
      "DS_MERCHANT_MERCHANTCODE":"364130880",
      "DS_MERCHANT_TERMINAL": "999",
      "DS_MERCHANT_CURRENCY": "978",
      "DS_MERCHANT_P2F_EXPIRYDATE": "14400",
      "DS_MERCHANT_ORDER": generateOrderCode(),
      "DS_MERCHANT_MERCHANTSIGNATURE": "TUH2qhVi2vR4fnLXFFgePRQGqeHTTT3P",
      "DS_MERCHANT_CUSTOMER_SMS_TEXT": emailText + "@URL@",
      "DS_MERCHANT_P2F_XMLDATA": "<nombreComprador>NOMBRE DEL COMPRADOR</nombreComprador><direccionComprador>DIRECCION DEL COMPRADOR</direccionComprador> <textoLibre1>"+ emailText+"</textoLibre1><subjectMailCliente>Robokids</subjectMailCliente>"
    };




    merchantData = encodeAndFormat(unencrypted)[0];
    signatureData = encodeAndFormat(unencrypted)[1];
    console.log('merchantData: ', unencrypted);

    try {
      var data = await callRestApi(merchantData, signatureData);
      console.log('data al final del to: ', data);
      const JSON = decodeBase64ToJson(data.Ds_MerchantParameters);
      console.log('JSON: ', JSON);
      const url = JSON.Ds_UrlPago2Fases;
      console.log('url: ', url);
      addUrlToExistingExcel(url);
      console.log('URL añadida al archivo Excel');
      

      // Enviar datos al proceso de renderizado
      event.sender.send('data', data.errorCode);
    } catch (error) {
      console.error('Error al llamar a la API: ', error);
      event.sender.send('error', error.message);
    }
  }
  //callRestApi();
  /*
  const customerInfo = getCustomerInfo(filledMatrix);
  console.log('customerInfo: ', customerInfo);
  for (const customer of customerInfo) {
    callRestApi(customer.name, customer.mail, customer.phone, customer.amount);
  }
  */
});





function EncryptData(unencrypted) {
  var base64 = encodeBase64(JSON.stringify(unencrypted));
  var signature = encodeHmacSha256('TUH2qhVi2vR4fnLXFFgePRQGqeHTTT3P', base64);
  return signature;
}

//LLamada a la API de pruebas de redsys('https://sis-t.redsys.es:25443/sis/realizarPago) con axios
async function callRestApi(merchantParameters, signature) {
  try {
      const response = await axios.post('https://sis.redsys.es/sis/rest/trataPeticionREST', {
          "DS_SIGNATUREVERSION": "HMAC_SHA256_V1",
          "DS_MERCHANTPARAMETERS": merchantParameters,
          "DS_SIGNATURE": signature
      });
      const returnData = response.data;
      console.log('returnData antes de returnealos: ', returnData);
      

      return returnData;
  } catch (error) {
      console.error('Error: ', error);
      throw error;
  }
}
// Función para decodificar de Base64 a string
function decode64(data) {
  return Buffer.from(data, 'base64').toString('utf-8');
}

// Función para decodificar de Base64 a JSON
function decodeBase64ToJson(data) {
  const decodedString = decode64(data);
  return JSON.parse(decodedString);
}


var filename;
// Manejar el evento save-file para guardar el archivo en una carpeta específico
ipcMain.on('save-file', (event, file) => {
  console.log('save-file');
  const saveDir = path.join(__dirname, 'excels');
  /*if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir);
  }*/
  filename = file.name;
  const savePath = path.join(saveDir, file.name);
  const buffer = Buffer.from(file.buffer);
  fs.writeFile(savePath, buffer, (err) => {
      if (err) {
          console.error('Error al guardar el archivo:', err);
          event.reply('error', 'Error al guardar el archivo');
      } else {
          console.log('Archivo guardado en:', savePath);
      }
  });
});

// Función para agregar una URL a la siguiente fila vacía en la columna H de un archivo Excel existente
function addUrlToExistingExcel(url) {
  const filePath = path.join(__dirname, 'excels', filename);
  if (!fs.existsSync(filePath)) {
      console.log('El archivo no existe:', filePath);
      return;
  }

  // Leer el archivo Excel existente
  const workbook = XLSX.readFile(filePath);
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Obtener el rango de la hoja
  const range = XLSX.utils.decode_range(worksheet['!ref']);

  // Encontrar la próxima fila vacía en la columna H
  let nextRow = range.s.r + 1;
  while (worksheet[XLSX.utils.encode_cell({ c: 7, r: nextRow })]) {
      nextRow++;
  }
    // Agregar la URL en la próxima fila vacía en la columna H
    const cellAddress = { c: 7, r: nextRow }; // Columna H es la columna 7 (0-indexed)
    const cellRef = XLSX.utils.encode_cell(cellAddress);
    worksheet[cellRef] = { t: 's', v: url };

    // Actualizar el rango de la hoja
    range.e.c = Math.max(range.e.c, 7);
    range.e.r = Math.max(range.e.r, nextRow);
    worksheet['!ref'] = XLSX.utils.encode_range(range);

    // Guardar el archivo Excel actualizado
    XLSX.writeFile(workbook, filePath);
    console.log('Archivo Excel actualizado guardado en:', filePath);
}


