import { CONFIG } from './config.js';
import { showError } from './ui.js';

export function findColumnIndexes(headers) {
  const indexes = {};
  for (const key in CONFIG.COLUMN_NAMES) {
    for (const possible of CONFIG.COLUMN_NAMES[key]) {
      const idx = headers.findIndex(h => ("" + h).trim().toLowerCase() === possible.toLowerCase());
      if (idx !== -1) {
        indexes[key] = idx;
        break;
      }
    }
  }
  return indexes;
}

export async function getSheetDataWithHeaders() {
  return await Excel.run(async (context) => {
    const sheet = context.workbook.worksheets.getActiveWorksheet();
    const usedRange = sheet.getUsedRange();
    usedRange.load("values");
    await context.sync();
    const rows = usedRange.values;
    if (rows.length < 2) throw new Error("Brak pozycji do wyceny w arkuszu");
    const headers = [...rows[1]];
    const dataRows = rows.slice(2).map(r => {
      while (r.length < headers.length) r.push("");
      return r;
    });
    return { headers, dataRows };
  });
}

export async function writetoExcel(rowNum, colIndexes, dane) {
  try {
    await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const color = "#DFCBFF";

      if ('komentarz_ai' in dane) {
        const cell = sheet.getCell(rowNum, colIndexes.komentarz_ai);
        cell.values = [[dane.komentarz_ai]];
        cell.format.fill.color = color;

      }
      if ('cena_materialu' in dane) { 
        const cell = sheet.getCell(rowNum, colIndexes.cena_materialu);
        cell.values = [[dane.cena_materialu]];
        cell.format.fill.color = color;
      }
      if ('cena_robocizny' in dane) {
        const cell = sheet.getCell(rowNum, colIndexes.cena_robocizny);
        cell.values = [[dane.cena_robocizny]];
        cell.format.fill.color = color;
      }
      if ('kod_budzetowy' in dane) { 
        const cell = sheet.getCell(rowNum, colIndexes.kod_budzetowy);
        cell.values = [[dane.kod_budzetowy]];
        cell.format.fill.color = color;
      }
      await context.sync();
    });
  } catch (e) {
    if (typeof e.message === 'string' && (e.message.includes("edit mode") || e.message.includes("tryb edycji"))) {
      showError("Excel jest w trybie edycji komórki.\n\nAby kontynuować, zatwierdź lub anuluj edycję komórki (ENTER, TAB lub ESC), albo kliknij inną komórkę, a następnie spróbuj ponownie.");
    } else {
      showError("Wystąpił błąd: " + e.message);
    }
  }
}
