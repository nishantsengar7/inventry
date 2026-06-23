import os
import google.generativeai as genai
from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.category import Category
from app.models.supplier import Supplier

class InventoryChatAssistant:
    @staticmethod
    def get_inventory_context(db: Session):
        total_products = db.query(Product).count()

        categories = db.query(Category).all()
        categories_list = "\n".join([f"- {c.name} (ID: {c.id}, Description: {c.description or 'N/A'})" for c in categories])

        suppliers = db.query(Supplier).all()
        suppliers_list = "\n".join([f"- {s.name} (ID: {s.id}, Contact: {s.email or 'N/A'})" for s in suppliers])

        products = db.query(Product).all()
        products_list = "\n".join([
            f"- {p.name} (SKU: {p.sku}, Qty: {p.quantity}, Price: ${p.price:.2f}, Threshold: {p.threshold}, Category: {p.category.name if p.category else 'N/A'}, Supplier: {p.supplier.name if p.supplier else 'N/A'})"
            for p in products[:50]
        ])

        low_stock = [p for p in products if p.quantity <= p.threshold]
        low_stock_list = "\n".join([f"- {p.name} (Qty: {p.quantity}, Threshold: {p.threshold})" for p in low_stock[:15]])
        if not low_stock_list:
            low_stock_list = "None (all items have sufficient stock)"

        context = f"""
        Total Products: {total_products}

        Product Categories:
        {categories_list}

        Suppliers:
        {suppliers_list}

        Active Products (Sample up to 50):
        {products_list}

        Low Stock Products:
        {low_stock_list}
        """
        return context

    @classmethod
    def chat(cls, user_message: str, db: Session, conversation_history: list = None):
        if conversation_history is None:
            conversation_history = []

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return {
                "response": "Chat requires GEMINI_API_KEY configuration.",
                "tokens_used": 0
            }

        genai.configure(api_key=api_key)

        context = cls.get_inventory_context(db)

        system_instruction = f"""
        You are an AI assistant for an Inventory Management System.
        You have access to real inventory data.

        Current Inventory Context:
        {context}

        Rules:
        - Answer only inventory-related questions
        - Use the real data provided above
        - Be concise and actionable
        - Format numbers clearly
        - Suggest actions when relevant
        """

        try:
            model = genai.GenerativeModel(
                model_name="gemini-2.5-flash",
                system_instruction=system_instruction
            )

            chat_session = model.start_chat(history=[])

            response = chat_session.send_message(user_message)

            return {
                "response": response.text,
                "tokens_used": 0
            }
        except Exception as e:
            return {
                "response": f"An error occurred: {str(e)}",
                "tokens_used": 0
            }
