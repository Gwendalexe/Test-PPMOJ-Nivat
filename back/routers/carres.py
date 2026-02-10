from flask_restx import Namespace, Resource, fields
from flask import request, abort
import datetime

api = Namespace('carres', description='Carres related operations')

from core.models import carre_model, carre_complete_model, carre_completed_model, carre_verification_model, completion_response_model

from utils.decorators import token_required
from utils.token import decode_token
from utils.validation import is_carre_solution_valid, add_carre_to_completed_list

from database.database import DatabaseManager
import database.models as models
db_manager = DatabaseManager()

@api.route('')
class CarreList(Resource):
    @api.marshal_list_with(carre_model)
    @api.response(401, 'User token invalid')    
    # @token_required

    def get(self):
        '''List all carres grid'''
        try:
          data = models.Carre.serialize_list(db_manager.ReadCarres(0))
          for x in data:
            x["carre_list"] = x["carre_list"].split(',')
          if data is None:
            abort(404)
        except Exception as e:
          print(e)
          return {'message': "Carres not found"}, 404
        return data, 200
    
    @api.marshal_with(carre_model)
    @api.expect(carre_model, validate=True)  # Make sure the model is correct for validation
    @api.response(201, 'Carre added successfully')
    @api.response(500, 'Internal Server Error')
    @token_required
    def post(self):
        """Adds a new carre"""
        # not used currently (for future dashboard use)
        abort(404)
        r = request.json
        try:
          game = models.Game.serialize_list(db_manager.ReadGames())
          game_id = next((g['id'] for g in game if g['name'] == 'carre'), None)
          if game_id is None:
            abort(500)
          carre = models.Carre(
            id=r['id'],
            level=r['level'],
            game_id=game_id,
            date=datetime.date.today(),
            published=False,
            height=r['height'],
            width=r['width'],
            carre_list=r['carre_list']
          )
          data = db_manager.CreateCarre(carre)
        except Exception as e:
          abort(500, str(e))

        return {"message": 'Carre added successfully'}, 201

@api.route('/<int:carre_id>')
class Carre(Resource):
    @api.marshal_with(carre_model)
    @api.response(401, 'User token invalid')
    @api.response(500, 'Internal Server Error')
    @token_required

    def get(self, carre_id):
        '''Retrieve one carre by id'''
        data = models.Serializer.serialize_row(db_manager.ReadCarreById(carre_id))
        data['carre_list'] = data['carre_list'].split(',')
        try:
          if data is None:
            abort(404)   

        except Exception as e:
          print(e)
          return {'message': "Carre not found"}, 404
        return data, 200

@api.route('/current')
class CarreCurrent(Resource):
    @api.marshal_with(carre_model)
    @api.response(401, 'User token invalid')    
    @token_required

    def get(self):
        '''Retrieve current carre grid'''          
        try:
          data = models.Serializer.serialize_row(db_manager.ReadFirstCarreNotPublished())
          data['carre_list'] = data['carre_list'].split(',')
          if data is None:
            abort(404)
        except Exception as e:
          print(e)
          return {'message': "Carre not found"}, 404
        return data, 200

@api.route('/random')
class CarreRandom(Resource):
    @api.marshal_with(carre_model)
    @api.response(401, 'User token invalid')    
    @token_required

    def get(self):
        '''Retrieve random carre grid'''          
        try:
          data = models.Serializer.serialize_row(db_manager.ReadRandomCarreNotPublished())
          data['carre_list'] = data['carre_list'].split(',')
          if data is None:
            abort(404)
        except Exception as e:
          print(e)
          return {'message': "Carre not found"}, 404
        return data, 200

@api.route('/complete')
class CarreComplete(Resource):    
    @api.response(401, 'User token invalid')  
    @api.response(201, 'Carre completion added successfully')
    @api.response(500, 'Internal Server Error')
    @api.marshal_list_with(carre_complete_model)
    @token_required
    def get(self):
      '''Retrieve all carres completed'''
      try:
        data = models.CarreCompleted.serialize_list(db_manager.ReadCarresCompleted())
        if data is None:
          abort(404)
      except Exception as e:
        print(e)
        return {'message': "Carres completed not found"}, 404
      return data, 200

@api.route('/<int:carre_id>/completed')
class MojetteCompleted(Resource):
    @api.marshal_with(carre_completed_model)
    @api.response(401, 'User token invalid')
    @api.response(500, 'Internal Server Error')
    @token_required

    def get(self, carre_id):
        '''Retrieve if user has completed carre'''

        user_id = decode_token(request.headers["Authorization"])['user_id']
        try:
          data = db_manager.ReadCarreCompletedByPrimaryKey(user_id, carre_id).serialize()
          if data is None:
            abort(400)
        except Exception as e:
          print(e)
          return {'message': "Carre completion not found"}, 404
        
        return data, 200
    
@api.route('/<int:carre_id>/verify')
class CarreGridCompleted(Resource):
    @api.doc('verify_solution')
    @api.expect(carre_verification_model, validate=True)
    @api.marshal_with(completion_response_model)    
    @api.response(200, 'Invalid solution')
    @api.response(201, 'Valid solution')
    @api.response(400, 'Invalid JSON body, "grid" is required')
    @api.response(401, 'User token invalid')
    @api.response(404, 'Mojette not found')
    @api.response(500, 'Internal Server Error')
    @token_required

    def post(self, carre_id):
        '''Verify if the provided solution is valid for mojette grid'''
        r = request.json
        completion_time = r["completion_time"]

        user_id = decode_token(request.headers["Authorization"])['user_id']
        try:
          data = models.Serializer.serialize_row(db_manager.ReadCarreById(carre_id))
          if data is None:
            return {'message': "Carre not found"}, 404
          
          if is_carre_solution_valid(data, r['solution']):
            carre_completed_data = {
              'carre_id' : carre_id,
              'user_id' : user_id,
              'completion_date' : '"{}"'.format(datetime.date.today()),
              'completion_time' : completion_time
            }

            return add_carre_to_completed_list(carre_completed_data)
          
          return {'reward': 0, 'mojette': 0}, 200
        except Exception as e:
          abort(500, str(e))