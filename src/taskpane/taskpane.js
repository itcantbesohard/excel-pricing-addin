import { updateProgressBar, showProgress, showError, clearError } from './ui.js';
import { getSheetDataWithHeaders, writetoExcel, findColumnIndexes } from './excel.js';
import { loadPricelist, filterPriceList, queryAI } from './services.js';
import { CONFIG } from './config.js';

let shouldStop = false;

Office.onReady(() => {
  document.getElementById("processBtn").onclick = startProcess;
  document.getElementById("stopBtn").onclick = () => {
    shouldStop = true;
    showProgress("⏹️ Przerywanie procesu...");
  };
});

async function startProcess() {
  shouldStop = false;
  document.getElementById("processBtn").disabled = true;
  document.getElementById("stopBtn").style.display = "inline-block";
  clearError();

  try {
    showProgress("Ładuję cennik...");
    const cennik = await loadPricelist();
    if (!cennik || cennik.length === 0) throw new Error("Cennik jest pusty lub nie został poprawnie załadowany.");

    showProgress("Pobieram dane z Excela...");
    const { headers, dataRows } = await getSheetDataWithHeaders();
    const colIndexes = findColumnIndexes(headers);
    if (!dataRows || dataRows.length === 0) throw new Error("Plik wyceny jest pusty lub nie został poprawnie załadowany.");

    const required = CONFIG.REQUIRED_COLUMNS;
    const outputs =  CONFIG.OUTPUT_COLUMNS;

    for (const key of required) if (colIndexes[key] === undefined) throw new Error("Brak kolumny źródłowej: " + key);
    for (const key of outputs) if (colIndexes[key] === undefined) throw new Error("Brak kolumny wynikowej: " + key);

    const totalRows = dataRows.length;

    for (let i = 0; i < totalRows; i++) {
      if (shouldStop) break;
      updateProgressBar(i, totalRows, `Pozycja ${i + 2} z ${totalRows}...`);
      const row = dataRows[i];
      if (!row[colIndexes.filtr_asortymentu] || String(row[colIndexes.filtr_asortymentu]).trim() === "") continue;

      const currentKod = row[colIndexes.kod_budzetowy];
      const currentCenaMaterialu = row[colIndexes.cena_materialu];
      const currentCenaRobocizny = row[colIndexes.cena_robocizny];
      const needsKod = !currentKod || String(currentKod).trim() === "";
      const needsMaterial = !currentCenaMaterialu;
      const needsRobocizna = !currentCenaRobocizny;
      
      if (!needsKod && !needsMaterial && !needsRobocizna) continue;

      const item = {
        kategorie_instalacji: row[colIndexes.kategorie_instalacji],
        filtr_asortymentu: row[colIndexes.filtr_asortymentu],
        opis: row[colIndexes.opis],
        producent: row[colIndexes.producent],
        typ: row[colIndexes.typ],
        jednostka_miary: row[colIndexes.jednostka_miary]
      };

      const filteredCennik = filterPriceList(cennik, item.filtr_asortymentu, item.kategorie_instalacji);
      if (filteredCennik.length === 0) {
        await writetoExcel(i + 2, colIndexes, { komentarz_ai: "Nie wysłano do AI - Brak pozycji w cenniku" });
        continue;
      }

      const aiRes = await queryAI(item, filteredCennik);
      const dataToWrite = {};
      if (needsKod) dataToWrite.kod_budzetowy = aiRes.kod_budzetowy;
      if (needsMaterial) dataToWrite.cena_materialu = aiRes.cena_materialu;
      if (needsRobocizna) dataToWrite.cena_robocizny = aiRes.cena_robocizny;
      dataToWrite.komentarz_ai = aiRes.komentarz_ai;
      await writetoExcel(i + 2, colIndexes, dataToWrite);
    }

    updateProgressBar(totalRows, totalRows, shouldStop ? "⏹️ Proces zatrzymany" : "✅ Gotowe!");
  } catch (err) {
    showError(err.message);
  } finally {
    document.getElementById("processBtn").disabled = false;
    document.getElementById("stopBtn").style.display = "none";
  }
}