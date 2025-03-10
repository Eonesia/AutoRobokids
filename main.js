//Imports
const { app, BrowserWindow, ipcMain } = require('electron/main')
const path = require('node:path')
const axios = require('axios')
var XLSX = require("xlsx");
const fs = require('fs');
var request = require('request');
const cryptojs = require('crypto-js');

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

    //Llamada a la API de pruebas de redsys
    //callRestApi('Emilio', 'emiliogomeznef@hotmail.com', 687349178 , 0.01);
    //var value ={"DS_MERCHANT_AMOUNT":"145","DS_MERCHANT_CURRENCY":"978","DS_MERCHANT_MERCHANTCODE":"999008881","DS_MERCHANT_MERCHANTURL":"http://www.prueba.com/urlNotificacion.php","DS_MERCHANT_ORDER":"1446068581","DS_MERCHANT_TERMINAL":"1","DS_MERCHANT_TRANSACTIONTYPE":"0","DS_MERCHANT_URLKO":"http://www.prueba.com/urlKO.php","DS_MERCHANT_URLOK":"http://www.prueba.com/urlOK.php"}
    var value = {
      "DS_MERCHANT_AMOUNT": "145",
      "DS_MERCHANT_CURRENCY": "978",
      "DS_MERCHANT_MERCHANTCODE": "999008881",
      "DS_MERCHANT_MERCHANTURL": "http://www.prueba.com/urlNotificacion.php",
      "DS_MERCHANT_ORDER": "1446068581",
      "DS_MERCHANT_TERMINAL": "1",
      "DS_MERCHANT_TRANSACTIONTYPE": "0",
      "DS_MERCHANT_URLKO": "http://www.prueba.com/urlKO.php",
      "DS_MERCHANT_URLOK": "http://www.prueba.com/urlOK.php"
  }

    console.log('Base64: ', encodeBase64(JSON.stringify(value)));

    console.log('Decodificado:')
    console.log(decodeBase64(encodeBase64(JSON.stringify(value))));

    console.log('ejemplo:')
    console.log(decodeBase64("ew0KICAgICJEU19NRVJDSEFOVF9BTU9VTlQiOiAiMTQ1IiwNCiAgICAiRFNfTUVSQ0hBTlRfQ1VSUkVOQ1kiOiAiOTc4IiwNCiAgICAiRFNfTUVSQ0hBTlRfTUVSQ0hBTlRDT0RFIjogIjk5OTAwODg4MSIsDQogICAgIkRTX01FUkNIQU5UX01FUkNIQU5UVVJMIjogImh0dHA6Ly93d3cucHJ1ZWJhLmNvbS91cmxOb3RpZmljYWNpb24ucGhwIiwNCiAgICAiRFNfTUVSQ0hBTlRfT1JERVIiOiAiMTQ0NjA2ODU4MSIsDQogICAgIkRTX01FUkNIQU5UX1RFUk1JTkFMIjogIjEiLA0KICAgICJEU19NRVJDSEFOVF9UUkFOU0FDVElPTlRZUEUiOiAiMCIsDQogICAgIkRTX01FUkNIQU5UX1VSTEtPIjogImh0dHA6Ly93d3cucHJ1ZWJhLmNvbS91cmxLTy5waHAiLA0KICAgICJEU19NRVJDSEFOVF9VUkxPSyI6ICJodHRwOi8vd3d3LnBydWViYS5jb20vdXJsT0sucGhwIg0KfQ=="))

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

//Funcion para decodificar base 64
function decodeBase64(value) {
  return Buffer.from(value, 'base64').toString();
}

//Funcion para codificar en HMAC SHA256
function encodeHmacSha256(key, value) {
  return crypto.createHmac('sha256', key).update(value).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

//Vamos a porbar el codigo del muchacho de stackoverflow

var merchant_key = "TUH2qhVi2vR4fnLXFFgePRQGqeHTTT3P";

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
  "DS_MERCHANT_ORDER": "2025TESTTPV",
  "DS_MERCHANT_MERCHANTSIGNATURE": "TUH2qhVi2vR4fnLXFFgePRQGqeHTTT3P",
  "DS_MERCHANT_CUSTOMERSMSTEXT": "Prueba de pago",
  "DS_MERCHANT_P2F_XMLDATA": "<nombreComprador>NOMBRE DEL COMPRADOR</nombreComprador><direccionComprador>DIRECCION DEL COMPRADOR</direccionComprador> <textoLibre1>TEXTO LIBRE</textoLibre1><subjectMailCliente>ASUNTO EMAIL</subjectMailCliente>"
};

// Base64 encoding of parameters
var merchantWordArray = cryptojs.enc.Utf8.parse(JSON.stringify(unencrypted));
var merchantBase64 = merchantWordArray.toString(cryptojs.enc.Base64);

// Decode key
var keyWordArray = cryptojs.enc.Base64.parse(merchant_key);

// Generate transaction key
var iv = cryptojs.enc.Hex.parse("0000000000000000");
var cipher = cryptojs.TripleDES.encrypt(unencrypted.DS_MERCHANT_ORDER, keyWordArray, {
  iv:iv,
  mode: cryptojs.mode.CBC,
  padding: cryptojs.pad.ZeroPadding
});

// Sign
var signature = cryptojs.HmacSHA256(merchantBase64, cipher.ciphertext);
var signatureBase64 = signature.toString(cryptojs.enc.Base64);

// Done, we can return response
var response = {
  signatureVersion: "HMAC_SHA256_V1",
  merchantParameters: merchantBase64,
  signature: signatureBase64
};


//Hay que hacer una funcion que itere la matriz y guarde en un vector la info de cada clientey que cuando la primera columna sea un espacio con valor null que pare de guardar info
function getCustomerInfo(matrix) {
  let customerInfo = [];
  for (let i = 0; i < matrix.length; i++) {
    if (matrix[0][i] === null) {
      break;
    }
    customerInfo.push({
      name: matrix[0][i],
      mail: matrix[1][i],
      phone: matrix[2][i],
      amount: matrix[3][i]
    });
  }
  return customerInfo;
}

//Fumcion que coje el vector de info de los clientes y llama a la API de redsys
ipcMain.on('send-receipts', () => {
  console.log('send-receipts');
  callRestApi();
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
//name, mail, phone, amount
function callRestApi() {
    axios.post('https://sis.redsys.es/sis/rest/trataPeticionREST', {
        "DS_SIGNATUREVERSION": "HMAC_SHA256_V1",
        "DS_MERCHANTPARAMETERS": merchantBase64,
        "DS_SIGNATURE": signatureBase64
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
