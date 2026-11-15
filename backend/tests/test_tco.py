import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.calculator import calculate_single_vehicle_tco
from app.main import app
from app.models import FuelPrice, Vehicle
from app.schemas import RouteRatio

client = TestClient(app)


# 1. Test walidacji sumy tras (musi wynosić 100%)
def test_route_ratio_validation_success():
    ratio = RouteRatio(city=50, suburban=30, highway=20)
    assert ratio.city + ratio.suburban + ratio.highway == 100.0


def test_route_ratio_validation_failure():
    with pytest.raises(ValidationError):
        RouteRatio(city=50, suburban=40, highway=20)  # Suma = 110% -> błąd


# 2. Test matematyczny pojedynczego pojazdu
def test_single_vehicle_tco_math():
    vehicle = Vehicle(
        id=1,
        body_type="SUV",
        budget_bracket_max=100000,
        fuel_type="PETROL",
        model_example="Test SUV",
        base_price=100000,
        cons_city=8.0,
        cons_suburban=6.0,
        cons_highway=7.0,
        annual_service_cost=1000,
        residual_rate_5y=0.50,  # 50% utraty wartości po 5 latach = 50 000 zł
    )
    fuel = FuelPrice(fuel_type="PETROL", price_per_unit=6.00, unit_label="zł/l")

    # 10 000 km rocznie, 50% miasto (8.0), 50% trasa podmiejska (6.0) -> średnia 7.0 l/100km
    result = calculate_single_vehicle_tco(
        vehicle=vehicle,
        fuel_price=fuel,
        annual_km=10000,
        pct_city=50.0,
        pct_suburban=50.0,
        pct_highway=0.0,
        years=5,
    )

    # Sprawdzenie wyników:
    # Ważone spalanie = 7.0 l/100km
    # Paliwo rocznie: 100 * 7.0 * 6.00 zł = 4200 zł -> przez 5 lat = 21 000 zł
    # Serwis przez 5 lat: 5 * 1000 zł = 5 000 zł
    # Deprecjacja: 50 000 zł
    # Suma TCO = 50 000 + 21 000 + 5 000 = 76 000 zł
    assert result["weighted_consumption"] == 7.0
    assert result["breakdown"]["fuel_cost"] == 21000.0
    assert result["breakdown"]["service_cost"] == 5000.0
    assert result["breakdown"]["depreciation_cost"] == 50000.0
    assert result["total_tco"] == 76000.0


# 3. Test integracyjny endpointu POST /api/v1/calculate
def test_api_calculate_ranking():
    payload = {
        "body_type": "SUV",
        "budget_bracket_max": 160000,
        "mileage_bracket": "15-20",
        "route_ratio": {"city": 60, "suburban": 20, "highway": 20},
        "years": 5,
    }
    response = client.post("/api/v1/calculate", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["selected_criteria"]["calculated_annual_km"] == 20000
    assert len(data["ranking"]) > 0
    # Sprawdzenie czy lista jest posortowana rosnąco (1. miejsce = najniższe TCO)
    assert data["ranking"][0]["rank"] == 1
    assert data["ranking"][0]["is_winner"] is True
    assert data["ranking"][0]["total_tco"] <= data["ranking"][-1]["total_tco"]