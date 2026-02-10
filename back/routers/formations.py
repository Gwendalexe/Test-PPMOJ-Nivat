from datetime import datetime

import database.models as models
from core.models import (formation_category_model, formation_extended_model,
                         formation_model, formation_session_model, user_model)
from database.database import DatabaseManager
from flask import abort, request, send_from_directory
from flask_restx import Namespace, Resource, fields
import werkzeug
import os
from utils.image_utils import upload_image_with_compression, create_lowered_image
from utils.discord_webhook import discord_webhook

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'static', 'formation_images')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

api = Namespace('formations', description='Formation related operations')


db_manager = DatabaseManager()
from utils.decorators import token_required
from utils.token import decode_token


@api.route('')
class FormationList(Resource):
    @api.marshal_list_with(formation_model)
    @api.response(401, 'User token invalid')
    @token_required
    def get(self):
        '''List all formation category'''
        try:
            data = models.Formation.serialize_list(db_manager.ReadFormations())
        except Exception as e:
            print(e)
            return {'message': "Formation category not found"}, 404
        return data, 200

    @api.expect(formation_model, validate=True)
    @api.response(401, 'User token invalid')
    @api.response(500, 'Internal Server Error')
    @token_required
    def post(self):
        '''Create formation'''
        try:
            user_id = decode_token(request.headers.get('Authorization'))[
                "user_id"]
            if not user_id or not db_manager.UserIsAdmin(user_id):
                return {'message': "User is not admin"}, 401
            data = request.json
            formation = db_manager.CreateFormation(data)
        except Exception as e:
            print(e)
            return {'message': "Formation not found"}, 404
        return formation.serialize(), 200


@api.route('/calendar')
class FormationCalendar(Resource):
    @api.marshal_list_with(formation_extended_model)
    @api.response(401, 'User token invalid')
    def get(self):
        '''Calendar'''
        try:

            token = request.headers.get('Authorization')
            if token is not None:
                user_id = decode_token(token)["user_id"]
            else:
                user_id = None

            data = models.Serializer.serialize_list_row(
                db_manager.ReadFormationsCalendar())
            ret = {}
            for formation in data:
                if user_id is not None:
                    owned = db_manager.FormationOwnedByUser(
                        user_id, formation['id'])
                    formation['owned'] = owned
                else:
                    formation['owned'] = False
                formation['live_link'] = None
                formation['replay_link'] = None
                # solution un peu hacky mais il faudrait revoir la requete calendrier a termes
                if formation['id'] not in ret.keys():
                    ret[formation['id']] = {
                        'id': formation['id'],
                        'name': formation['name'],
                        'category': formation['category'],
                        'description': formation['description'],
                        'price': formation['price'],
                        'img_link': formation['img_link'],
                        'sessions': []
                    }
                ret[formation['id']]['sessions'].append({
                    'formation_id': formation['id'],
                    'delivery_date': formation['delivery_date'],
                    'duration_minutes': formation['duration_minutes'],
                    'speaker': formation['speaker'],
                    'live_link': formation['live_link'],
                    'replay_link': formation['replay_link'],
                })

        except Exception as e:
            print(e)
            return {'message': "Formation category not found"}, 404
        return list(ret.values()), 200


@api.route('/<int:formation_id>')
class Formation(Resource):
    @api.marshal_list_with(formation_extended_model)
    @api.response(401, 'User token invalid')
    @api.response(500, 'Internal Server Error')
    @token_required
    def get(self, formation_id):
        '''Retrieve one formation by id'''

        try:
            formation_obj = db_manager.ReadFormationById(formation_id)
            if formation_obj is None:
                abort(404)
            token = request.headers.get('Authorization')
            user_id = decode_token(token)["user_id"]
            admin = db_manager.UserIsAdmin(user_id) if user_id else False
            if not admin and not formation_obj.displayed:
                abort(404, "Formation not found")
            formation = formation_obj.serialize()
            owned = db_manager.FormationOwnedByUser(user_id, formation_id)
            formation['owned'] = owned
            sessions = models.Serializer.serialize_list(
                db_manager.ReadFormationSessions(formation_id))

            formation['sessions'] = []
            for session in sessions:
                if not owned and not admin:
                    session['live_link'] = None
                    session['replay_link'] = None
                formation['sessions'].append(session)

        except Exception as e:
            print(e)
            return {'message': "Mojette not found"}, 404
        return formation, 200

    @api.expect(formation_model, validate=False)
    @api.response(401, 'User token invalid')
    @api.response(500, 'Internal Server Error')
    @token_required
    def put(self, formation_id):
        '''Update formation'''
        try:
            print("PUT")
            user_id = decode_token(request.headers.get('Authorization'))[
                "user_id"]
            if not user_id or not db_manager.UserIsAdmin(user_id):
                return {'message': "User is not admin"}, 401
            data = request.json
            db_manager.UpdateFormation(formation_id, data)
        except Exception as e:
            print(e)
            return {'message': "Formation not found"}, 404
        return {'message': "Formation updated"}, 200

    @api.response(401, 'User token invalid')
    @api.response(500, 'Internal Server Error')
    @token_required
    def delete(self, formation_id):
        '''Delete formation'''
        try:
            user_id = decode_token(request.headers.get('Authorization'))[
                "user_id"]
            if not user_id or not db_manager.UserIsAdmin(user_id):
                return {'message': "User is not admin"}, 401
            db_manager.DeleteFormation(formation_id)
        except Exception as e:
            print(e)
            return {'message': "Formation not found"}, 404
        return {'message': "Formation deleted"}, 200


@api.route('/<int:formation_id>/sessions')
class FormationSessions(Resource):
    @api.expect(formation_session_model, validate=True)
    @api.marshal_with(formation_session_model)
    @api.response(401, 'User token invalid')
    @api.response(500, 'Internal Server Error')
    @token_required
    def post(self, formation_id):
        '''Create formation session'''
        try:
            user_id = decode_token(request.headers.get('Authorization'))[
                "user_id"]
            if not user_id or not db_manager.UserIsAdmin(user_id):
                return {'message': "User is not admin"}, 401
            data = request.json
            fmt = '%Y-%m-%dT%H:%M:%S.%fZ'  # iso string format
            data['delivery_date'] = datetime.strptime(
                data['delivery_date'], fmt)
            session = db_manager.CreateFormationSession(formation_id, data)
        except Exception as e:
            print(e)
            return {'message': "Formation not found"}, 404
        return session, 200


@api.route('/<int:formation_id>/sessions/<int:formation_availability_id>')
class FormationSession(Resource):
    @api.expect(formation_session_model, validate=True)
    @api.response(401, 'User token invalid')
    @token_required
    def put(self, formation_id, formation_availability_id):
        '''Update formation session'''
        try:
            user_id = decode_token(request.headers.get('Authorization'))[
                "user_id"]
            if not user_id or not db_manager.UserIsAdmin(user_id):
                return {'message': "User is not admin"}, 401
            data = request.json
            fmt = '%Y-%m-%dT%H:%M:%S.%fZ'  # iso string format
            data['delivery_date'] = datetime.strptime(
                data['delivery_date'], fmt)
            db_manager.UpdateFormationSession(formation_availability_id, data)
        except Exception as e:
            print(e)
            return {'message': "Formation not found"}, 404
        return {'message': "Formation session updated"}, 200

    @api.response(401, 'User token invalid')
    @token_required
    def delete(self, formation_id, formation_availability_id):
        '''Delete formation session'''
        try:
            user_id = decode_token(request.headers.get('Authorization'))[
                "user_id"]
            if not user_id or not db_manager.UserIsAdmin(user_id):
                return {'message': "User is not admin"}, 401
            db_manager.DeleteFormationSession(formation_availability_id)
        except Exception as e:
            print(e)
            return {'message': "Formation not found"}, 404
        return {'message': "Formation session deleted"}, 200


@api.route('/<int:formation_id>/next')
class NextFormation(Resource):
    @api.marshal_with(formation_session_model)
    @api.response(401, 'User token invalid')
    @api.response(500, 'Internal Server Error')
    @token_required
    def get(self, formation_id):
        '''Get next formation'''
        try:
            data = db_manager.nextSession(formation_id)
        except Exception as e:
            print(e)
            return {'message': "Formation not found"}, 404
        return data, 200


@api.route('/<int:formation_id>/users')
class FormationUsers(Resource):
    @api.marshal_list_with(user_model)
    @api.response(401, 'User token invalid')
    @token_required
    def get(self, formation_id):
        '''Get formation users'''
        try:
            token_user_id = decode_token(
                request.headers.get('Authorization'))["user_id"]
            if not token_user_id or not db_manager.UserIsAdmin(token_user_id):
                return {'message': "User is not admin"}, 401
            data = models.Serializer.serialize_list(
                db_manager.ReadFormationUsers(formation_id))
        except Exception as e:
            print(e)
            return {'message': "Formation not found"}, 404
        return data, 200


@api.route('/<int:formation_id>/buy')
class FormationBuy(Resource):
    @api.response(401, 'User token invalid')
    @api.response(500, 'Internal Server Error')
    @token_required
    def post(self, formation_id):
        '''Buy a formation'''
        try:
            token = request.headers.get('Authorization')
            user_id = decode_token(token)["user_id"]
            user = db_manager.ReadUserById(user_id)
            formation = db_manager.ReadFormationById(formation_id)

            # Record the purchase
            db_manager.BuyFormation(user_id, formation_id)

            # Send Discord notification
            if user and formation:
                discord_webhook.send_purchase_notification(
                    username=user.username,
                    formation_name=formation.name,
                    purchase_type='token_coin',
                    amount=formation.price,
                    user_id=user_id,
                )
        except Exception as e:
            print(e)
            return {'message': "Formation not found"}, 404
        return {'message': "Formation bought"}, 200


@api.route('/<int:formation_id>/buy/<int:user_id>')
class FormationBuy(Resource):
    @api.response(401, 'User token invalid')
    @api.response(500, 'Internal Server Error')
    @token_required
    def post(self, formation_id, user_id):
        '''Buy a formation for a user (admin only)'''
        try:
            token = request.headers.get('Authorization')
            token_user_id = decode_token(token)["user_id"]
            if not token_user_id or not db_manager.UserIsAdmin(token_user_id):
                return {'message': "User is not admin"}, 401

            user = db_manager.ReadUserById(user_id)
            formation = db_manager.ReadFormationById(formation_id)

            # Record the purchase
            db_manager.BuyFormation(user_id, formation_id, pay=False)

            # Send Discord notification
            if user and formation:
                discord_webhook.send_purchase_notification(
                    username=user.username,
                    formation_name=formation.name,
                    purchase_type='token_coin',
                    amount=0,  # Admin gift
                    user_id=user_id,
                )
        except Exception as e:
            print(e)
            return {'message': "Formation not found"}, 404
        return {'message': "Formation bought"}, 200

@api.route('/category')
class FormationCategoryList(Resource):
    @api.marshal_list_with(formation_category_model)
    @api.response(401, 'User token invalid')
    @token_required
    def get(self):
        '''List all formation category'''
        try:
            data = models.Serializer.serialize_list(
                db_manager.ReadFormationCategories())
        except Exception as e:
            print(e)
            return {'message': "Formation category not found"}, 404
        return data, 200


@api.route('/category/<category_code>')
class FormationCategory(Resource):
    @api.marshal_with(formation_category_model)
    @api.response(401, 'User token invalid')
    @token_required
    def get(self, category_code):
        '''Get formation category'''
        try:
            data = db_manager.ReadFormationCategoryByCode(
                category_code).serialize()
        except Exception as e:
            print(e)
            return {'message': "Formation category not found"}, 404
        return data, 200

    @api.expect(formation_category_model, validate=True)
    @api.response(401, 'User token invalid')
    @token_required
    def put(self, category_code):
        '''Update formation category'''
        try:
            user_id = decode_token(request.headers.get('Authorization'))[
                "user_id"]
            if not user_id or not db_manager.UserIsAdmin(user_id):
                return {'message': "User is not admin"}, 401
            data = request.json
            db_manager.UpdateFormationCategory(category_code, data)
        except Exception as e:
            print(e)
            return {'message': "Formation category not found"}, 404
        return {'message': "Formation category updated"}, 200



@api.route('/code/<category_code>')
class FormationCategoryFormations(Resource):
    @api.marshal_list_with(formation_model)
    @api.response(401, 'User token invalid')
    @token_required
    def get(self, category_code):
        '''Get formation category formations'''
        try:
            token = request.headers.get('Authorization')
            user_id = decode_token(token)["user_id"]
            is_admin = db_manager.UserIsAdmin(user_id) if user_id else False
            formations = db_manager.ReadFormationsByCategoryCode(category_code, admin=is_admin)
            data = models.Serializer.serialize_list(formations)

            # Replace image URLs with lowered versions
            for formation in data:
                if formation.get('img_link'):
                    # Extract filename from path like '/formations/image/filename.jpg'
                    img_link = formation['img_link']
                    if img_link.startswith('/formations/image/'):
                        filename = img_link.replace('/formations/image/', '')
                        # Construct lowered URL
                        formation['img_link'] = f'/formations/image/lowered/{filename}'

        except Exception as e:
            print(e)
            return {'message': "Formation category not found"}, 404
        return data, 200


@api.route('/upload-image')
class FormationImageUpload(Resource):
    @api.response(201, 'Image uploaded')
    @api.response(400, 'No image file')
    @token_required
    def post(self):
        if 'image' not in request.files:
            return {'message': 'No image file found.'}, 400
        file: werkzeug.datastructures.FileStorage = request.files['image']
        return upload_image_with_compression(file, UPLOAD_FOLDER, '/formations/image')

@api.route('/image/<string:filename>')
class FormationImageServe(Resource):
    def get(self, filename):
        filename_lowered = filename.lower()
        print("Serving image:", filename_lowered)
        try:
            # List all files in the directory and find case-insensitive match
            files = os.listdir(UPLOAD_FOLDER)
            matching_file = next((f for f in files if f.lower().split('.')[0] == filename_lowered.split('.')[0]), None)

            if matching_file is None:
                abort(404, "Image not found")

            return send_from_directory(UPLOAD_FOLDER, matching_file)
        except Exception as e:
            print(e)
            abort(404, "Image not found")

@api.route('/image/lowered/<string:filename>')
class FormationImageServeLowered(Resource):
    def get(self, filename):
        try:
            files = os.listdir(UPLOAD_FOLDER)
            filename_lower = filename.lower()

            # Construct the lowered filename from the original
            base, ext = os.path.splitext(filename_lower)
            lowered_filename = f"{base}_lowered.jpg"

            # Look for existing lowered file
            lowered_file = next((f for f in files if f.lower() == lowered_filename), None)

            # If requesting an SVG, just serve the original (no lowering needed for vector graphics)
            if filename_lower.endswith('.svg'):
                original_file = next((f for f in files if f.lower() == filename_lower), None)
                if original_file:
                    return send_from_directory(UPLOAD_FOLDER, original_file)
                abort(404, "Image not found")

            if lowered_file:
                return send_from_directory(UPLOAD_FOLDER, lowered_file)

            # If lowered doesn't exist, find the original
            original_file = next((f for f in files if f.lower().split('.')[0] == filename_lower.split('.')[0]), None)

            if original_file:
                # Create lowered version from original
                original_path = os.path.join(UPLOAD_FOLDER, original_file)
                lowered_path = create_lowered_image(original_path)

                if lowered_path and os.path.exists(lowered_path):
                    lowered_filename = os.path.basename(lowered_path)
                    return send_from_directory(UPLOAD_FOLDER, lowered_filename)

            abort(404, "Image not found")
        except Exception as e:
            print(e)
            abort(404, "Image not found")
