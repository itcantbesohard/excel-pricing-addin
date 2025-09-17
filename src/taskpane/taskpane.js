import { updateProgressBar, showProgress, showError, clearError } from './ui.js';
import { getSheetDataWithHeaders, writetoExcel, findColumnIndexes } from './excel.js';
import { loadPricelist, filterPriceList, queryAI, chunkArray } from './services.js';
import { CONFIG } from './config.js';

let shouldStop = false;
const CHUNK_SIZE = 50;

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

    showProgress("Ładuję cenniki...");
    const cennik = await loadPricelist("Cennik");
    const cennikWNT = await loadPricelist("CennikWNT");
    if (!cennik || cennik.length === 0) throw new Error("Cennik jest pusty lub nie został poprawnie załadowany.");
    if (!cennikWNT || cennikWNT.length === 0) throw new Error("CennikWNT jest pusty lub nie został poprawnie załadowany.");

    showProgress("Pobieram dane z Excela...");
    const { headers, dataRows } = await getSheetDataWithHeaders();
    const colIndexes = findColumnIndexes(headers);
    if (!dataRows || dataRows.length === 0) throw new Error("Plik wyceny jest pusty lub nie został poprawnie załadowany.");

    const filteredRows = dataRows.filter(row => {
      return row.some(cell => String(cell).trim() !== "");
    });

    const required = CONFIG.REQUIRED_COLUMNS;
    const outputs = CONFIG.OUTPUT_COLUMNS;
    for (const key of required) if (colIndexes[key] === undefined) throw new Error("Brak kolumny źródłowej: " + key);
    for (const key of outputs) if (colIndexes[key] === undefined) throw new Error("Brak kolumny wynikowej: " + key);

    const totalRows = filteredRows.length;
    const chunks = chunkArray(filteredRows, CHUNK_SIZE);

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      if (shouldStop) break;
      const currentChunk = chunks[chunkIndex];
      const startRow = chunkIndex * CHUNK_SIZE + 3;
      const endRow = startRow + currentChunk.length - 1;
      updateProgressBar(startRow - 2, totalRows, `Paczka ${chunkIndex + 1} z ${chunks.length} — wiersze ${startRow}–${endRow}`);

      const results = await Promise.all(currentChunk.map(async (row, i) => {
        const globalIndex = chunkIndex * CHUNK_SIZE + i;
        if (!row[colIndexes.filtr_asortymentu] || String(row[colIndexes.filtr_asortymentu]).trim() === "") return null;

        const currentKod = row[colIndexes.kod_budzetowy];
        const currentCenaMaterialu = row[colIndexes.cena_materialu];
        const currentCenaRobocizny = row[colIndexes.cena_robocizny];
        const needsKod = !currentKod || String(currentKod).trim() === "";
        const needsMaterial = !currentCenaMaterialu;
        const needsRobocizna = !currentCenaRobocizny;

        if (!needsMaterial && !needsRobocizna) return null;

        const item = {
          kategorie_instalacji: row[colIndexes.kategorie_instalacji],
          filtr_asortymentu: row[colIndexes.filtr_asortymentu],
          opis: row[colIndexes.opis],
          producent: row[colIndexes.producent],
          typ: row[colIndexes.typ],
          jednostka_miary: row[colIndexes.jednostka_miary]
        };

        const filteredCennik = item.kategorie_instalacji.toLowerCase().trim() === "wnt"
          ? filterPriceList(cennikWNT, item.filtr_asortymentu, item.kategorie_instalacji)
          : filterPriceList(cennik, item.filtr_asortymentu, item.kategorie_instalacji);

        if (filteredCennik.length === 0) {
          return { globalIndex, dataToWrite: { komentarz_ai: "Nie wysłano do AI - Brak pozycji w cenniku" } };
        }

        const aiRes = await queryAI(item, filteredCennik);
        const dataToWrite = {};
        if (needsKod && aiRes.kod_budzetowy?.trim()) dataToWrite.kod_budzetowy = aiRes.kod_budzetowy;
        if (needsMaterial && aiRes.cena_materialu && Number(aiRes.cena_materialu) > 0) dataToWrite.cena_materialu = aiRes.cena_materialu;
        if (needsRobocizna && aiRes.cena_robocizny && Number(aiRes.cena_robocizny) > 0) dataToWrite.cena_robocizny = aiRes.cena_robocizny;
        if (aiRes.komentarz_ai?.trim()) dataToWrite.komentarz_ai = aiRes.komentarz_ai;

        return { globalIndex, dataToWrite };
      }));

      for (const result of results) {
        if (!result) continue;
        const { globalIndex, dataToWrite } = result;
        await writetoExcel(globalIndex + 2, colIndexes, dataToWrite);
        updateProgressBar(globalIndex + 1, totalRows, `Wiersz ${globalIndex + 2} z ${totalRows}...`);
      }
    }

    updateProgressBar(totalRows, totalRows, shouldStop ? "⏹️ Proces zatrzymany" : "✅ Gotowe!");
  } catch (err) {
    showError(err.message);
  } finally {
    document.getElementById("processBtn").disabled = false;
    document.getElementById("stopBtn").style.display = "none";
  }
}
