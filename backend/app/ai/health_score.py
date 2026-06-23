from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.transaction import Transaction
from app.ai.anomaly_detection import AnomalyDetector

class InventoryHealthAnalyzer:
    @classmethod
    def calculate_product_health(cls, product: Product, transactions: list):

        if product.quantity > product.threshold * 3:
            stock_score = 100
        elif product.quantity > product.threshold * 2:
            stock_score = 75
        elif product.quantity > product.threshold:
            stock_score = 50
        elif product.quantity > 0:
            stock_score = 25
        else:
            stock_score = 0

        out_qty = sum([t.quantity for t in transactions if t.type == "OUT"])
        if product.quantity > 0:
            turnover_ratio = (out_qty / product.quantity) * 100
            turnover_score = min(100, int(turnover_ratio))
        else:
            turnover_score = 100 if out_qty > 0 else 0

        accuracy_score = 100

        availability_score = 100 if product.quantity > 0 else 25

        overall_score = int(
            (stock_score * 0.30) +
            (turnover_score * 0.25) +
            (accuracy_score * 0.20) +
            (availability_score * 0.25)
        )

        if overall_score >= 90: grade = "A"
        elif overall_score >= 75: grade = "B"
        elif overall_score >= 60: grade = "C"
        elif overall_score >= 45: grade = "D"
        else: grade = "F"

        insights = []
        if stock_score == 0: insights.append("Out of stock!")
        elif stock_score == 100: insights.append("Stock levels are very healthy.")

        recommendations = []
        if stock_score <= 25: recommendations.append("Reorder immediately.")

        return {
            "product_id": product.id,
            "product_name": product.name,
            "overall_score": overall_score,
            "grade": grade,
            "stock_score": stock_score,
            "turnover_score": turnover_score,
            "accuracy_score": accuracy_score,
            "availability_score": availability_score,
            "insights": insights,
            "recommendations": recommendations
        }

    @classmethod
    def calculate_overall_health(cls, db: Session):
        products = db.query(Product).all()
        cutoff = datetime.utcnow() - timedelta(days=30)

        product_scores = []
        grades = {"A": 0, "B": 0, "C": 0, "D": 0, "F": 0}

        for p in products:
            txns = db.query(Transaction).filter(
                Transaction.product_id == p.id,
                Transaction.created_at >= cutoff
            ).all()

            score_data = cls.calculate_product_health(p, txns)
            product_scores.append(score_data)
            grades[score_data["grade"]] += 1

        total_score = int(sum([s["overall_score"] for s in product_scores]) / len(product_scores)) if product_scores else 0

        if total_score >= 90: grade = "A"
        elif total_score >= 75: grade = "B"
        elif total_score >= 60: grade = "C"
        elif total_score >= 45: grade = "D"
        else: grade = "F"

        product_scores.sort(key=lambda x: x["overall_score"])
        needs_attention = product_scores[:3] if len(product_scores) >= 3 else product_scores
        top_performing = product_scores[-3:][::-1] if len(product_scores) >= 3 else product_scores[::-1]

        summary_insights = [
            f"{grades['A'] + grades['B']} products are in good health.",
            f"{grades['D'] + grades['F']} products require attention."
        ]

        return {
            "overall_score": total_score,
            "grade": grade,
            "total_products": len(products),
            "grade_distribution": grades,
            "top_performing": top_performing,
            "needs_attention": needs_attention,
            "product_scores": product_scores,
            "summary_insights": summary_insights,
            "calculated_at": datetime.utcnow().isoformat()
        }
