from app.database import Base, SessionLocal, engine
from app.models import FuelPrice, Vehicle

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

db = SessionLocal()

fuels = [
    FuelPrice(fuel_type="PETROL", price_per_unit=6.45, unit_label="zł/l"),
    FuelPrice(fuel_type="DIESEL", price_per_unit=6.55, unit_label="zł/l"),
    FuelPrice(fuel_type="LPG", price_per_unit=2.85, unit_label="zł/l"),
    FuelPrice(fuel_type="HYBRID", price_per_unit=6.45, unit_label="zł/l"),
    FuelPrice(fuel_type="ELECTRIC", price_per_unit=1.15, unit_label="zł/kWh"),
]

for f in fuels:
    db.merge(f)

suv_vehicles = [
    Vehicle(
        body_type="SUV",
        budget_bracket_max=100000,
        fuel_type="PETROL",
        model_example="Dacia Duster 1.2 TCe 130 (Nowy)",
        base_price=94900,
        cons_city=7.6,
        cons_suburban=5.8,
        cons_highway=7.4,
        annual_service_cost=1200,
        residual_rate_5y=0.56,
    ),
    Vehicle(
        body_type="SUV",
        budget_bracket_max=100000,
        fuel_type="LPG",
        model_example="Dacia Duster ECO-G 100 LPG (Nowy)",
        base_price=92900,
        cons_city=9.5,
        cons_suburban=7.3,
        cons_highway=8.9,
        annual_service_cost=1350,
        residual_rate_5y=0.55,
    ),
    Vehicle(
        body_type="SUV",
        budget_bracket_max=120000,
        fuel_type="PETROL",
        model_example="Hyundai Kona 1.0 T-GDI (Nowy)",
        base_price=114000,
        cons_city=7.4,
        cons_suburban=5.5,
        cons_highway=7.1,
        annual_service_cost=1300,
        residual_rate_5y=0.54,
    ),
    Vehicle(
        body_type="SUV",
        budget_bracket_max=140000,
        fuel_type="HYBRID",
        model_example="Toyota Yaris Cross 1.5 Hybrid (Nowy)",
        base_price=128000,
        cons_city=4.4,
        cons_suburban=4.1,
        cons_highway=6.1,
        annual_service_cost=1400,
        residual_rate_5y=0.61,
    ),
    Vehicle(
        body_type="SUV",
        budget_bracket_max=160000,
        fuel_type="DIESEL",
        model_example="Kia Sportage 1.6 CRDi (Nowy)",
        base_price=149000,
        cons_city=6.7,
        cons_suburban=5.0,
        cons_highway=6.3,
        annual_service_cost=1800,
        residual_rate_5y=0.53,
    ),
    Vehicle(
        body_type="SUV",
        budget_bracket_max=160000,
        fuel_type="HYBRID",
        model_example="Toyota Corolla Cross 1.8 Hybrid (Nowy)",
        base_price=154000,
        cons_city=4.8,
        cons_suburban=4.5,
        cons_highway=6.5,
        annual_service_cost=1450,
        residual_rate_5y=0.60,
    ),
    Vehicle(
        body_type="SUV",
        budget_bracket_max=180000,
        fuel_type="ELECTRIC",
        model_example="Volvo EX30 / Kia Niro EV (Nowy)",
        base_price=174000,
        cons_city=14.8,
        cons_suburban=16.2,
        cons_highway=21.5,
        annual_service_cost=850,
        residual_rate_5y=0.48,
    ),
]

for v in suv_vehicles:
    db.add(v)

db.commit()
db.close()
print("Baza driveoptima.db utworzona pomyślnie!")