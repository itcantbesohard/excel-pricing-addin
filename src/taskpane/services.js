import { CONFIG } from './config.js';

export async function loadPricelist(pricelistName) {
  const url = `${CONFIG.API_BASE_URL}/api/pricelist/${pricelistName}`;
  const headers = {
    "Content-Type": "application/json",
    "x-addin-key": "ztnTMrc8xaqTmcLWbvPDAUj-eRBjqLIyXzTGQZkqhf-KLXpKKBFK-BmLFy0yTVhh",
  };
  try {
    const response = await fetch(url, { method: "GET", headers });
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching pricelist:", error);
    return [];
  }
}

export function filterPriceList(pricelist, assortmentFilter, categoryInstallations) {
  let filtered = pricelist;

  if (assortmentFilter) {
    filtered = filtered.filter(item =>
      String(item["Filtr asortymentu"] ?? "").toLowerCase().trim() === String(assortmentFilter).toLowerCase().trim()
    );
  }
  if (categoryInstallations && categoryInstallations.trim() !== "") {
    const categories = categoryInstallations.toLowerCase().split(/[.,;\s]+/).map(c => c.trim()).filter(Boolean);
    const hasNonEmptyCategory = filtered.some(item => item["Kategorie instalacji"] && String(item["Kategorie instalacji"]).trim() !== "");
    if (hasNonEmptyCategory) {
      filtered = filtered.filter(item => {
        const itemCategories = String(item["Kategorie instalacji"] ?? "").toLowerCase().split(/[.,;\s]+/).map(c => c.trim()).filter(Boolean);
        return categories.some(cat => itemCategories.includes(cat));
      });
    }
  }
  return filtered;
}

export function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export async function queryAI(itemData, filteredPricelist, retries = 3, delay = 1000) {
  const url = `${CONFIG.API_BASE_URL}/api/ai`;

  const headers = {
    "Content-Type": "application/json",
    "x-addin-key": "ztnTMrc8xaqTmcLWbvPDAUj-eRBjqLIyXzTGQZkqhf-KLXpKKBFK-BmLFy0yTVhh",
  };
  const promptUser = `SZUKANA POZYCJA: Opis: "${itemData.opis}", Producent: "${itemData.producent}", Typ: "${itemData.typ}"
CENNIK: ${JSON.stringify(filteredPricelist)}`;

  let promptSystem;
  if (itemData.kategorie_instalacji.toLowerCase().trim() == "wnt") {
    promptSystem = CONFIG.PROMPT_SYSTEM_WNT;
  } else {
    promptSystem = CONFIG.PROMPT_SYSTEM;
  }

  const body = JSON.stringify({ promptUser: promptUser, promptSystem: promptSystem, model: CONFIG.MODEL });

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const resp = await fetch(url, { method: "POST", headers, body, signal: controller.signal });
      clearTimeout(timeout);
      if (!resp.ok) {
        if (attempt < retries && (resp.status === 429 || resp.status === 503)){
        await new Promise(r => setTimeout(r, delay*attempt));
        continue;
        }
      return { komentarz_ai: "Błąd AI API: " + resp.status + resp.statusText };
      }
      const result = await resp.json();
      return {
        cena_materialu: parseFloat(result.cena_materialu),
        cena_robocizny: parseFloat(result.cena_robocizny),
        kod_budzetowy: result.kod_budzetowy,
        komentarz_ai: result.komentarz_ai
      };
    } catch (error) {
      if(attempt < retries) await new Promise(r => setTimeout(r, delay*attempt));
      else return { komentarz_ai: "Błąd dodatku: " + error.message };
    }
  }
}
