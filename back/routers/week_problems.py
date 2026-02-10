from flask_restx import Namespace, Resource
from flask import abort
from datetime import date, datetime, timedelta
import json
from database.database import DatabaseManager
from utils.common import get_array_width
from utils.decorators import token_required
import database.models as models
from flask import request
from core.models import model_namespace, completion_response_model, problem_verification_model
from flask_restx import fields
import os
import werkzeug
from flask import send_from_directory
from utils.token import decode_token
from utils.validation import verify_standard_solution
from werkzeug.exceptions import HTTPException
from utils.image_utils import upload_image_with_compression, create_lowered_image

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'static', 'weekproblems')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

api = Namespace('week_problems', description='Weekly problems operations')

db_manager = DatabaseManager()

# Va chercher la date du lundi de cette semaine
def get_monday_of_week(dt):
    return dt - timedelta(days=dt.weekday())

# Define the input model for creation
week_problem_input_model = model_namespace.model('WeekProblemInput', {
    'figure_path': fields.String(required=True),
    'nb_val_to_find': fields.Integer(required=True),
    'problem_statement': fields.String(required=False, description='Statement text to display'),
    'problem_question': fields.String(required=False, description='Question text to display'),
    'variables': fields.Raw(required=True),  # Accepts list/dict.
    'values_list': fields.Raw(required=True),
    'solution': fields.Raw(required=True),
    'date': fields.String(required=True),
    'reward_mojette': fields.Integer(required=False, description='Reward in mojettes', default=0),
    'reward_token_coin': fields.Integer(required=False, description='Reward in token coins', default=0),
})

@api.route('')
# Va chercher tous les problemes de la semaine
class WeekProblemsList(Resource):
    @token_required
    def get(self):
        '''List all week problems (raw, serialized)'''
        try:
            problems = db_manager.ReadWeekProblems()
            data = models.Serializer.serialize_list(problems)

            for wp in data:
                if isinstance(wp.get('date'), date):
                    wp['date'] = wp['date'].isoformat()

                # Les champs JSON sont déjà bons
                wp['variables'] = wp.get('variables', [])
                wp['values_list'] = wp.get('values_list', [])
                wp['solution'] = wp.get('solution', [])

                # Calcul unknowns
                nb_unknowns = get_array_width(wp['solution'])
                if not nb_unknowns:
                    wp.pop('solution', None)
                wp['unknowns'] = nb_unknowns

                # Replace figure_path with lowered version
                if wp.get('figure_path'):
                    figure_path = wp['figure_path']
                    if figure_path.startswith('/week_problems/image/'):
                        filename = figure_path.replace('/week_problems/image/', '')
                        # Construct lowered URL
                        wp['figure_path'] = f'/week_problems/image/lowered/{filename}'

            if not data:
                abort(404)

            return data, 200

        except Exception as e:
            print(e)
            return {'message': "Week problems not found"}, 404

    @token_required
    @api.expect(week_problem_input_model)
    def post(self):
        '''Create a new week problem'''
        try:
            data = request.get_json(force=True)
            new_problem = db_manager.CreateWeekProblem(data)
            serialized = models.Serializer.serialize(new_problem)
            if isinstance(serialized.get('date'), date):
                serialized['date'] = serialized['date'].isoformat()
            return serialized, 201
        except Exception as e:
            print(e)
            return {"error": str(e)}, 400

# Va chercher un problème par id
@api.route('/<int:problem_id>')
class WeekProblemById(Resource):
    @token_required
    def get(self, problem_id):
        '''Get week problem by ID'''
        try:
            problem = db_manager.ReadWeekProblemById(problem_id)
            if not problem:
                abort(404, f"No week problem found with id {problem_id}")
            serialized = models.Serializer.serialize(problem)
            if isinstance(serialized.get('date'), date):
                serialized['date'] = serialized['date'].isoformat()
            serialized['variables'] = serialized.get('variables', [])
            serialized['values_list'] = serialized.get('values_list', [])
            serialized['solution'] = serialized.get('solution', [])
            nb_unknowns = get_array_width(serialized['solution'])
            if not nb_unknowns:
                serialized.pop('solution', None)
            serialized['unknowns'] = nb_unknowns
            return serialized, 200
        except Exception as e:
            print(e)
            abort(500, "Server error while fetching week problem by id")

    @token_required
    @api.expect(week_problem_input_model)
    def put(self, problem_id):
        '''Update week problem by ID'''
        try:
            data = request.get_json(force=True)
            updated = db_manager.UpdateWeekProblem(problem_id, data)
            if not updated:
                abort(404, f"No week problem found with id {problem_id}")
            serialized = models.Serializer.serialize(updated)
            if isinstance(serialized.get('date'), date):
                serialized['date'] = serialized['date'].isoformat()
            return serialized, 200
        except Exception as e:
            print(e)
            return {"error": str(e)}, 400

    @token_required
    def delete(self, problem_id):
        '''Delete week problem by ID'''
        try:
            db_manager.DeleteWeekProblem(problem_id)
            return {"message": "Deleted successfully."}, 204
        except Exception as e:
            print(e)
            return {"error": str(e)}, 400

# Va chercher le probleme de la semaine en cours, ou le plus recent si il n'y en a pas en db pour cette semaine
@api.route('/current')
class CurrentWeekProblem(Resource):
    @token_required
    def get(self):
        '''Get week problem for current week, or most recent if none for this week'''
        try:
            today = date.today()
            monday = get_monday_of_week(today)

            problem = db_manager.ReadWeekProblemByDate(monday)

            if not problem:
                problem = db_manager.ReadMostRecentWeekProblemBeforeDate(today)

            if not problem:
                abort(404, "No week problem found")

            serialized = models.Serializer.serialize(problem)

            if isinstance(serialized.get('date'), date):
                serialized['date'] = serialized['date'].isoformat()

            serialized['variables'] = serialized.get('variables', [])
            serialized['values_list'] = serialized.get('values_list', [])
            serialized['solution'] = serialized.get('solution', [])

            nb_unknowns = get_array_width(serialized['solution'])
            if not nb_unknowns:
                serialized.pop('solution', None)
            serialized['unknowns'] = nb_unknowns

            return serialized, 200

        except Exception as e:
            print(e)
            abort(500, "Server error while fetching current week problem")

@api.route('/upload-image')
class WeekProblemUploadImage(Resource):
    @api.response(201, 'Image uploaded')
    @api.response(400, 'No image file')
    @token_required
    def post(self):
        if 'image' not in request.files:
            return {'message': 'No image file found.'}, 400
        file: werkzeug.datastructures.FileStorage = request.files['image']
        return upload_image_with_compression(file, UPLOAD_FOLDER, '/week_problems/image')

@api.route('/image/<string:filename>')
class WeekProblemImage(Resource):
    def get(self, filename):
        return send_from_directory(UPLOAD_FOLDER, filename)

@api.route('/image/lowered/<string:filename>')
class WeekProblemImageLowered(Resource):
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


@api.route('/<int:problem_id>/verify')
class WeekProblemVerify(Resource):
    @api.doc('verify_week_problem_solution')
    @api.expect(problem_verification_model, validate=True)
    @api.marshal_with(completion_response_model)
    @api.response(200, 'Invalid solution')
    @api.response(201, 'Valid solution')
    @api.response(400, 'Invalid JSON body')
    @api.response(401, 'User token invalid')
    @api.response(404, 'Week problem not found')
    @api.response(500, 'Internal Server Error')
    @token_required
    def post(self, problem_id):
        r = request.json
        user_id = decode_token(request.headers.get('Authorization'))['user_id']
        try:
            problem = db_manager.ReadWeekProblemById(problem_id)
            if not problem or problem.solution is None:
                abort(404, "Week problem not found")

            # verify using shared standard verification
            if verify_standard_solution(r, problem.solution):
                # If already completed, do not award again
                already = db_manager.ReadWeekProblemCompletedByPrimaryKey(user_id, problem_id)
                if already is not None:
                    return {'reward': 0, 'mojettes': 0}, 200
                # award user and create completion row
                reward_mojette = int(getattr(problem, 'reward_mojette', 0) or 0)
                reward_token_coin = int(getattr(problem, 'reward_token_coin', 0) or 0)

                db_manager.CreateWeekProblemCompleted({
                    'user_id': user_id,
                    'week_problem_id': problem_id,
                    'helps_used': r.get('helps_used', 0),
                    'completion_date': datetime.now(),
                })
                db_manager.AddWeekProblemRewardsToUser(user_id, reward_mojette, reward_token_coin)

                return {'reward': reward_token_coin, 'mojettes': reward_mojette}, 201

            return {'reward': 0, 'mojettes': 0}, 200
        except Exception as e:
            # Preserve intended HTTP abort codes (e.g., 404) and only 500 on unexpected errors
            if isinstance(e, HTTPException):
                raise e
            print(e)
            abort(500, str(e))


@api.route('/<int:problem_id>/completed')
class WeekProblemCompleted(Resource):
    @token_required
    def get(self, problem_id):
        '''Check if current user has completed this week problem'''
        try:
            user_id = decode_token(request.headers.get('Authorization'))['user_id']
            completed = db_manager.ReadWeekProblemCompletedByPrimaryKey(user_id, problem_id)
            problem = db_manager.ReadWeekProblemById(problem_id)
            reward_mojette = int(getattr(problem, 'reward_mojette', 0) or 0) if problem else 0
            reward_token_coin = int(getattr(problem, 'reward_token_coin', 0) or 0) if problem else 0
            return {
                'completed': completed is not None,
                'user_id': user_id,
                'problem_id': problem_id,
                'completion_date': completed.completion_date.isoformat() if completed and completed.completion_date else None,
                'helps_used': completed.helps_used if completed else 0,
                'reward_mojette': reward_mojette,
                'reward_token_coin': reward_token_coin,
            }, 200
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            print(e)
            abort(500, str(e))


@api.route('/completed')
class WeekProblemsCompletedList(Resource):
    @token_required
    def get(self):
        '''List week problem IDs completed by current user'''
        try:
            user_id = decode_token(request.headers.get('Authorization'))['user_id']
            ids = db_manager.ReadWeekProblemsCompletedByUser(user_id)
            return {'completed_ids': ids}, 200
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            print(e)
            abort(500, str(e))


@api.route('/<int:problem_id>/completions')
class WeekProblemCompletions(Resource):
    @token_required
    def get(self, problem_id):
        '''List all completions for a given week problem, with user info.'''
        try:
            rows = db_manager.ReadWeekProblemCompletionsByProblem(problem_id)
            # Build a minimal, JSON-serializable payload (avoid raw SQLAlchemy objects)
            data = []
            for row in rows:
                try:
                    completed = row[0]
                    user = row[1]
                except Exception:
                    # Fallback for different row access styles
                    completed = getattr(row, 'WeekProblemCompleted', None) or row[0]
                    user = getattr(row, 'User', None) or row[1]

                item = {
                    'user_id': getattr(completed, 'user_id', None),
                    'username': getattr(user, 'username', None),
                    'completion_date': (
                        completed.completion_date.isoformat()
                        if getattr(completed, 'completion_date', None) else None
                    ),
                    'helps_used': getattr(completed, 'helps_used', 0),
                }
                data.append(item)

            return data, 200
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            print(e)
            abort(500, str(e))
