from datetime import datetime, timedelta
import statistics
from collections import defaultdict
from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.transaction import Transaction

class AnomalyDetector:
    @staticmethod
    def calculate_zscore(value: float, mean: float, std: float) -> float:
        if std == 0:
            return 0.0
        return (value - mean) / std

    @classmethod
    def detect_transaction_anomalies(cls, db: Session, days: int = 30, threshold: float = 2.0):
        cutoff = datetime.utcnow() - timedelta(days=days)
        txns = db.query(Transaction).filter(Transaction.created_at >= cutoff).all()

        prod_type_quantities = defaultdict(lambda: defaultdict(list))
        for t in txns:
            prod_type_quantities[t.product_id][t.type].append(t.quantity)

        anomalies = []
        for t in txns:
            quantities = prod_type_quantities[t.product_id][t.type]
            if len(quantities) < 3:
                continue

            mean = statistics.mean(quantities)
            std = statistics.stdev(quantities) if len(quantities) > 1 else 0

            z_score = cls.calculate_zscore(t.quantity, mean, std)
            if abs(z_score) > threshold:
                severity = "high" if abs(z_score) > 3 else "medium"

                direction = "OUT" if t.type == "OUT" else "IN"
                ratio = t.quantity / mean if mean > 0 else 0
                reason = f"Unusually large stock {direction} ({ratio:.1f}x normal quantity)"

                anomalies.append({
                    "transaction_id": t.id,
                    "product_id": t.product.id,
                    "product_name": t.product.name,
                    "type": t.type,
                    "quantity": t.quantity,
                    "transaction_date": t.created_at.isoformat(),
                    "z_score": round(z_score, 2),
                    "severity": severity,
                    "reason": reason
                })

        return anomalies

    @classmethod
    def detect_stock_anomalies(cls, db: Session):
        products = db.query(Product).all()
        anomalies = []

        for p in products:
            if p.quantity < 0:
                anomalies.append({
                    "product_id": p.id,
                    "product_name": p.name,
                    "anomaly_type": "Negative Stock",
                    "description": "Stock level is below zero. Likely data entry error.",
                    "severity": "critical",
                    "detected_at": datetime.utcnow().isoformat()
                })

            txns = db.query(Transaction).filter(
                Transaction.product_id == p.id,
                Transaction.created_at >= datetime.utcnow() - timedelta(days=60)
            ).count()
            if txns == 0 and p.quantity > 0:
                anomalies.append({
                    "product_id": p.id,
                    "product_name": p.name,
                    "anomaly_type": "Dead Stock",
                    "description": "No stock movement in the last 60 days.",
                    "severity": "info",
                    "detected_at": datetime.utcnow().isoformat()
                })

        return anomalies
