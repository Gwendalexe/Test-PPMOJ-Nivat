import os

import jwt
from core.models import model_namespace as models
from database.database import db
from flask import Flask
from flask_cors import CORS
from flask_mail import Mail
from flask_migrate import Migrate
from flask_restx import Api, Namespace
# --- IMPORTS DES ROUTEURS ---
from routers.auth import api as auth_api
from routers.carres import api as carres_api
from routers.formations import api as formation_api
from routers.mojettes import api as mojettes_api
# Ton travail (Nivats)
from routers.nivats import api as nivats_api
# Travail de l'équipe (Sprint December)
from routers.payment import api as payment_api
from routers.payment import stripe_cache
from routers.problems import api as problems_api
from routers.users import api as users_api
from routers.week_problems import api as week_problems_api
from sqlalchemy import event
from utils.common import load_environment

# Chargement de l'environnement selon la logique du sprint
env_state = load_environment()

DATABASE = "base_2.db"

app = Flask(__name__)
app.config['MAIL_DEFAULT_SENDER'] = os.getenv("EMAIL_DEFAULT_SENDER")
app.config['MAIL_SERVER'] = os.getenv("EMAIL_SERVER")
app.config['MAIL_PORT'] = int(os.getenv("EMAIL_PORT"))
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True
app.config['MAIL_USERNAME'] = os.getenv("EMAIL_USER")
app.config['MAIL_PASSWORD'] = os.getenv("EMAIL_PASSWORD")

# Configuration DB
app.config['SQLALCHEMY_DATABASE_URI'] = (
    f"mysql+pymysql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"f"@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_DATABASE')}?charset=utf8mb4")

app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    "pool_pre_ping": True,
    "pool_recycle": 25,
    "pool_size": 5,
    "max_overflow": 10,
    "pool_timeout": 30,
    "connect_args": {"connect_timeout": 10},
}

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['CORS_HEADERS'] = 'Content-Type'

front_url = os.getenv('FRONT_URL')
origins = [front_url, front_url.replace('https://www.', 'https://')]
print(f"CORS origins allowed: {origins}")
CORS(app, resources={
     r"/*": {"origins": origins, "supports_credentials": True}})

db.init_app(app)
migrate = Migrate(app, db)
mail = Mail(app)

# stripe_cache (Sprint December feature)
with app.app_context():
    stripe_cache.init_app(app)

# Timeouts de SESSION
with app.app_context():
    @event.listens_for(db.engine, "connect")
    def _set_session_timeouts(dbapi_conn, _):
        cur = dbapi_conn.cursor()
        cur.execute("SET SESSION wait_timeout=120")
        cur.execute("SET SESSION interactive_timeout=120")
        cur.execute("SET SESSION net_read_timeout=120")
        cur.execute("SET SESSION net_write_timeout=120")
        cur.close()


@app.teardown_appcontext
def _shutdown_session(exception=None):
    db.session.remove()


# --- API / Namespaces ---
authorizations = {
    'Bearer Auth': {'type': 'apiKey', 'in': 'header', 'name': 'Authorization'},
}

api = Api(
    app,
    version='1.0',
    title='PPMOJ API',
    description='Ceci sont les routes pour permettre de communiquer entre le serveur Flask et Angular',
    security='Bearer Auth',
    authorizations=authorizations
)

api.add_namespace(models)
api.add_namespace(auth_api)
api.add_namespace(users_api)
api.add_namespace(problems_api)
api.add_namespace(mojettes_api)
api.add_namespace(carres_api)
api.add_namespace(formation_api)

# Ajout de ton namespace
api.add_namespace(nivats_api)

# Ajout des namespaces du sprint
api.add_namespace(payment_api)
api.add_namespace(week_problems_api)

if __name__ == "__main__":
    if not env_state:
        raise ValueError("L'environnement n'est pas défini correctement.")
    with app.app_context():
        if env_state == "development":
            app.run(host="0.0.0.0")
        else:
            app.run()
