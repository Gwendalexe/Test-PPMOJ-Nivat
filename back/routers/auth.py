import datetime
import os
import re
import uuid

import bcrypt
import jwt
from core.models import (login_form_model, login_return_model, profile_info,
                         user_minimal_model, user_model)
from database.database import DatabaseManager
from database.models import User, UserDataRequest, UserDataDeletion
from flask import abort, jsonify, request, send_file
from flask_restx import Namespace, Resource, fields
from utils.decorators import token_required
from utils.mail import sendConfirmationTemplate, sendPasswordResetTemplate
from utils.token import decode_token, generate_token
from utils.rgpd import create_user_export_json

api = Namespace('/', description='Auth related operations')

import random
import string

db_manager = DatabaseManager()

@api.route('/login')
class Login(Resource):
    @api.marshal_with(login_return_model)
    @api.expect(login_form_model, validate=True)  # Make sure the model is correct for validation
    @api.response(500, 'Internal Server Error')
    def post(self):
        """Login user"""
        r = request.json

        identifier = r.get("username") # champ unique : peut être email ou pseudo
        password = r.get("password")

        if not identifier or not password:
          abort(400, 'Incomplete JSON body')

        # Vérifie si identifier est un email
        if is_email(identifier):
            user = db_manager.ReadUserByEmail(identifier)
        else:
            user = db_manager.ReadUserByUsername(identifier)

        if user is None:
          abort(401, 'Incorrect username or email')

        user = user.serialize()
        user_hashed_password = user["password_hash"].encode('utf-8')

        if not bcrypt.checkpw(password.encode('utf-8'), user_hashed_password):
          abort(401, 'Incorrect password')

        user.pop("password_hash", None)
        user['token'] = generate_token(user['id'])
        return user

@api.route('/token/<string:token>/info')
class UserInfo(Resource):
    @api.marshal_with(user_model)
    @api.response(401, 'User token invalid')
    @api.response(500, 'Internal Server Error')
    @token_required

    def get(self, token):
        '''Retrieve user from token'''
        try:
          user_id = decode_token(token)['user_id']
          data = db_manager.ReadUserById(user_id).serialize()
          if data is None:
            abort(400)
        except Exception as e:
          return {'message': "Mojette completion not found"}, 404

        return data, 200

@api.route('/register')
class Register(Resource):
  @api.marshal_with(profile_info)
  @api.expect(user_minimal_model, validate=True)  # Make sure the model is correct for validation
  @api.response(201, 'User added successfully')
  @api.response(409, 'Error creating new user')
  @api.response(500, 'Internal Server Error')
  def post(self):
      """Adds a new user and sends a confirmation email"""
      r = request.json
      username = r["username"]
      email = r["email"]

      if db_manager.ReadUserByUsername(username):
          abort(409, "username already exists")
      if db_manager.ReadUserByEmail(email):
          abort(409, "email already exists")

      password_bytes = r["password"].encode('utf-8')
      password_hash = bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode('utf-8')
      confirmation_token = ''.join(random.choices(string.ascii_uppercase + string.digits, k=32))
      # TODO : mabye use a JWT token like for password reset ?
      # this would require changing all the previously generated tokens
      # or keeping them and having a different logic for them
      try:
        new_user = User(username=username,
                        password_hash=password_hash,
                        email=email,
                        confirmation_token=confirmation_token,
                        role="User")
        data = db_manager.CreateUser(new_user)

        sendConfirmationTemplate(email, data.id, confirmation_token)
        return data, 201

      except Exception as e:
        abort(500, "An error occurred during user creation")


@api.route('/reset_password_request')
class ResetPasswordRequest(Resource):
    @api.response(500, 'Internal Server Error')
    def post(self):
        """Adds a new user and sends a confirmation email"""
        r = request.json
        email = r["email"]
        SECRET_KEY = os.getenv('SECRET_KEY')
        if not SECRET_KEY:
          abort(500, 'SECRET_KEY not set in environment variables')
        if not email:
          abort(400, 'Incomplete JSON body')
        user = db_manager.ReadUserByEmail(email)
        if user is None:
          # Don't tell if the email is not registered
          return {'message': "OK"}, 200
        expiration_time = datetime.datetime.now(
            datetime.timezone.utc) + datetime.timedelta(hours=24)
        token = jwt.encode({
            'email': email,
            'exp': expiration_time,
        }, SECRET_KEY, algorithm='HS256')
        db_manager.UpdateUser(user.id, {'password_reset_token': token})
        sendPasswordResetTemplate(email, token)
        return {'message': "OK"}, 200


@api.route('/reset_password/<string:token>')
class ResetPassword(Resource):
    @api.response(500, 'Internal Server Error')
    def post(self, token):
        """Adds a new user and sends a confirmation email"""
        r = request.json
        password = r["password"].encode('utf-8')
        SECRET_KEY = os.getenv('SECRET_KEY')
        if not SECRET_KEY:
          abort(500, 'SECRET_KEY not set in environment variables')
        if not password:
          abort(400, 'Incomplete JSON body')
        try:
          decoded = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
          email = decoded['email']
          expiration_time = decoded['exp']
          if datetime.datetime.now(datetime.timezone.utc) > datetime.datetime.fromtimestamp(expiration_time, datetime.timezone.utc):
            abort(401, 'Token expired')
          user = db_manager.ReadUserByEmail(email)
          if user is None:
            abort(404, 'User not found')
          hashed_password = bcrypt.hashpw(
              password, bcrypt.gensalt()).decode('utf-8')
          db_manager.UpdateUser(user.id, {'password_hash': hashed_password})
        except jwt.ExpiredSignatureError:
          abort(401, 'Token expired')
        except jwt.InvalidTokenError:
          abort(401, 'Invalid token')
        except Exception as e:
          print(e)
          abort(500, 'Internal Server Error')
        return {'message': "OK"}, 200

def is_email(identifier: str) -> bool:
    return re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", identifier) is not None


@api.route('/user/<int:user_id>/export-data')
class ExportUserData(Resource):
    @api.response(200, 'User data exported successfully')
    @api.response(401, 'Unauthorized')
    @api.response(404, 'User not found')
    @api.response(500, 'Internal Server Error')
    def get(self, user_id):
        """Export all user data in JSON format (RGPD compliance)"""
        try:
            # Get token from Authorization header
            auth_header = request.headers.get('Authorization', '')
            if not auth_header:
                # Log failed request
                db_manager.CreateUserDataRequest(
                    UserDataRequest(user_id=user_id, status='failed', extra='Missing authorization token')
                )
                abort(401, 'Missing authorization token')

            token = auth_header
            if auth_header.startswith('Bearer '):
                token = auth_header[7:]

            # Decode token manually
            SECRET_KEY = os.getenv('SECRET_KEY')
            if not SECRET_KEY:
                db_manager.CreateUserDataRequest(
                    UserDataRequest(user_id=user_id, status='failed', extra='SECRET_KEY not configured')
                )
                abort(500, 'SECRET_KEY not set in environment variables')

            try:
                decoded = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
                token_user_id = decoded.get('user_id')
            except jwt.ExpiredSignatureError:
                db_manager.CreateUserDataRequest(
                    UserDataRequest(user_id=user_id, status='failed', extra='Token expired')
                )
                abort(401, 'Token expired')
            except jwt.InvalidTokenError:
                db_manager.CreateUserDataRequest(
                    UserDataRequest(user_id=user_id, status='failed', extra='Invalid token')
                )
                abort(401, 'Invalid token')

            # Check if requesting user is the same as the user being exported or is admin
            user = db_manager.ReadUserById(token_user_id)
            if not user:
                db_manager.CreateUserDataRequest(
                    UserDataRequest(user_id=user_id, status='failed', extra='Token user not found')
                )
                abort(401, 'Unauthorized')

            is_admin = user.role == 'Admin'
            if token_user_id != user_id and not is_admin:
                db_manager.CreateUserDataRequest(
                    UserDataRequest(user_id=user_id, status='failed', extra='Unauthorized - can only export own data')
                )
                abort(401, 'Unauthorized - can only export own data')

            # Get the target user's data
            target_user = db_manager.ReadUserById(user_id)
            if not target_user:
                db_manager.CreateUserDataRequest(
                    UserDataRequest(user_id=user_id, status='failed', extra='User not found')
                )
                abort(404, 'User not found')

            # Export data as JSON
            json_data = create_user_export_json(user_id)

            # Check if there was an error in the export
            if 'error' in json_data:
                db_manager.CreateUserDataRequest(
                    UserDataRequest(user_id=user_id, status='failed', extra=json_data.get('error', 'Unknown error'))
                )
                abort(500, f'Error exporting data: {json_data.get("error")}')

            # Log successful request
            db_manager.CreateUserDataRequest(
                UserDataRequest(user_id=user_id, status='completed')
            )

            # Return as JSON file download
            from io import BytesIO
            json_bytes = BytesIO(json_data.encode('utf-8'))

            return send_file(
                json_bytes,
                mimetype='application/json',
                as_attachment=True,
                download_name=f'user_data_{user_id}_{datetime.datetime.now().strftime("%Y%m%d")}.json'
            )

        except Exception as e:
            import traceback
            print(f"Error exporting user data: {str(e)}")
            traceback.print_exc()
            # Log the error
            try:
                db_manager.CreateUserDataRequest(
                    UserDataRequest(user_id=user_id, status='failed', extra=str(e))
                )
            except:
                pass
            abort(500, f'Internal Server Error: {str(e)}')


@api.route('/user/<int:user_id>/delete-account')
class DeleteUserAccount(Resource):
    @api.response(200, 'User account deleted successfully')
    @api.response(401, 'Unauthorized')
    @api.response(404, 'User not found')
    @api.response(500, 'Internal Server Error')
    def delete(self, user_id):
        """Delete user account by anonymizing user data (RGPD compliance)"""
        try:
            # Get token from Authorization header
            auth_header = request.headers.get('Authorization', '')
            if not auth_header:
                # Log failed deletion request
                db_manager.CreateUserDataDeletion(
                    UserDataDeletion(user_id=user_id, status='failed', extra='Missing authorization token')
                )
                abort(401, 'Missing authorization token')

            token = auth_header
            if auth_header.startswith('Bearer '):
                token = auth_header[7:]

            # Decode token manually
            SECRET_KEY = os.getenv('SECRET_KEY')
            if not SECRET_KEY:
                db_manager.CreateUserDataDeletion(
                    UserDataDeletion(user_id=user_id, status='failed', extra='SECRET_KEY not configured')
                )
                abort(500, 'SECRET_KEY not set in environment variables')

            try:
                decoded = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
                token_user_id = decoded.get('user_id')
            except jwt.ExpiredSignatureError:
                db_manager.CreateUserDataDeletion(
                    UserDataDeletion(user_id=user_id, status='failed', extra='Token expired')
                )
                abort(401, 'Token expired')
            except jwt.InvalidTokenError:
                db_manager.CreateUserDataDeletion(
                    UserDataDeletion(user_id=user_id, status='failed', extra='Invalid token')
                )
                abort(401, 'Invalid token')

            # Check if requesting user is the same as the user being deleted or is admin
            user = db_manager.ReadUserById(token_user_id)
            if not user:
                db_manager.CreateUserDataDeletion(
                    UserDataDeletion(user_id=user_id, status='failed', extra='Token user not found')
                )
                abort(401, 'Unauthorized')

            is_admin = user.role == 'Admin'
            if token_user_id != user_id and not is_admin:
                db_manager.CreateUserDataDeletion(
                    UserDataDeletion(user_id=user_id, status='failed', extra='Unauthorized - can only delete own account')
                )
                abort(401, 'Unauthorized - can only delete own account')

            # Get the target user's data
            target_user = db_manager.ReadUserById(user_id)
            if not target_user:
                db_manager.CreateUserDataDeletion(
                    UserDataDeletion(user_id=user_id, status='failed', extra='User not found')
                )
                abort(404, 'User not found')

            # Create deletion record with pending status
            deletion_record = UserDataDeletion(user_id=user_id, status='pending')
            db_manager.CreateUserDataDeletion(deletion_record)

            # Anonymize user data: set username and email to UUIDs, mark as deleted
            anonymized_username = f'deleted_{uuid.uuid4().hex[:12]}'
            anonymized_email = f'deleted_{uuid.uuid4().hex[:12]}@anonymized.local'

            try:
                # Update user with anonymized data and deleted flag
                target_user.username = anonymized_username
                target_user.email = anonymized_email
                target_user.deleted = True
                db_manager.db.session.commit()

                # Log successful deletion
                deletion_record.status = 'completed'
                db_manager.db.session.commit()

                return {
                    'message': 'User account has been deleted and anonymized successfully',
                    'user_id': user_id
                }, 200

            except Exception as e:
                db_manager.db.session.rollback()
                deletion_record.status = 'failed'
                deletion_record.extra = f'Error during anonymization: {str(e)}'
                db_manager.db.session.commit()
                print(f"Error anonymizing user: {str(e)}")
                abort(500, f'Error deleting account: {str(e)}')

        except Exception as e:
            import traceback
            print(f"Error deleting user account: {str(e)}")
            traceback.print_exc()
            # Log the error
            try:
                db_manager.CreateUserDataDeletion(
                    UserDataDeletion(user_id=user_id, status='failed', extra=str(e))
                )
            except:
                pass
            abort(500, f'Internal Server Error: {str(e)}')
