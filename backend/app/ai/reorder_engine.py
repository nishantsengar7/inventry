from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.supplier import Supplier
from app.ai.forecasting import DemandForecaster

class ReorderEngine:
    @staticmethod
    def calculate_safety_stock(avg_daily_usage: float, lead_time_days: int = 7) -> int:
        return int((avg_daily_usage * lead_time_days * 0.5) + 0.999)

    @staticmethod
    def calculate_reorder_point(avg_daily_usage: float, lead_time_days: int = 7, safety_stock: int = 0) -> int:
        return int((avg_daily_usage * lead_time_days) + safety_stock + 0.999)

    @staticmethod
    def calculate_reorder_quantity(avg_daily_usage: float, review_period: int = 30) -> int:
        qty = int(avg_daily_usage * review_period)
        return max(qty, 10)

    @classmethod
    def generate_reorder_suggestions(cls, db: Session):
        products = db.query(Product).all()
        suggestions = []

        for product in products:
            daily_usage = DemandForecaster.get_daily_usage(db, product.id, days=30)
            avg_daily_usage = DemandForecaster.calculate_avg_daily_usage(daily_usage, days=30)

            safety_stock = cls.calculate_safety_stock(avg_daily_usage)
            reorder_point = cls.calculate_reorder_point(avg_daily_usage, safety_stock=safety_stock)
            reorder_qty = cls.calculate_reorder_quantity(avg_daily_usage)

            needs_reorder = False
            if product.quantity <= reorder_point:
                needs_reorder = True

            urgency = "ok"
            if product.quantity == 0:
                urgency = "critical"
            elif product.quantity <= safety_stock:
                urgency = "urgent"
            elif product.quantity <= reorder_point:
                urgency = "soon"

            if urgency == "critical":
                action_message = f"URGENT: Out of stock! Order {reorder_qty} units immediately."
                days_to_action = 0
            elif urgency == "urgent":
                action_message = f"Order {reorder_qty} units within 2 days to avoid stockout."
                days_to_action = 2
            elif urgency == "soon":
                action_message = f"Plan to order {reorder_qty} units within this week."
                days_to_action = 7
            else:
                action_message = f"Stock level healthy. Next reorder in ~15 days."
                days_to_action = 15

            supplier_name = product.supplier.name if product.supplier else "Unknown"
            supplier_email = product.supplier.email if product.supplier else ""

            suggestions.append({
                "product_id": product.id,
                "product_name": product.name,
                "sku": product.sku,
                "supplier_name": supplier_name,
                "supplier_email": supplier_email,
                "current_stock": product.quantity,
                "reorder_point": reorder_point,
                "safety_stock": safety_stock,
                "suggested_reorder_qty": reorder_qty,
                "urgency": urgency,
                "needs_reorder": needs_reorder,
                "estimated_cost": product.price * reorder_qty,
                "action_message": action_message,
                "days_to_action": days_to_action
            })

        return suggestions
