# Atelier Boutique POS — Python + Vercel learning demo

This is a small, educational point-of-sale web application.

## What it demonstrates

- HTML builds the page structure.
- CSS styles the interface.
- JavaScript handles browser interactions and stores demo data in `localStorage`.
- Python runs as a Vercel serverless function at `api/calculate_sale.py`.
- The browser sends sale details to Python using `fetch()` and JSON.
- Python validates quantities and stock, applies the discount rules, and returns totals.
- Vercel hosts the static frontend and the Python API function.

## Important limitations

This is a learning demo, not a production POS:
- Product and sales data are stored in the current browser only.
- Data does not automatically sync between the owner's phone and the attendant's device.
- Clearing browser storage can erase the demo records.
- There are no logins, permissions, cloud database, audit trail, tax/eTIMS integration, or secure payment processing.
- The Python API receives product and stock details from the browser. A real system must load trusted prices and stock from a server-side database instead.

Do not use this demo to record real customer data or rely on it for real business stock and financial records.

## Deploy to Vercel

1. Extract this ZIP file.
2. Put the extracted folder in a GitHub repository.
3. Sign in to Vercel and choose **Add New → Project**.
4. Import the GitHub repository.
5. Keep the framework preset as **Other**.
6. Leave the build command and output directory blank/default; no frontend build is needed.
7. Deploy.

Vercel should detect `api/calculate_sale.py` as a Python Function. After deployment:
- Open the website URL to use the POS demo.
- Open `https://YOUR-DEPLOYMENT.vercel.app/api/calculate_sale` to check the Python API health message.

## Run locally

You need Python 3.12+ and Node.js (for the local static server).

From the project folder, in one terminal:
```bash
python -m http.server 3000
```
That serves the frontend, but the Python API route will not run through this simple server. For the complete local experience, deploy to Vercel or use the Vercel CLI:
```bash
npm install -g vercel
vercel dev
```

## Suggested code-reading order

1. `index.html` — page structure and form controls.
2. `styles.css` — visual styling and responsive layout.
3. `app.js` — browser events, product display, cart, receipt, and `fetch()`.
4. `api/calculate_sale.py` — Python validation, conditions, arithmetic, and JSON response.
5. `vercel.json` — tells Vercel how to configure the Python function.

## Python concepts you can already recognise

In `api/calculate_sale.py`, look for:
- `def discount_rate(subtotal):` — function definition (study this when you reach functions).
- `if / elif / else` — conditional logic from your current chapters.
- `>=`, `<=`, `>`, `<=` — comparison operators.
- `and` / `or` concepts can be practised by adding more validation.
- `subtotal += line_total` — an augmented assignment operator.
- `round()` — a built-in function.
- dictionaries such as `{"subtotal": subtotal}` — data structures (study dictionaries before trying to modify this).
- `try / except` — error handling (a later topic).
- JSON — a format for exchanging data between the browser and Python.

You do not need to understand every line yet. Treat this as a preview of what your future skills will let you build.
