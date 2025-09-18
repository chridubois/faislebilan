# app/schemas/__init__.py
from .menu import (
    GenerateRequest,
    WeekPlan,
    DayPlan,
    Meal,
    Recipe,
    EvaluateResponse,
    SwapRequest,
    MoveRequest,
)

__all__ = [
    "GenerateRequest",
    "WeekPlan",
    "DayPlan",
    "Meal",
    "Recipe",
    "EvaluateResponse",
    "SwapRequest",
    "MoveRequest",
]
