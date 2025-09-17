export const CONFIG = {
    COLUMN_NAMES: {
        kategorie_instalacji: ["Kategorie instalacji", "INST"],
        filtr_asortymentu: ["Filtr asortymentu", "Asortyment"],
        opis: ["Opis", "Description"],
        producent: ["Producent", "Manufacturer"],
        typ: ["Typ", "Type"],
        jednostka_miary: ["JM", "Jednostka miary", "J.M."],
        kod_budzetowy: ["Kod budżetowy", "Kody budżetowe", "Budżet"],
        cena_materialu: ["Cena jednostkowa Materiał Koszty [PLN]", "Cena jednostkowa Materiał KOSZTY ", "Cena jednostkowa Materiał KOSZTY\n[PLN]", "Cena materiału"],
        cena_robocizny: ["Cena jednostkowa Robocizna Koszty [PLN]", "Cena jednostkowa Robocizna [PLN]", "Cena jednostkowa Robocizna KOSZTY\n[PLN]", "Cena robocizny"],
        komentarz_ai: ["Komentarz AI"]
    },
    REQUIRED_COLUMNS: ["kategorie_instalacji", "filtr_asortymentu", "opis", "producent", "typ", "jednostka_miary"],
    OUTPUT_COLUMNS: ["kod_budzetowy", "cena_materialu", "cena_robocizny"],
    PROMPT_SYSTEM: "Jesteś asystentem do analizy cennika HVAC. Znajdź w cenniku dokładnie dopasowaną pozycję wg parametrów: filtr asortymentu (najważniejszy), typ, producent, opis (parametry techniczne). Puste pole w cenniku = pasuje do dowolnej wartości tego parametru. Jeśli znajdziesz dokładniejsze dopasowanie (niepuste pola), wybierz je zamiast uniwersalnej pozycji. Jeśli nie znajdziesz dokładnego dopasowania typu, zwróć wartość materiału 0, a robociznę uzupełnij zgodnie z cennikiem. Robocizna zależy tylko od typu i parametrów technicznych – wpisz ją bez względu na producenta. Jeśli w opisie występuje średnica (DN, mm, cale), wyłuskaj ją i dopasuj liczbowo do pozycji w cenniku – nie wybieraj pozycji z inną średnicą. Ignoruj podaną grubość izolacji, nie traktuj jej jako parametu dopasowania. Zwracaj wyłącznie cenę jednostkową z cennika – nie przeliczaj jej na podstawie długości, ilości ani innych jednostek z opisu. Priorytetem jest dopasowanie filtru asortymentu, a następnie typu, producenta i parametrów technicznych. Odpowiedz wyłącznie w czystym JSON: {\"cena_materialu\": liczba, \"cena_robocizny\": liczba, \"kod_budzetowy\": \"wartość\", \"komentarz_ai\": \"krótkie wyjaśnienie wyboru\"}. Jeśli brak pozycji: zwróć zera i puste stringi. Nie dodawaj innych komentarzy poza JSON. Używaj tylko danych z cennika.",
    PROMPT_SYSTEM_WNT: "Jesteś asystentem dopasowania do cennika HVAC. Znajdź w cenniku dokładnie dopasowaną pozycję wg parametrów: filtr asortymentu, typ, producent, parametry z opisu. Zasady: Materiał: tylko gdy Typ dopasowany (nie przeliczaj ilości). Robocizna: wg Filtru i parametrów (Producent bez znaczenia). Wyciągaj wymiary: średnica (DN, fi, Ø, mm, cale→mm), prostokąt (a,b lub AxB). Obwód=2(a+b), okr=πD. Jeśli brak Typu w cenniku → robocizna wg zakresu obwodu/średnicy. Reguły: - Nawiewnik szczelinowy: robocizna = długość_mb*160 (min 1 mb). Klapa ppoż okr: robocizna = cennik +250; jeśli bateria X → *X. Klapa ppoż prost: robocizna = cennik + obwód_mb*250; bateria X → *X. Tłumik prost: robocizna = max(195, 52*powierzchnia_m2). Wentylator kanałowy: brak Typu → wg obwodu/średnicy. Pozostałe: robocizna wg obwodu/średnicy. Zwracaj wyłącznie cenę jednostkową z cennika – nie przeliczaj jej na podstawie ilości. Używaj tylko danych z cennika. Odpowiedz wyłącznie w czystym JSON: {\"cena_materialu\": liczba, \"cena_robocizny\": liczba, \"kod_budzetowy\": \"wartość\", \"komentarz_ai\": \"krótkie wyjaśnienie wyboru\"}. Jeśli brak pozycji: zwróć zera i puste stringi. ",
    MODEL: "gemini-2.5-pro",
    API_BASE_URL: "PASTE-YOUR-URL-HERE",
};