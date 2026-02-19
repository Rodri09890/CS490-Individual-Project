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
