from collections import defaultdict
from datetime import datetime, timedelta
import statistics

from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.transaction import Transaction

class DemandForecaster:
    @staticmethod
    def get_daily_usage(db: Session, product_id: int, days: int = 30):
        cutoff = datetime.utcnow() - timedelta(days=days)
        txns = db.query(Transaction).filter(
            Transaction.product_id == product_id,
            Transaction.type == "OUT",
            Transaction.created_at >= cutoff
        ).all()

        daily_usage = defaultdict(int)
        for t in txns:
            day_str = t.created_at.strftime("%Y-%m-%d")
            daily_usage[day_str] += t.quantity

        return dict(daily_usage)

    @staticmethod
    def calculate_avg_daily_usage(daily_usage: dict, days: int = 30):
        if not daily_usage:
            return 0.0

        total_usage = sum(daily_usage.values())
        return round(total_usage / days, 2)

    @staticmethod
    def calculate_moving_average(daily_usage: dict, window: int = 7):
        if not daily_usage:
            return []

        sorted_dates = sorted(daily_usage.keys())
        values = [daily_usage[d] for d in sorted_dates]

        if len(values) < window:
            return values

        moving_avg = []
        for i in range(len(values) - window + 1):
            window_slice = values[i:i + window]
            moving_avg.append(round(sum(window_slice) / window, 2))

        return moving_avg

    @staticmethod
    def predict_stockout_date(current_stock: int, avg_daily_usage: float, days_of_data: int = 30):
        if avg_daily_usage <= 0:
            return None

        days_left = int(current_stock / avg_daily_usage)
        stockout_date = (datetime.utcnow() + timedelta(days=days_left)).strftime("%Y-%m-%d")

        confidence = "high"
        if days_of_data < 14:
            confidence = "low"
        elif days_of_data < 30:
            confidence = "medium"

        return {
            "days_until_stockout": days_left,
            "stockout_date": stockout_date,
            "confidence": confidence
        }

    @classmethod
    def get_forecast_for_all_products(cls, db: Session):
        products = db.query(Product).all()
        forecasts = []

        for product in products:
            daily_usage = cls.get_daily_usage(db, product.id, days=30)
            avg_daily_usage = cls.calculate_avg_daily_usage(daily_usage, days=30)

            prediction = cls.predict_stockout_date(
                product.quantity,
                avg_daily_usage,
                days_of_data=len(daily_usage)
            )

            days_until_stockout = prediction["days_until_stockout"] if prediction else None
            stockout_date = prediction["stockout_date"] if prediction else None
            confidence = prediction["confidence"] if prediction else "low"

            trend = "stable"
            if len(daily_usage) >= 14:
                sorted_dates = sorted(daily_usage.keys(), reverse=True)
                last_7 = sum([daily_usage[d] for d in sorted_dates[:7]]) / 7
                prev_7 = sum([daily_usage[d] for d in sorted_dates[7:14]]) / 7
                if last_7 > prev_7 * 1.1:
                    trend = "increasing"
                elif last_7 < prev_7 * 0.9:
                    trend = "decreasing"

            chart_data = []
            today = datetime.utcnow()
            for i in range(14, 0, -1):
                d = (today - timedelta(days=i)).strftime("%Y-%m-%d")
                chart_data.append({
                    "date": d,
                    "actual_usage": daily_usage.get(d, 0),
                    "predicted_usage": avg_daily_usage
                })
            for i in range(0, 7):
                d = (today + timedelta(days=i)).strftime("%Y-%m-%d")
                chart_data.append({
                    "date": d,
                    "actual_usage": None,
                    "predicted_usage": avg_daily_usage
                })

            forecasts.append({
                "product_id": product.id,
                "product_name": product.name,
                "sku": product.sku,
                "current_stock": product.quantity,
                "avg_daily_usage": avg_daily_usage,
                "days_until_stockout": days_until_stockout,
                "stockout_date": stockout_date,
                "trend": trend,
                "confidence": confidence,
                "chart_data": chart_data
            })

        return forecasts
