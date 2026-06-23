import re
from sqlalchemy.orm import Session

class CategorySuggester:
    @staticmethod
    def extract_keywords(text: str):
        if not text:
            return []

        text = text.lower()
        words = re.findall(r'\b[a-z]{3,}\b', text)

        stop_words = {"the", "and", "for", "with", "that", "this", "are", "but", "not"}
        keywords = [w for w in words if w not in stop_words]
        return keywords

    @staticmethod
    def build_keyword_map(db: Session = None):

        return {
            "Electronics": ["phone", "laptop", "computer", "cable", "charger", "battery", "electronic", "device", "monitor", "keyboard", "mouse"],
            "Clothing": ["shirt", "pant", "dress", "shoe", "jacket", "cloth", "wear", "fashion", "fabric", "cotton", "polyester"],
            "Food & Beverages": ["food", "drink", "beverage", "snack", "fruit", "vegetable", "juice", "water", "tea", "coffee", "sugar", "rice", "wheat"],
            "Office Supplies": ["pen", "paper", "stapler", "folder", "notebook", "desk", "chair", "office", "printer", "toner", "ink", "file"],
            "Tools & Hardware": ["tool", "hammer", "drill", "screw", "nail", "wrench", "saw", "equipment", "machine", "hardware", "bolt", "nut"]
        }

    @classmethod
    def suggest_category(cls, product_name: str, description: str = "", db: Session = None):
        keywords = cls.extract_keywords(product_name + " " + description)
        keyword_map = cls.build_keyword_map(db)

        suggestions = []
        for cat, cat_keywords in keyword_map.items():
            matches = [k for k in keywords if k in cat_keywords]
            if matches:
                confidence = min(100, len(matches) * 25)
                suggestions.append({
                    "category_name": cat,
                    "confidence": confidence,
                    "matching_keywords": matches
                })

        suggestions.sort(key=lambda x: x["confidence"], reverse=True)
        return suggestions
