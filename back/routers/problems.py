import datetime
import json

import database.models as models
from core.models import (completion_response_model, problem_completed_model,
                         problem_extended_model, problem_help_model,
                         problem_model, problem_verification_model,
                         simple_problem_model_with_region)
from database.database import DatabaseManager
from flask import abort, jsonify, request
from flask_restx import Namespace, Resource, fields
from utils.common import get_array_width
from utils.decorators import token_required
from utils.token import decode_token
from utils.validation import (add_problem_to_completed_list,
                              verify_region_solution, verify_standard_solution)

api = Namespace('problems', description='Problems related operations')


db_manager = DatabaseManager()


@api.route('')
class ProblemsList(Resource):
    @api.marshal_list_with(simple_problem_model_with_region)
    @api.response(401, 'User token invalid')
    @api.response(500, 'Internal Server Error')
    @token_required
    def get(self):
        '''List all problems'''
        try:
            data = models.Serializer.serialize_list_row(
                db_manager.ReadProblems())
            for problem in data:
                problem['question'] = problem['question']
                problem['values_list'] = problem['values_list']
                problem['variables'] = problem['variables']
                problem['solution'] = problem['solution']
                nbUnknowns = get_array_width(problem['solution'])
                if (not nbUnknowns):
                    del problem['solution']
                problem['unknowns'] = nbUnknowns
                problem['nb_help'] = sum(
                    [problem['help_1'] != None, problem['help_2'] != None, problem['help_3'] != None])

            if problem is None:
                abort(404)
        except Exception as e:
            print(e)
            return {'message': "Problems not found"}, 404
        return data, 200

    @api.marshal_with(problem_extended_model)
    # Make sure the model is correct for validation
    @api.expect(problem_extended_model, validate=True)
    @api.response(201, 'User added successfully')
    @api.response(500, 'Internal Server Error')
    @token_required
    def post(self):
        """Adds a new problem"""
        # not used currently (for future dashboard use)
        abort(404)
        r = request.json
        try:
            data = db_manager.CreateProblem(r)
        except Exception as e:
            abort(500, str(e))

        return {"message": 'Problem added successfully'}, 201


@api.route('/<int:problem_id>')
class Problem(Resource):
    @api.marshal_with(problem_model)
    @api.response(401, 'User token invalid')
    @api.response(500, 'Internal Server Error')
    @token_required
    def get(self, problem_id):
        '''Retrieve one problem by id'''

        try:
            data = models.Serializer.serialize_row(
                db_manager.ReadProblemById(problem_id))
            data['question'] = data['question']
            data['values_list'] = data['values_list']
            data['solution'] = data['solution']
            data['level'] = data['level']
            nbUnknowns = get_array_width(data['solution'])
            if (not nbUnknowns):
                del data['solution']

            data['unknowns'] = nbUnknowns
            data['variables'] = data['variables']
            data['nb_help'] = sum(
                [data['help_1'] != None, data['help_2'] != None, data['help_3'] != None])
            for i in range(1, data['nb_help'] + 1):
                data['help_{}_cost'.format(
                    i)] = data['reward'] * data['help_{}_percent_cost'.format(i)] / 100
            if data is None:
                abort(404)

        except Exception as e:
            print(e)
            return {'message': "Problem not found"}, 404
        return data, 200


@api.route('/regions')
class Regions(Resource):
    @api.doc('get_all_regions')
    @api.response(200, 'Regions retrieved successfully')
    @api.response(401, 'User token invalid')
    @api.response(403, 'Regions not found')
    @api.response(500, 'Internal Server Error')
    @token_required
    def get(self):
        """Retrieves all regions"""
        try:
            data = models.Region.serialize_list(db_manager.ReadRegions())

            if data is None:
                return "Cannot get regions", 403
            return jsonify(data)
        except Exception as e:
            # Catch all other exceptions and return a server error
            abort(500, f"An error occurred: {str(e)}")


@api.route('/regions/<string:region_code>/departments')
class Departments(Resource):
    @api.doc('get_all_department_for_a_region')
    @api.response(200, 'Regions retrieved successfully')
    @api.response(401, 'User token invalid')
    @api.response(403, 'Regions not found')
    @api.response(500, 'Internal Server Error')
    @token_required
    def get(self, region_code):
        """Retrieves all department for a region"""

        try:
            data = models.Department.serialize_list(
                db_manager.ReadDepartmentsByRegionCode(region_code))
            if data is None:
                return "Cannot get departments", 403
            for dpt in data:
                if type(dpt['zones']) is bytes:  # BDD en prod qui renvoie des bytes
                    dpt['zones'] = dpt['zones'].decode('utf-8')

            return jsonify(data)
        except Exception as e:
            # Catch all other exceptions and return a server error
            abort(500, f"An error occurred: {str(e)}")


@api.route('/completed')
class ProblemCompletedByUser(Resource):
    @api.marshal_list_with(problem_completed_model)
    @api.response(401, 'User token invalid')
    @api.response(500, 'Internal Server Error')
    @token_required
    def get(self):
        '''Retrieve user completed problems'''
        is_user_admin = decode_token(request.headers["Authorization"])['admin']
        user_id = decode_token(request.headers["Authorization"])['user_id']
        try:
            if is_user_admin:
                data = models.ProblemCompleted.serialize_list(
                    db_manager.ReadProblemsCompleted())
            else:
                data = models.Serializer.serialize_list_row(
                    db_manager.ReadProblemsCompletedByUser(user_id))

            if data is None:
                abort(400)
        except Exception as e:
            return {'message': "Problem completion not found"}, 404

        return data, 200


@api.route('/<int:problem_id>/hint/<int:hint_nb>')
class ProblemHint(Resource):
    @api.marshal_with(problem_help_model)
    @api.response(400, 'Not enough Mojettes')
    @api.response(401, 'User token invalid')
    @api.response(500, 'Internal Server Error')
    @token_required
    def get(self, problem_id, hint_nb):
        '''Retrieve one problem hint by '''

        user_id = decode_token(request.headers["Authorization"])['user_id']
        try:
            data = models.Serializer.serialize_row(
                db_manager.ReadProblemById(problem_id))

            if data is None or data['help_{}'.format(hint_nb)] is None:
                abort(404)
        except Exception as e:
            return {'message': "Mojette or hint not found"}, 404

        try:
            help_cost = data['help_{}_percent_cost'.format(hint_nb)]
            mojettes = db_manager.UpdateUserMojettes(
                user_id, -help_cost * data['reward'] / 100)['mojettes']
        except Exception as e:
            return {'message': "Not enough Mojettes"}, 400

        return {
            "help": data['help_{}'.format(hint_nb)],
            "mojettes": mojettes
        }, 200


@api.route('/<int:problem_id>/completed')
class ProblemCompleted(Resource):
    @api.marshal_with(problem_completed_model)
    @api.response(401, 'User token invalid')
    @api.response(500, 'Internal Server Error')
    @token_required
    def get(self, problem_id):
        '''Retrieve if user has completed problem'''

        user_id = decode_token(request.headers["Authorization"])['user_id']
        try:
            data = models.Serializer.serialize_row(
                db_manager.ReadProblemCompletedByPrimaryKey(
                    user_id, problem_id))
            if data is None:
                abort(400)

        except Exception as e:
            print(e)
            return {'message': "Problem completion not found"}, 404

        return data, 200


@api.route('/<int:problem_id>/verify')
class VerifySolution(Resource):
    @api.doc('verify_solution')
    @api.expect(problem_verification_model, validate=True)
    @api.marshal_with(completion_response_model)
    @api.response(200, 'Invalid solution')
    @api.response(201, 'Valid solution')
    @api.response(400, 'Invalid JSON body, "values","indice" and "helps_used" are required')
    @api.response(401, 'User token invalid')
    @api.response(404, 'Problem not found')
    @api.response(500, 'Internal Server Error')
    @token_required
    def post(self, problem_id):
        '''Verify if the provided values match the solution for an enigma'''
        r = request.json
        helps_used = r["helps_used"]

        user_id = decode_token(request.headers["Authorization"])['user_id']
        try:
            data = models.Serializer.serialize_row(
                db_manager.ReadProblemById(problem_id))
            if data is None or data['solution'] is None:
                abort(404)

            solution_values = data['solution']

            verify_function = verify_region_solution if data['type'] == 3 else verify_standard_solution

            if (verify_function(r, solution_values)):
                problem_completed_data = {
                    'problem_id': problem_id,
                    'user_id': user_id,
                    'helps_used': helps_used,
                    'completion_date': datetime.date.today()
                }
                return add_problem_to_completed_list(problem_completed_data)
            return {'reward': 0, 'mojettes': 0}, 200

        except Exception as e:
            abort(500, str(e))
