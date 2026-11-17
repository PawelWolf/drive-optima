from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .calculator import MILEAGE_MAP, rank_vehicles
from .database import get_db
from .models import FuelPrice, Vehicle
from .schemas import CalculationRequest, CalculationResponse, SelectedCriteria
from .database import Base, engine
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DriveOptima API",
    description="Silnik obliczeniowy TCO dla nowych samochodów segmentu SUV",
    version="1.0.0",
)

# Zezwolenie na połączenia z frontendu React (Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check():
     """
    Function to check health of the service.
    """
    return {"status": "ok", "service": "DriveOptima TCO Engine"}


@app.get("/api/v1/fuels")
def get_fuel_prices(db: Session = Depends(get_db)):
    """
    Function that is calling the api endpoint to get the fuel prices.
    """
    return db.query(FuelPrice).all()


@app.post("/api/v1/calculate", response_model=CalculationResponse)
def calculate_tco(request: CalculationRequest, db: Session = Depends(get_db)):
    """
    Function that is calculating TCO.
    """
    vehicles = (
        db.query(Vehicle)
        .filter(
            Vehicle.body_type == request.body_type,
            Vehicle.base_price <= request.budget_bracket_max,
        )
        .all()
    )

    if not vehicles:
        raise HTTPException(
            status_code=404,
            detail="Brak pojazdów spełniających podane kryteria budżetowe.",
        )

    fuel_prices = db.query(FuelPrice).all()
    fuel_prices_map = {fp.fuel_type: fp for fp in fuel_prices}

    ranked = rank_vehicles(vehicles, fuel_prices_map, request)

    return CalculationResponse(
        selected_criteria=SelectedCriteria(
            body_type=request.body_type,
            budget_bracket_max=request.budget_bracket_max,
            calculated_annual_km=MILEAGE_MAP[request.mileage_bracket],
            years=request.years,
        ),
        ranking=ranked,
    )
