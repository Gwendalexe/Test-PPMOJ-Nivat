
from functools import wraps
from flask import request, abort, g # added to top of file
import jwt

def token_required(f):
  @wraps(f)
  def decorated(*args, **kwargs):
    from app import app
    token = None
    if "Authorization" in request.headers:
      token = request.headers["Authorization"]
    if not token:
      abort(401, "Authentication Token is missing!")
    try:
      data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
      current_user = data["user_id"]
      if current_user is None:
        abort(401, "Invalid Authentication token!")

      #Add conditions (e.g is token expired / is Admin)
    except Exception as e:
      abort(500, "Something went wrong")

    return f(*args, **kwargs)
  return decorated