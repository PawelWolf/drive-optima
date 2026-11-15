import React, { useState, useEffect } from 'react';
import { Car, Fuel, Award, Calculator, AlertCircle, Sliders, TrendingDown, Wrench } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const FUEL_LABELS = {
  PETROL: { name: 'Benzyna (PB)', badge: 'bg-amber-100 text-amber-800' },
  DIESEL: { name: 'Diesel (ON)', badge: 'bg-slate-200 text-slate-800' },
  LPG: { name: 'Autogaz (LPG)', badge: 'bg-sky-100 text-sky-800' },
  HYBRID: { name: 'Hybryda (HEV)', badge: 'bg-emerald-100 text-emerald-800' },
  ELECTRIC: { name: 'Elektryczny (BEV)', badge: 'bg-indigo-100 text-indigo-800' },
};

export default function App() {
  const [budget, setBudget] = useState(140000);
  const [mileageBracket, setMileageBracket] = useState('15-20');
  const [years, setYears] = useState(5);

  const [cityPct, setCityPct] = useState(50);
  const [suburbanPct, setSuburbanPct] = useState(30);
  const [highwayPct, setHighwayPct] = useState(20);

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalPct = cityPct + suburbanPct + highwayPct;
  const isRouteValid = totalPct === 100;

  const fetchCalculation = async () => {
    if (!isRouteValid) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body_type: 'SUV',
          budget_bracket_max: Number(budget),
          mileage_bracket: mileageBracket,
          route_ratio: {
            city: Number(cityPct),
            suburban: Number(suburbanPct),
            highway: Number(highwayPct),
          },
          years: Number(years),
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Błąd komunikacji z serwerem API');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isRouteValid) {
      fetchCalculation();
    }
  }, [budget, mileageBracket, years, cityPct, suburbanPct, highwayPct]);

  const formatPLN = (val) =>
    new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(val);

  const winner = results?.ranking?.[0];

  const chartData =
    results?.ranking?.map((item) => ({
      name: item.model_example.split(' (')[0],
      'Utrata wartości': Math.round(item.breakdown.depreciation_cost),
      'Paliwo / Energia': Math.round(item.breakdown.fuel_cost),
      Serwis: Math.round(item.breakdown.service_cost),
    })) || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-lg text-slate-950">
              <Car className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">DriveOptima</h1>
              <p className="text-xs text-slate-400">
                Kalkulator Całkowitego Kosztu Posiadania (TCO) • Segment: Nowe SUV-y
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-xs bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full text-slate-300">
            Inżynieria Oprogramowania • MVP v1.0
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sliders className="w-5 h-5 text-emerald-600" />
              <h2 className="font-semibold text-lg">Parametry symulacji</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Maksymalny budżet zakupu auta
              </label>
              <select
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-medium focus:border-emerald-500 focus:outline-none"
              >
                <option value={100000}>do 100 000 PLN</option>
                <option value={120000}>do 120 000 PLN</option>
                <option value={140000}>do 140 000 PLN</option>
                <option value={160000}>do 160 000 PLN</option>
                <option value={180000}>do 180 000 PLN</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Roczny przebieg (przedział)
              </label>
              <select
                value={mileageBracket}
                onChange={(e) => setMileageBracket(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-medium focus:border-emerald-500 focus:outline-none"
              >
                <option value="<5">poniżej 5 000 km (liczone jako 5 tys.)</option>
                <option value="5-10">5 000 – 10 000 km (liczone jako 10 tys.)</option>
                <option value="10-15">10 000 – 15 000 km (liczone jako 15 tys.)</option>
                <option value="15-20">15 000 – 20 000 km (liczone jako 20 tys.)</option>
                <option value="20-25">20 000 – 25 000 km (liczone jako 25 tys.)</option>
                <option value=">25">powyżej 25 000 km (liczone jako 30 tys.)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-sm font-medium mb-1">
                <span className="text-slate-700">Okres posiadania (min. 5 lat)</span>
                <span className="text-emerald-700 font-bold">{years} lat</span>
              </div>
              <input
                type="range"
                min="5"
                max="10"
                step="1"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>5 lat</span>
                <span>7 lat</span>
                <span>10 lat</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Profil tras kierowcy</span>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    isRouteValid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  Suma: {totalPct}%
                </span>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">Miasto</span>
                  <span className="font-semibold">{cityPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={cityPct}
                  onChange={(e) => setCityPct(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">Drogi podmiejskie</span>
                  <span className="font-semibold">{suburbanPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={suburbanPct}
                  onChange={(e) => setSuburbanPct(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">Autostrada (120 km/h)</span>
                  <span className="font-semibold">{highwayPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={highwayPct}
                  onChange={(e) => setHighwayPct(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              {!isRouteValid && (
                <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Suma udziałów tras musi wynosić dokładnie 100%, aby przeliczyć wyniki.</span>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="lg:col-span-8 space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-sm">
              <strong>Błąd:</strong> {error} (Upewnij się, że backend FastAPI działa na porcie 8000).
            </div>
          )}

          {winner && isRouteValid && (
            <>
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 rounded-2xl shadow-lg">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-semibold mb-3">
                      <Award className="w-4 h-4" />
                      NAJBARDZIEJ OPŁACALNY WYBÓR W OKRESIE {years} LAT
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold">{winner.model_example}</h2>
                    <p className="text-emerald-100 text-sm mt-1">
                      Napęd: <strong>{FUEL_LABELS[winner.fuel_type]?.name || winner.fuel_type}</strong> • Cena
                      katalogowa: <strong>{formatPLN(winner.base_price)}</strong>
                    </p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl text-right">
                    <div className="text-xs text-emerald-100 uppercase tracking-wider">Całkowity koszt (TCO)</div>
                    <div className="text-3xl font-extrabold">{formatPLN(winner.total_tco)}</div>
                    <div className="text-xs text-emerald-200 mt-0.5">
                      ok. <strong>{formatPLN(winner.monthly_cost)}</strong> / mies.
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/15 text-sm">
                  <div className="bg-white/10 p-3 rounded-xl flex items-center gap-3">
                    <TrendingDown className="w-5 h-5 text-emerald-200" />
                    <div>
                      <div className="text-xs text-emerald-100">Utrata wartości</div>
                      <div className="font-bold">{formatPLN(winner.breakdown.depreciation_cost)}</div>
                    </div>
                  </div>
                  <div className="bg-white/10 p-3 rounded-xl flex items-center gap-3">
                    <Fuel className="w-5 h-5 text-emerald-200" />
                    <div>
                      <div className="text-xs text-emerald-100">
                        Paliwo / Energia ({winner.weighted_consumption} {winner.unit_label.replace('zł/', '')}/100km)
                      </div>
                      <div className="font-bold">{formatPLN(winner.breakdown.fuel_cost)}</div>
                    </div>
                  </div>
                  <div className="bg-white/10 p-3 rounded-xl flex items-center gap-3">
                    <Wrench className="w-5 h-5 text-emerald-200" />
                    <div>
                      <div className="text-xs text-emerald-100">Serwis ({years} lat)</div>
                      <div className="font-bold">{formatPLN(winner.breakdown.service_cost)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-semibold text-lg">Struktura całkowitych kosztów posiadania (PLN)</h3>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value) => formatPLN(value)} />
                      <Legend />
                      <Bar dataKey="Utrata wartości" stackId="a" fill="#64748b" />
                      <Bar dataKey="Paliwo / Energia" stackId="a" fill="#10b981" />
                      <Bar dataKey="Serwis" stackId="a" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="font-semibold text-lg">Pełny ranking modeli w budżecie do {formatPLN(budget)}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">Model i napęd</th>
                        <th className="py-3 px-4">Cena zakupu</th>
                        <th className="py-3 px-4">Śr. zużycie</th>
                        <th className="py-3 px-4">Koszt mies.</th>
                        <th className="py-3 px-4 text-right">Suma TCO ({years} lat)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {results.ranking.map((car) => (
                        <tr key={car.vehicle_id} className={car.is_winner ? 'bg-emerald-50/60 font-medium' : ''}>
                          <td className="py-3.5 px-4 font-bold">{car.rank}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">{car.model_example}</div>
                            <span
                              className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-md font-medium ${
                                FUEL_LABELS[car.fuel_type]?.badge || 'bg-slate-100'
                              }`}
                            >
                              {FUEL_LABELS[car.fuel_type]?.name || car.fuel_type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">{formatPLN(car.base_price)}</td>
                          <td className="py-3.5 px-4">
                            {car.weighted_consumption} {car.unit_label.replace('zł/', '')}/100km
                          </td>
                          <td className="py-3.5 px-4">{formatPLN(car.monthly_cost)}</td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                            {formatPLN(car.total_tco)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}