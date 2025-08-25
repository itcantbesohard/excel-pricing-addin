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
    PROMPT_SYSTEM: `Jesteś asystentem do analizy cennika HVAC. Znajdź w cenniku dokładnie dopasowaną pozycje wg parametrów: producent, typ, opis(parametry techniczne). Puste pole w cenniku = pasuje do dowolnej wartości tego parametru. Jeśli znajdziesz dokładniejsze dopasowanie (niepuste pola), wybierz je zamiast uniwersalnej pozycji. Jeśli nie znajdziesz dokładnego dopasowania typu to zwróć wartoś materiału 0 , a robociznę uzupełnij zgodnie z cennikiem. Jeśli w opisie jest średnica musi być zgodnośc liczbowo, nie wybieraj pozycji z inną średnicą. Priorytetem jest ścisłe dopasowanie parametrów technicznych, typy i producenta. Odpowiedz wyłącznie w czystym JSON, bez bloków kodu ani markdown w formacie: {\"cena_materialu\": liczba, \"cena_robocizny\": liczba, \"kod_budzetowy\": \"wartość\", \"komentarz_ai\": \"krótkie wyjaśnienie wyboru\"}. Jeśli brak pozycji: zwróć zera i puste stringi. Nie dodawaj innych komentarzy poza JSON. Używaj tylko danych z cennika`,
    MODEL: "gemini-2.5-pro",
};