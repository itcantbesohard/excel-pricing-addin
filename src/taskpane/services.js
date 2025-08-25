import { CONFIG } from './config.js';
export async function loadPricelist() {
  const url = "https://kosztomat-backend-804002774600.europe-west1.run.app/api/pricelist";
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

export async function queryAI(itemData, filteredPricelist) {
  const url = "https://kosztomat-backend-804002774600.europe-west1.run.app/api/ai";

  const headers = {
    "Content-Type": "application/json",
    "x-addin-key": "ztnTMrc8xaqTmcLWbvPDAUj-eRBjqLIyXzTGQZkqhf-KLXpKKBFK-BmLFy0yTVhh",
  };
  const promptUser = `SZUKANA POZYCJA: Opis: "${itemData.opis}", Producent: "${itemData.producent}", Typ: "${itemData.typ}"
CENNIK: ${JSON.stringify(filteredPricelist)}`;

  const body = JSON.stringify({ promptUser, promptSystem: CONFIG.PROMPT_SYSTEM, model: CONFIG.MODEL});

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const resp = await fetch(url, { method: "POST", headers, body, signal: controller.signal });
    clearTimeout(timeout);
    if (!resp.ok) return { komentarz_ai: "Błąd AI API: " + resp.status + resp.statusText };
    const result = await resp.json();
    return {
      cena_materialu: parseFloat(result.cena_materialu),
      cena_robocizny: parseFloat(result.cena_robocizny),
      kod_budzetowy: result.kod_budzetowy,
      komentarz_ai: result.komentarz_ai
    };
  } catch (error) {
    return { komentarz_ai: "Błąd dodatku: " + error.message };
  }
}
