from flask import Blueprint, jsonify, request
from extensions import db
from sqlalchemy import text

bp = Blueprint("routes", __name__)

#Route for the top rented films
@bp.route("/top-rented", methods=["GET"])
def top_rented_movies():
    """
    Returns top 5 most rented movies from Sakila
    """
    query = text("""
        SELECT f.film_id, f.title, COUNT(r.rental_id) AS rental_count
        FROM film f
        JOIN inventory i ON f.film_id = i.film_id
        JOIN rental r ON i.inventory_id = r.inventory_id
        GROUP BY f.film_id
        ORDER BY rental_count DESC
        LIMIT 5
    """)

    result = db.session.execute(query).mappings().all()

    if not result:
        return jsonify({"error": "Film not found"}), 404

    return jsonify([dict(row) for row in result])


#Route for the films description
@bp.route("/films/<int:film_id>", methods=["GET"])
def get_film_details(film_id):

    query = text("""
        SELECT 
            film_id,
            title,
            description,
            release_year,
            rental_rate,
            length,
            rating
        FROM film
        WHERE film_id = :film_id
    """)

    result = db.session.execute(query,{"film_id": film_id}).mappings().first()

    if not result:
        return jsonify({"error": "Film not found"}), 404

    return jsonify(dict(result))

#Route for the top 5 actors
@bp.route("/top-actors", methods=["GET"])
def top_actors():
    """
    Returns top 5 actors
    """
    query = text("""
        SELECT actor.actor_id, actor.first_name, actor.last_name, COUNT(film_actor.film_id) as film_count
        FROM actor
        JOIN film_actor ON actor.actor_id = film_actor.actor_id
        JOIN film ON film_actor.film_id = film.film_id
        GROUP BY 
        actor.actor_id,
        actor.first_name,
        actor.last_name
        ORDER BY film_count DESC
        LIMIT 5
    """)

    result = db.session.execute(query)
    
    if not result:
        return jsonify({"error": "Film not found"}), 404

    top5Actors = []
    for row in result.mappings():
        top5Actors.append({
            "actor_id": row["actor_id"],
            "first_name": row["first_name"],
            "last_name": row["last_name"],
            "film_count": row["film_count"],
        })

    return jsonify(top5Actors)

#Route actor details and top 5 movies
@bp.route("/actor/<int:actor_id>/top-movies", methods=["GET"])
def get_actor_details(actor_id):
    """
    Returns actor details and top 5 movies
    """
    query = text("""
        SELECT actor.actor_id, actor.first_name, actor.last_name, film.film_id, film.title
        FROM actor
        JOIN film_actor ON actor.actor_id = film_actor.actor_id
        JOIN film ON film_actor.film_id = film.film_id
        JOIN inventory ON film.film_id = inventory.film_id
        JOIN rental ON inventory.inventory_id = rental.inventory_id
        WHERE actor.actor_id = :actor_id
        GROUP BY film.film_id, film.title
        ORDER BY COUNT(rental.rental_id) DESC
        LIMIT 5;
    """)

    result = db.session.execute(query,{"actor_id": actor_id}).mappings().all()
    if not result:
        return jsonify({"error": "Film not found"}), 404

    return jsonify([dict(row) for row in result])


#Return the search based on film name, actor or category
@bp.route("/api/search", methods=["GET"])
def search_films():
    query = request.args.get("q", "").strip()
    search_filter = request.args.get("filter", "title").lower()

    if not query:
        return jsonify([])
    
    search_term = f"%{query}%"

    base_query = """
        SELECT DISTINCT f.film_id, f.title, f.description, f.release_year,
        GROUP_CONCAT(DISTINCT CONCAT(a.first_name, ' ', a.last_name)) AS actors,
        GROUP_CONCAT(DISTINCT c.name) AS genres
        FROM film f
        LEFT JOIN film_actor fa ON f.film_id = fa.film_id
        LEFT JOIN actor a ON fa.actor_id = a.actor_id
        LEFT JOIN film_category fc ON f.film_id = fc.film_id
        LEFT JOIN category c ON fc.category_id = c.category_id
    """

    if search_filter == "actor":
        where_clause = "WHERE CONCAT(a.first_name, ' ', a.last_name) LIKE :search"
    
    elif search_filter == "genre":
        where_clause = "WHERE c.name LIKE :search"
    
    else:
        where_clause = "WHERE f.title LIKE :search"

    final_sql = text(f"""
        {base_query}
        {where_clause}
        GROUP BY f.film_id
        ORDER BY f.title
        LIMIT 50
    """)

    result = db.session.execute(final_sql, {"search": search_term})
    films = [dict(row._mapping) for row in result]

    return jsonify(films)

@bp.route("/api/users", methods=["GET"])
def get_users():
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 10))
    search = request.args.get("search", "").strip()

    offset = (page - 1) * limit
    search_term = f"%{search}%"

    # Base query
    base_query = """
        FROM customer
        WHERE (:search = '' 
            OR customer_id LIKE :search_term
            OR first_name LIKE :search_term
            OR last_name LIKE :search_term)
    """

    # Get paginated users
    users_sql = text(f"""
        SELECT customer_id, first_name, last_name, email, active, create_date
        {base_query}
        ORDER BY customer_id
        LIMIT :limit OFFSET :offset
    """)

    result = db.session.execute(
        users_sql,
        {
            "limit": limit,
            "offset": offset,
            "search": search,
            "search_term": search_term
        }
    )

    users = [dict(row._mapping) for row in result]

    # Get total count (with same filter)
    count_sql = text(f"""
        SELECT COUNT(*)
        {base_query}
    """)

    total = int(
        db.session.execute(
            count_sql,
            {
                "search": search,
                "search_term": search_term
            }
        ).scalar_one()
    )

    total_pages = (total + limit - 1) // limit

    return jsonify({
        "data": users,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    })

@bp.route("/api/users", methods=["POST"])
def create_customer():
    data = request.json
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    email = data.get("email")
    active = data.get("active", 1)

    if not first_name or not last_name:
        return jsonify({"error": "First name and last name are required"}), 400

    insert_sql = text("""
        INSERT INTO customer 
        (store_id, first_name, last_name, email, address_id, active, create_date)
    VALUES
        (:store_id, :first_name, :last_name, :email, :address_id, :active, NOW())
    """)
    try:
        db.session.execute(insert_sql, {
            "store_id": 1,
            "address_id": 1, 
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "active": active
        })
        db.session.commit()
        return jsonify({"message": "Customer added successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@bp.route("/api/users/<int:customer_id>", methods=["PUT"])
def update_customer(customer_id):
    data = request.json
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    email = data.get("email")
    active = data.get("active")

    
    check_sql = text("SELECT customer_id FROM customer WHERE customer_id = :customer_id")
    customer = db.session.execute(check_sql, {"customer_id": customer_id}).mappings().first()
    if not customer:
        return jsonify({"error": "Customer not found"}), 404

    update_sql = text("""
        UPDATE customer
        SET first_name = :first_name,
            last_name = :last_name,
            email = :email,
            active = :active
        WHERE customer_id = :customer_id
    """)
    try:
        db.session.execute(update_sql, {
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "active": active,
            "customer_id": customer_id
        })
        db.session.commit()
        return jsonify({"message": "Customer updated successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@bp.route("/api/users/<int:customer_id>", methods=["DELETE"])
def delete_customer(customer_id):
    
    check_sql = text("SELECT customer_id FROM customer WHERE customer_id = :customer_id")
    customer = db.session.execute(check_sql, {"customer_id": customer_id}).mappings().first()
    if not customer:
        return jsonify({"error": "Customer not found"}), 404

    delete_sql = text("DELETE FROM customer WHERE customer_id = :customer_id")
    try:
        db.session.execute(delete_sql, {"customer_id": customer_id})
        db.session.commit()
        return jsonify({"message": "Customer deleted successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    

@bp.route("/api/users/<int:customer_id>/rentals", methods=["GET"])
def get_customer_rentals(customer_id):
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 5))
    offset = (page - 1) * limit

    # Validate customer
    customer_query = text("SELECT * FROM customer WHERE customer_id = :customer_id")
    customer = db.session.execute(customer_query, {"customer_id": customer_id}).mappings().first()
    if not customer:
        return jsonify({"error": "Customer not found"}), 404

    # Get rentals
    rentals_query = text("""
        SELECT r.rental_id, f.title, r.rental_date, r.return_date
        FROM rental r
        JOIN inventory i ON r.inventory_id = i.inventory_id
        JOIN film f ON i.film_id = f.film_id
        WHERE r.customer_id = :customer_id
        ORDER BY r.rental_date DESC
        LIMIT :limit OFFSET :offset
    """)
    rentals = db.session.execute(rentals_query, {
        "customer_id": customer_id,
        "limit": limit,
        "offset": offset
    }).mappings().all()

    # Total rentals for pagination
    count_query = text("SELECT COUNT(*) FROM rental WHERE customer_id = :customer_id")
    total = db.session.execute(count_query, {"customer_id": customer_id}).scalar_one()
    total_pages = (total + limit - 1) // limit

    return jsonify({
        "customer": dict(customer),
        "rentals": [dict(r) for r in rentals],
        "page": page,
        "total_pages": total_pages
    })

@bp.route("/api/rent", methods=["POST"])
def rent_film():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON request"}), 400

    film_id = data.get("film_id")
    customer_id = data.get("customer_id")
    if not film_id or not customer_id:
        return jsonify({"error": "film_id and customer_id are required"}), 400

    # Validate customer
    customer_query = text("""
        SELECT customer_id, active
        FROM customer
        WHERE customer_id = :customer_id
    """)
    customer = db.session.execute(customer_query, {"customer_id": customer_id}).mappings().first()
    if not customer:
        return jsonify({"error": "Customer does not exist"}), 404
    if customer["active"] == 0:
        return jsonify({"error": "Customer account is inactive"}), 403

    # Find available inventory
    inventory_query = text("""
        SELECT i.inventory_id
        FROM inventory i
        LEFT JOIN rental r
            ON i.inventory_id = r.inventory_id
            AND r.return_date IS NULL
        WHERE i.film_id = :film_id
        AND r.rental_id IS NULL
        LIMIT 1
    """)
    inventory = db.session.execute(inventory_query, {"film_id": film_id}).mappings().first()
    if not inventory:
        return jsonify({"error": "No available copies of this film"}), 400

    inventory_id = inventory["inventory_id"]

    # Staff ID (example)
    staff_id = 1

    rental_query = text("""
        INSERT INTO rental (rental_date, inventory_id, customer_id, staff_id)
        VALUES (NOW(), :inventory_id, :customer_id, :staff_id)
    """)
    try:
        db.session.execute(rental_query, {
            "inventory_id": inventory_id,
            "customer_id": customer_id,
            "staff_id": staff_id
        })
        db.session.commit()
        return jsonify({
            "message": "Film rented successfully",
            "film_id": film_id,
            "inventory_id": inventory_id,
            "customer_id": customer_id
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@bp.route("/api/return", methods=["POST"])
def return_film():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON request"}), 400

    rental_id = data.get("rental_id")
    if not rental_id:
        return jsonify({"error": "rental_id is required"}), 400

    # Check if the rental exists and is not already returned
    rental_query = text("""
        SELECT rental_id, return_date
        FROM rental
        WHERE rental_id = :rental_id
    """)
    rental = db.session.execute(rental_query, {"rental_id": rental_id}).mappings().first()
    if not rental:
        return jsonify({"error": "Rental not found"}), 404
    if rental["return_date"] is not None:
        return jsonify({"error": "This film has already been returned"}), 400

    # Update rental to mark as returned
    update_query = text("""
        UPDATE rental
        SET return_date = NOW()
        WHERE rental_id = :rental_id
    """)
    try:
        db.session.execute(update_query, {"rental_id": rental_id})
        db.session.commit()
        return jsonify({"message": "Film returned successfully", "rental_id": rental_id})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
