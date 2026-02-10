import datetime
import jwt

def generate_token(user_id, role=False):
  from app import app
  expiration_time = datetime.datetime.now() + datetime.timedelta(minutes=30)
  token = jwt.encode({
    "user_id": user_id,
    "admin": role,
    "expiration": expiration_time.strftime("%d/%m/%Y, %H:%M:%S")  # Token expires after 30 minutes
  }, app.config['SECRET_KEY'])
  return token

def decode_token(token):
  from app import app
  return jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])