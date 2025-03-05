//Imports
const { app, BrowserWindow, ipcMain } = require('electron/main')
const path = require('node:path')
var XLSX = require("xlsx");

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
    //console.log(matrix);
    //console.log(matrix[1][1]);
    //console.log(jsonData);
    event.reply('read-excel-reply', worksheet);
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