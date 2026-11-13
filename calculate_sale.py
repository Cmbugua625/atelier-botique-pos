import json
from http.server import BaseHTTPRequestHandler

def discount_rate(subtotal):
    """Return the discount rate for a purchase subtotal."""
    if subtotal >= 10000:
        return 0.15
    elif subtotal >= 5000:
        return 0.10
    elif subtotal >= 2000:
        return 0.05
    else:
        return 0.0

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > 100_000:
                return self.send_json(400, {"error": "Invalid request size."})

            data = json.loads(self.rfile.read(length).decode("utf-8"))
            customer = str(data.get("customer", "Walk-in customer")).strip() or "Walk-in customer"
            incoming_items = data.get("items", [])

            if not isinstance(incoming_items, list) or not incoming_items:
                return self.send_json(400, {"error": "Add at least one product."})

            items = []
            subtotal = 0.0

            for item in incoming_items:
                quantity = item.get("quantity")
                price = item.get("unit_price")
                stock = item.get("available_stock")
                name = str(item.get("name", "Product")).strip()
                product_id = str(item.get("product_id", ""))

                if isinstance(quantity, bool) or not isinstance(quantity, int) or quantity <= 0:
                    return self.send_json(400, {"error": "Quantity must be a whole number greater than zero."})
                if isinstance(price, bool) or not isinstance(price, (int, float)) or price <= 0:
                    return self.send_json(400, {"error": "Unit price must be greater than zero."})
                if isinstance(stock, bool) or not isinstance(stock, int) or stock < 0:
                    return self.send_json(400, {"error": "Available stock is invalid."})
                if quantity > stock:
                    return self.send_json(400, {"error": f"Insufficient stock for {name}. Available: {stock}."})

                line_total = round(quantity * float(price), 2)
                subtotal += line_total
                items.append({
                    "product_id": product_id,
                    "name": name,
                    "quantity": quantity,
                    "unit_price": round(float(price), 2),
                    "line_total": line_total
                })

            subtotal = round(subtotal, 2)
            rate = discount_rate(subtotal)
            discount_amount = round(subtotal * rate, 2)
            total = round(subtotal - discount_amount, 2)

            return self.send_json(200, {
                "customer": customer,
                "items": items,
                "subtotal": subtotal,
                "discount_rate": rate,
                "discount_amount": discount_amount,
                "total": total
            })

        except (json.JSONDecodeError, UnicodeDecodeError):
            return self.send_json(400, {"error": "Request must contain valid JSON."})
        except Exception:
            return self.send_json(500, {"error": "Unexpected server error."})

    def do_GET(self):
        return self.send_json(200, {
            "message": "Atelier Python sales API is running.",
            "endpoint": "POST /api/calculate_sale"
        })

    def send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
