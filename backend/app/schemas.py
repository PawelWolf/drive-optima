from typing import List, Literal
from pydantic import BaseModel, Field, model_validator


class RouteRatio(BaseModel):
    city: float = Field(..., ge=0, le=100)
    suburban: float = Field(..., ge=0, le=100)
    highway: float = Field(..., ge=0, le=100)

    @model_validator(mode="after")
    def check_sum_equals_100(self):
        total = round(self.city + self.suburban + self.highway, 2)
        if total != 100.0:
            raise ValueError(f"Suma procentów tras musi wynosić 100% (obecnie: {total}%)")
        return self


class CalculationRequest(BaseModel):
    body_type: Literal["SUV"] = "SUV"
    budget_bracket_max: int = Field(..., ge=80000, le=250000)
    mileage_bracket: Literal["<5", "5-10", "10-15", "15-20", "20-25", ">25"]
    route_ratio: RouteRatio
    years: int = Field(default=5, ge=5, le=15)


class CostBreakdown(BaseModel):
    depreciation_cost: float
    fuel_cost: float
    service_cost: float


class VehicleResult(BaseModel):
    rank: int
    is_winner: bool
    vehicle_id: int
    model_example: str
    fuel_type: str
    base_price: int
    weighted_consumption: float
    unit_label: str
    breakdown: CostBreakdown
    total_tco: float
    monthly_cost: float


class SelectedCriteria(BaseModel):
    body_type: str
    budget_bracket_max: int
    calculated_annual_km: int
    years: int


class CalculationResponse(BaseModel):
    selected_criteria: SelectedCriteria
    ranking: List[VehicleResult]