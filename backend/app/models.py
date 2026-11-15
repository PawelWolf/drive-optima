from sqlalchemy import Column, Float, ForeignKey, Integer, String
from .database import Base


class FuelPrice(Base):
    __tablename__ = "fuel_prices"

    fuel_type = Column(String(20), primary_key=True)
    price_per_unit = Column(Float, nullable=False)
    unit_label = Column(String(10), nullable=False)


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    body_type = Column(String(30), default="SUV", index=True, nullable=False)
    budget_bracket_max = Column(Integer, index=True, nullable=False)
    fuel_type = Column(String(20), ForeignKey("fuel_prices.fuel_type"), nullable=False)
    model_example = Column(String(100), nullable=False)
    base_price = Column(Integer, nullable=False)
    cons_city = Column(Float, nullable=False)
    cons_suburban = Column(Float, nullable=False)
    cons_highway = Column(Float, nullable=False)
    annual_service_cost = Column(Integer, nullable=False)
    residual_rate_5y = Column(Float, nullable=False)