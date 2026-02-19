from extensions import db

class Film(db.Model):
    __tablename__ = "film"

    film_id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255))
    description = db.Column(db.Text)
    release_year = db.Column(db.Integer)
    rental_rate = db.Column(db.Float)

    def to_dict(self):
        return {
            "film_id": self.film_id,
            "title": self.title,
            "description": self.description,
            "release_year": self.release_year,
            "rental_rate": self.rental_rate
        }

class Actor(db.Model):
    __tablename__ = "actor"

    actor_id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(255))
    last_name = db.Column(db.String(255))

    def to_dict(self):
        return {
            "actor_id": self.actor_id,
            "first_name": self.first_name,
            "last_name": self.last_name
        }