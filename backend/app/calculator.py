from typing import Dict, List
from .models import FuelPrice, Vehicle
from .schemas import CalculationRequest

MILEAGE_MAP = {
    "<5": 5000,
    "5-10": 10000,
    "10-15": 15000,
    "15-20": 20000,
    "20-25": 25000,
    ">25": 30000,
}


def calculate_single_vehicle_tco(
    vehicle: Vehicle,
    fuel_price: FuelPrice,
    annual_km: int,
    pct_city: float,
    pct_suburban: float,
    pct_highway: float,
    years: int,
) -> Dict:
    # 1. Średnie ważone spalanie / zużycie energii
    weighted_consumption = (
        (pct_city / 100.0) * vehicle.cons_city
        + (pct_suburban / 100.0) * vehicle.cons_suburban
        + (pct_highway / 100.0) * vehicle.cons_highway
    )

    # 2. Koszt paliwa / energii w okresie T lat
    annual_units = (annual_km / 100.0) * weighted_consumption
    total_fuel_cost = annual_units * fuel_price.price_per_unit * years

    # 3. Koszt serwisu w okresie T lat
    total_service_cost = vehicle.annual_service_cost * years

    # 4. Utrata wartości (Deprecjacja)
    # Skalujemy spadek wartości proporcjonalnie względem 5-letniej bazy
    depreciation_5y = vehicle.base_price * (1.0 - vehicle.residual_rate_5y)
    total_depreciation = min(vehicle.base_price * 0.90, depreciation_5y * (years / 5.0))

    # 5. Całkowity TCO
    total_tco = total_depreciation + total_fuel_cost + total_service_cost
    monthly_cost = total_tco / (years * 12)

    return {
        "vehicle_id": vehicle.id,
        "model_example": vehicle.model_example,
        "fuel_type": vehicle.fuel_type,
        "base_price": vehicle.base_price,
        "weighted_consumption": round(weighted_consumption, 2),
        "unit_label": fuel_price.unit_label,
        "breakdown": {
            "depreciation_cost": round(total_depreciation, 2),
            "fuel_cost": round(total_fuel_cost, 2),
            "service_cost": round(total_service_cost, 2),
        },
        "total_tco": round(total_tco, 2),
        "monthly_cost": round(monthly_cost, 2),
    }


def rank_vehicles(
    vehicles: List[Vehicle],
    fuel_prices_map: Dict[str, FuelPrice],
    request: CalculationRequest,
) -> List[Dict]:
    annual_km = MILEAGE_MAP[request.mileage_bracket]
    results = []

    for vehicle in vehicles:
        fuel_obj = fuel_prices_map.get(vehicle.fuel_type)
        if not fuel_obj:
            continue

        item = calculate_single_vehicle_tco(
            vehicle=vehicle,
            fuel_price=fuel_obj,
            annual_km=annual_km,
            pct_city=request.route_ratio.city,
            pct_suburban=request.route_ratio.suburban,
            pct_highway=request.route_ratio.highway,
            years=request.years,
        )
        results.append(item)

    # Sortowanie rosnąco po total_tco
    results.sort(key=lambda x: x["total_tco"])

    # Przypisanie miejsc w rankingu
    for idx, item in enumerate(results, start=1):
        item["rank"] = idx
        item["is_winner"] = idx == 1

    return results