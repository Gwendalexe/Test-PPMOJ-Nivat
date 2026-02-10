import random
import string

import bcrypt
import database.models as models
from core.models import (carre_completed_model, profile_info,
                         user_confirmation, user_edit_model, user_model)
from flask import abort, jsonify, request
from flask_restx import Namespace, Resource
from utils.token import decode_token

api = Namespace('users', description='Users related operations')

from database.database import DatabaseManager

db_manager = DatabaseManager()

from utils.decorators import token_required
from utils.mail import sendConfirmationTemplate


@api.route('')
class UsersList(Resource):
    @api.marshal_list_with(user_model)
    @api.response(401, 'User token invalid')
    @api.response(500, 'Internal Server Error')
    @token_required
    def get(self):
        '''List all users'''
        try:
          user_id = decode_token(request.headers["Authorization"])['user_id']
          if not db_manager.UserIsAdmin(user_id):
            abort(401, 'User not authorized to list users')

          data = models.User.serialize_list(db_manager.ReadUsers())
          if data is None:
            abort(404)
        except Exception as e:
          return {'message': "User not found"}, 404
        return data, 200

@api.route('/<int:user_id>')
class User(Resource):
    @api.marshal_with(user_model)
    @api.response(401, 'User token invalid')
    @api.response(500, 'Internal Server Error')
    @token_required

    def get(self, user_id):
        '''Retrieve one user by id'''
        try:
          data = db_manager.ReadUserById(user_id).serialize()
          if data is None:
            abort(404)

        except Exception as e:
          return {'message': "User not found"}, 404
        return data, 200

    # @api.marshal_with(user_model)
    @api.response(401, 'User token invalid')
    @api.response(500, 'Internal Server Error')
    # Make sure the model is correct for validation
    @api.expect(user_edit_model, validate=True)
    @token_required
    def put(self, user_id):
        '''Update one user by id'''
        r = request.json
        token_user_id = decode_token(request.headers["Authorization"])['user_id']
        if token_user_id != user_id:
          abort(401, 'User not authorized to update this user')

        user = db_manager.ReadUserById(user_id).serialize()
        if (user is None):
          abort(404, 'User not found')

        if "username" in r and r["username"] != user["username"]:
          existing_user = db_manager.ReadUserByUsername(r["username"])
          if existing_user and existing_user.id != user_id:
              abort(409, "newUsername already exists")

        if "email" in r and r["email"] != user["email"]:
          existing_user = db_manager.ReadUserByEmail(r["email"])
          if existing_user and existing_user.id != user_id:
              abort(409, "newEmail already exists")

        if ("email" in r or "password" in r or "username" in r) and "oldPassword" in r:
          if not bcrypt.checkpw(r["oldPassword"].encode('utf-8'), user["password_hash"].encode('utf-8')):
              abort(401, 'Incorrect password')

        if "password" in r.keys() and "oldPassword" in r.keys():
          new_password_bytes = r["password"].encode('utf-8')
          new_password_hash = bcrypt.hashpw(
              new_password_bytes, bcrypt.gensalt())
          r["password_hash"] = new_password_hash
          del r['password']
          del r['oldPassword']

        allowed_fields = {"username", "email", "password_hash", "tutorial_mojette_done"}
        update_data = {k: v for k, v in r.items() if k in allowed_fields}
        update_data = convert_bool_strings(update_data)

        try:
          db_manager.UpdateUser(user_id, update_data)
        except Exception as e:
          api.abort(500, str(e))
        return {"message": "User updated successfully"}, 201

def convert_bool_strings(data: dict) -> dict:
    for key, value in data.items():
        if isinstance(value, str):
            lowered = value.lower()
            if lowered == 'true':
                data[key] = True
            elif lowered == 'false':
                data[key] = False
    return data

@api.route('/<int:user_id>/resend_email')
class UserEmail(Resource):
    @api.marshal_list_with(profile_info)
    @api.response(401, 'User token invalid')
    @api.response(403, 'User not found')
    @api.response(500, 'Internal Server Error')
    @token_required

    def get(self, user_id):
        '''Resend mail'''
        try:
          data = db_manager.ReadUserById(user_id).serialize()
          if data is None:
            abort(404)
        except Exception as e:
          return {'message': "User not found"}, 404

        try:
          confirmation_token = ''.join(random.choices(string.ascii_uppercase + string.digits, k=16)) + data["username"]
          db_manager.UpdateUser(
              user_id, {"confirmation_token": confirmation_token})
          sendConfirmationTemplate(data['email'], user_id, confirmation_token)
        except Exception as e:
          return {'message': "User not found"}, 404

        return 'Email sent successfully', 200

@api.route('/<int:user_id>/confirmed')
class UserConfirmation(Resource):
    @api.marshal_with(user_confirmation)
    @api.response(401, 'User token invalid')
    @api.response(500, 'Internal Server Error')
    @token_required

    def get(self, user_id):
        '''Retrieve confirmation status for user by id'''

        data = db_manager.ReadUserById(user_id).serialize()
        if data is None:
          abort(404)
        return data, 200

@api.route('/<int:user_id>/confirm/<string:token>')
class UserConfirm(Resource):
    @api.response(401, 'User token invalid')
    @api.response(404, 'User not found')
    @api.response(500, 'Internal Server Error')
    def put(self, user_id, token):
        '''Confirm user'''
        try:
          data = db_manager.UpdateUserConfirmationStatus(user_id, token)
          if data is None:
            abort(404)
        except Exception as e:
          print(e)
          return {'message': "User not found or token invalid"}, 404

        return 'User confirmed successfully', 201

@api.route('/<int:user_id>/carres/<int:carre_id>/completed')
class CarreCompleted(Resource):
    @api.marshal_with(carre_completed_model)
    @api.response(401, 'User token invalid')
    @api.response(500, 'Internal Server Error')
    @token_required

    def get(self, user_id, carre_id):
        '''Retrieve if user has completed carre problem'''
        try:
          data = db_manager.ReadCarreCompletedByPrimaryKey(user_id, carre_id).serialize()
          data['reward'] = db_manager.ReadCarreReward(carre_id)
          if data is None:
            abort(400)
        except Exception as e:
          return {'message': "Mojette completion not found"}, 404

        return data, 200
