from flask import Flask
from flask_cors import CORS
from config import Config
from extensions import db
from routes import bp

app = Flask(__name__)
app.config.from_object(Config)

CORS(app)
db.init_app(app)

# Register blueprint
app.register_blueprint(bp)

if __name__ == "__main__":
    app.run(debug=True)
