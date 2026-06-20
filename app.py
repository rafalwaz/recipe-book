import os 
from flask import Flask, render_template, request, jsonify
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

def get_db_connection():
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    return conn

@app.route("/")
def index():
    return render_template("index.html")

@app.route('/api/recipes', methods=['GET'])
def get_recipes():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('SELECT id, title, ingredients, instructions, created_at FROM recipes ORDER BY created_at DESC;')
    recipes = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(recipes)

@app.route('/api/recipes', methods=['POST'])
def add_recipe():
    data = request.get_json()

    if not data or not data.get('title') or not data.get('ingredients') or not data.get('instructions'):
        return jsonify({'error': 'Wszystkie pola (tytuł, składniki, instrukcje) są wymagane!'}), 400

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        'INSERT INTO recipes (title, ingredients, instructions) VALUES (%s, %s, %s) RETURNING id;',
        (data['title'], data['ingredients'], data['instructions'])
    )
    new_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({'id': new_id, 'message': 'Przepis dodany pomyślnie!'}), 201

@app.route('/api/recipes/<int:recipe_id>', methods=['GET'])
def get_recipe(recipe_id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('SELECT id, title, ingredients, instructions, created_at FROM recipes WHERE id = %s;', (recipe_id,))
    recipe = cur.fetchone()
    cur.close()
    conn.close()

    if not recipe:
        return jsonify({'error': 'Przepis nie znaleziono!'}), 404

    return jsonify(recipe)

if __name__ == '__main__':
    app.run(debug=True)