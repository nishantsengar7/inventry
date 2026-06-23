from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from app.database import get_db
from app.routes.auth import get_current_user
from app.models.user import User

from app.ai.forecasting import DemandForecaster
from app.ai.reorder_engine import ReorderEngine
from app.ai.anomaly_detection import AnomalyDetector
from app.ai.health_score import InventoryHealthAnalyzer
from app.ai.category_suggester import CategorySuggester
from app.ai.chat_assistant import InventoryChatAssistant

router = APIRouter()

forecast_cache = {
    "data": None,
    "timestamp": None
}
import time

@router.get("/forecast")
def get_forecast(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    global forecast_cache

    if forecast_cache["data"] and forecast_cache["timestamp"] and (time.time() - forecast_cache["timestamp"]) < 3600:
        return forecast_cache["data"]

    results = DemandForecaster.get_forecast_for_all_products(db)
    forecast_cache["data"] = results
    forecast_cache["timestamp"] = time.time()

    return results

@router.get("/reorder-suggestions")
def get_reorder_suggestions(show_all: bool = False, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    suggestions = ReorderEngine.generate_reorder_suggestions(db)

    if not show_all:
        suggestions = [s for s in suggestions if s["needs_reorder"]]

    return suggestions

@router.get("/anomalies")
def get_anomalies(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tx_anomalies = AnomalyDetector.detect_transaction_anomalies(db)
    stock_anomalies = AnomalyDetector.detect_stock_anomalies(db)

    combined = tx_anomalies + stock_anomalies

    severity_order = {"critical": 0, "high": 1, "medium": 2, "warning": 3, "info": 4}
    combined.sort(key=lambda x: severity_order.get(x.get("severity", "info"), 5))

    return combined

@router.get("/health-score")
def get_health_score(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return InventoryHealthAnalyzer.calculate_overall_health(db)

@router.post("/suggest-category")
def suggest_category(
    payload: Dict[str, str] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product_name = payload.get("product_name", "")
    description = payload.get("description", "")

    suggestions = CategorySuggester.suggest_category(product_name, description, db)
    return suggestions

@router.post("/chat")
def chat(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    message = payload.get("message", "")
    conversation_history = payload.get("conversation_history", [])

    import os
    if not os.getenv("GEMINI_API_KEY"):
        return {
            "response": "Chat requires GEMINI_API_KEY configuration.",
            "tokens_used": 0
        }

    result = InventoryChatAssistant.chat(message, db, conversation_history)
    return result
