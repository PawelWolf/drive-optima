# DriveOptima 🚗⚡

> **System analityczny do optymalizacji i wielokryterialnego porównywania całkowitych kosztów posiadania pojazdów (TCO – Total Cost of Ownership).**

Projekt realizowany w ramach przedmiotu **Inżynieria Oprogramowania**.

---

## 📌 1. Opis i cel projektu

W dobie transformacji energetycznej w motoryzacji wybór optymalnego źródła napędu (Benzyna, Diesel, LPG, Pełna Hybryda/HEV, Samochód Elektryczny/BEV) stał się złożonym problemem decyzyjnym. Standardowe dane katalogowe (WLTP) rzadko odzwierciedlają rzeczywiste wydatki, a zmienność cen paliw i taryf energii dodatkowo utrudnia oszacowanie długoterminowej opłacalności.

**DriveOptima** to interaktywny kalkulator i silnik analityczny, który na podstawie:
- zadanego budżetu zakupu,
- preferowanego typu nadwozia,
- profilu eksploatacji kierowcy (roczny przebieg oraz procentowy podział: miasto / podmiejskie / autostrada),
- założonego horyzontu czasowego (np. 5 lat)

generuje **ranking opłacalności napędów w zadanym punkcie czasu**. System symuluje całkowity koszt eksploatacji (utrata wartości pojazdu, paliwo/energia, serwis) i jednoznacznie wskazuje, który samochód w perspektywie całego okresu okaże się najtańszy dla portfela użytkownika.

---

## 👥 2. Profil użytkownika i parametry wejściowe

Aplikacja eliminuje konieczność wprowadzania dziesiątek technicznych parametrów – operuje na ustandaryzowanych, rynkowych przedziałach:

| Parametr wejściowy | Zakres / Format w UI | Zastosowanie w logice biznesowej |
| :--- | :--- | :--- |
| **Typ nadwozia** | `Hatchback`, `Sedan`, `Kombi`, `SUV` | Filtr segmentu w bazie aut |
| **Budżet zakupu** | Przedziały co 20 000 PLN (od 80k do 180k+ PLN) | Górny próg kwoty zakupu pojazdu |
| **Przebieg roczny** | Progi co 5 000 km: `<5k`, `5-10k`, `10-15k`, `15-20k`, `20-25k`, `>25k` | System przyjmuje górną granicę przedziału (np. dla `10-15k` przyjmuje $15\,000\text{ km}$) |
| **Profil tras** | 3 suwaki sumujące się do $100\%$:<br>• Miasto<br>• Trasy podmiejskie<br>• Autostrada (prędkość przelotowa 120 km/h) | Wagi do wyliczenia ważonego realnego zużycia paliwa/energii |
| **Horyzont analizy** | Suwak / pole liczbowe: minimum 5 lat ($T \ge 5$) | Okres amortyzacji i sumowania kosztów eksploatacji |

---

## 📐 3. Matematyczny model obliczeniowy (Logika Biznesowa)

Całkowity koszt posiadania pojazdu (**TCO**) w zadanym punkcie czasu $T$ (w latach) kalkulowany jest niezależnie dla każdego dopasowanego samochodu według wzoru:

$$\text{TCO}(T) = \text{Utrata Wartości}(T) + \text{Koszty Paliwa}(T) + \text{Koszty Serwisu}(T)$$

Algorytm sortuje otrzymane wyniki rosnąco według wartości $\text{TCO}(T)$ – pojazd z najniższym wynikiem otrzymuje 1. miejsce w rankingu opłacalności.

### A. Utrata wartości pojazdu (Amortyzacja)
Dla zadanego okresu $T$ lat szacowana jest wartość odsprzedaży na podstawie wskaźnika wartości rezydualnej $\text{RV}$ (Residual Value):
$$\text{Wartość Odsprzedaży} = \text{Cena Zakupu} \times \text{RV}$$
$$\text{Utrata Wartości} = \text{Cena Zakupu} - \text{Wartość Odsprzedaży}$$

### B. Ważone zużycie paliwa / energii
Dla każdego wariantu napędowego wyliczane jest jednostkowe zużycie na $100\text{ km}$ dopasowane do profilu tras kierowcy:
$$C_{\text{avg}} = (w_{\text{city}} \times C_{\text{city}}) + (w_{\text{suburban}} \times C_{\text{suburban}}) + (w_{\text{highway}} \times C_{\text{highway}})$$
*(gdzie $w_{\text{city}} + w_{\text{suburban}} + w_{\text{highway}} = 1.0$)*

### C. Koszt paliwa / energii w całym okresie
Roczny wolumen paliwa/energii:
$$V_{\text{annual}} = \frac{\text{Roczny Przebieg [km]}}{100} \times C_{\text{avg}}$$
Sumaryczny koszt paliwa po $T$ latach:
$$\text{Koszty Paliwa}(T) = V_{\text{annual}} \times P_{\text{unit}} \times T$$
*(gdzie $P_{\text{unit}}$ to cena 1 litra paliwa lub 1 kWh energii elektrycznej)*

### D. Koszty serwisowe
$$\text{Koszty Serwisu}(T) = \text{Roczny Koszt Serwisu} \times T$$

### E. Średni miesięczny koszt eksploatacji
$$\text{Koszt Miesięczny} = \frac{\text{TCO}(T)}{T \times 12}$$

---

## 🗄️ 4. Projekt bazy danych

Projekt wykorzystuje relacyjną bazę danych SQLite z dwiema podstawowymi tabelami:

```text
+-------------------------------------------------------------------+
|                             vehicles                              |
+-------------------------------------------------------------------+
| id                  : INTEGER PRIMARY KEY AUTOINCREMENT           |
| body_type           : VARCHAR(30)   -- 'SUV', 'Kombi', 'Sedan'    |
| budget_bracket_max  : INTEGER       -- np. 120000, 140000         |
| fuel_type           : VARCHAR(20)   -- 'PETROL','DIESEL','LPG',   |
|                     :                  'HYBRID','ELECTRIC'        |
| model_example       : VARCHAR(100)  -- np. 'Toyota Corolla Hybrid'|
| base_price          : INTEGER       -- cena bazowa brutto (PLN)   |
| cons_city           : REAL          -- zużycie w mieście          |
| cons_suburban       : REAL          -- zużycie poza miastem       |
| cons_highway        : REAL          -- zużycie na autostradzie    |
| annual_service_cost : INTEGER       -- szacowany roczny serwis    |
| residual_rate_5y    : REAL          -- wskaźnik wartości po 5 l.  |
+-------------------------------------------------------------------+
                                  |
                                  | fuel_type
                                  v
+-------------------------------------------------------------------+
|                           fuel_prices                             |
+-------------------------------------------------------------------+
| fuel_type           : VARCHAR(20) PRIMARY KEY                     |
| price_per_unit      : REAL          -- cena PLN za litr lub kWh   |
| unit_label          : VARCHAR(10)   -- 'zł/l' lub 'zł/kWh'        |
| last_updated        : TIMESTAMP     -- data aktualizacji          |
+-------------------------------------------------------------------+
```

---

## 🛠️ 5. Architektura i stos technologiczny

System zaprojektowano w architekturze klient–serwer z separacją warstwy prezentacji, logiki biznesowej i danych:

```text
[ Frontend: React + Tailwind + Vite ]
                 |
             REST API (JSON)
                 v
[ Backend: Python + FastAPI + Pydantic ]
                 |
      [ Silnik Obliczeniowy TCO ]
                 |
       ORM (SQLAlchemy 2.0)
                 v
      [ Baza Danych: SQLite ]
```

* **Frontend:**
  * **React 18** (zbudowany przez **Vite**) – dynamiczny interfejs użytkownika.
  * **Tailwind CSS** – nowoczesny interfejs z responsywnymi suwakami i kartami.
  * **Recharts** – wizualizacja trajektorii kosztów w czasie (wykresy słupkowe z rozbiciem kosztów).
* **Backend:**
  * **Python 3.11+**
  * **FastAPI** – asynchroniczne, wydajne REST API z automatyczną dokumentacją OpenAPI (Swagger).
  * **Pydantic** – ścisła walidacja danych wejściowych i wyjściowych.
  * **SQLAlchemy** – mapowanie obiektowo-relacyjne (ORM).
* **Baza danych:**
  * **SQLite** – lekka, bezserwerowa baza danych relacyjnych, przechowywana w pliku projektu.
* **Jakość i testy:**
  * **pytest** – testy jednostkowe logiki matematycznej i testy integracyjne API.

---

## 🔌 6. Specyfikacja API (Kontrakt REST)

### `POST /api/v1/calculate`
Przelicza TCO dla wszystkich pojazdów pasujących do kryteriów użytkownika i zwraca uszeregowany ranking opłacalności.

#### Przykładowy Payload żądania (Request):
```json
{
  "body_type": "SUV",
  "budget_bracket_max": 140000,
  "mileage_bracket": "15-20",
  "route_ratio": {
    "city": 50,
    "suburban": 30,
    "highway": 20
  },
  "years": 5
}
```

#### Przykładowa Odpowiedź (Response):
```json
{
  "selected_criteria": {
    "body_type": "SUV",
    "calculated_annual_km": 15000,
    "years": 5
  },
  "ranking": [
    {
      "rank": 1,
      "is_winner": true,
      "model_example": "Toyota Yaris Cross 1.5 Hybrid",
      "fuel_type": "HYBRID",
      "base_price": 125000,
      "breakdown": {
        "depreciation_cost": 50000.0,
        "fuel_cost": 23156.25,
        "service_cost": 7000.0
      },
      "total_tco": 80156.25,
      "monthly_cost": 1335.94
    },
    {
      "rank": 2,
      "is_winner": false,
      "model_example": "Dacia Duster ECO-G 100",
      "fuel_type": "LPG",
      "base_price": 98000,
      "breakdown": {
        "depreciation_cost": 45080.0,
        "fuel_cost": 30232.5,
        "service_cost": 6750.0
      },
      "total_tco": 82062.5,
      "monthly_cost": 1367.71
    }
  ]
}
```

---

## 📁 7. Wstępna struktura katalogów w repozytorium

```text
drive-optima/
├── README.md                  # Dokumentacja główna projektu
├── LICENSE                    # Licencja MIT
├── .gitignore                 # Wykluczenia z systemu kontroli wersji
├── backend/                   # Warstwa serwerowa
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # Konfiguracja FastAPI i trasy API
│   │   ├── database.py        # Konfiguracja połączenia z bazą SQLite
│   │   ├── models.py          # Modele relacyjne (SQLAlchemy)
│   │   ├── schemas.py         # Schematy walidacji danych (Pydantic)
│   │   └── calculator.py      # Silnik obliczeniowy logiki TCO
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_calculator.py # Testy jednostkowe algorytmu TCO
│   │   └── test_api.py        # Testy integracyjne endpointów
│   ├── init_db.py             # Skrypt seedujący bazę danymi początkowymi
│   ├── requirements.txt       # Zależności środowiska Python
│   └── autotco.db             # Plik bazy SQLite (ignorowany przez git)
└── frontend/                  # Aplikacja kliencka
    ├── package.json           # Zależności Node.js
    ├── vite.config.js         # Konfiguracja narzędzia Vite
    ├── index.html             # Główny szablon HTML
    └── src/
        ├── components/
        │   ├── Form.jsx       # Formularz z suwakami i filtrami
        │   ├── ResultCard.jsx # Karta zwycięskiego wariantu napędu
        │   └── Chart.jsx      # Wykres skumulowanego kosztu (Recharts)
        ├── App.jsx            # Główny widok aplikacji
        └── main.jsx           # Punkt wejścia aplikacji React
```

---

## 📄 8. Licencja i Prawa Autorskie

Copyright (c) 2026 Paweł Wolf. Wszelkie prawa zastrzeżone.

Projekt udostępniany na warunkach licencji **MIT**. Szczegółowe informacje znajdują się w pliku [LICENSE](LICENSE).

> **Zastrzeżenie (Disclaimer):**  
> Aplikacja ma charakter edukacyjno-analityczny i powstała w ramach przedmiotu *Inżynieria Oprogramowania*. Wszelkie obliczenia kosztów TCO, zużycia energii oraz prognozy utraty wartości stanowią estymację symulacyjną i nie powinny być traktowane jako wiążące rekomendacje finansowe lub oferty handlowe w rozumieniu Kodeksu Cywilnego.