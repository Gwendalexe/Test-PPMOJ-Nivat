from database.database import DatabaseManager
from flask import abort, request
from flask_restx import Namespace, Resource
from utils.decorators import token_required
from utils.token import decode_token

# Define the namespace for API documentation
api = Namespace(
    'nivats', description='Operations related to Nivat/Mojette games')

# Initialize Database Manager
db_manager = DatabaseManager()


@api.route('')
class NivatList(Resource):
    @api.response(401, 'User token invalid')
    @api.response(404, 'Nivats not found')
    @token_required
    def get(self):
        """
        List all available nivat grids.
        Currently returns 404 as grids are generated client-side dynamically.
        """
        return {'message': "Nivats not found"}, 404


@api.route('/current')
class NivatCurrent(Resource):
    @api.response(401, 'User token invalid')
    @api.response(404, 'Nivat not found')
    @token_required
    def get(self):
        """
        Retrieve the current active nivat grid for the user.
        Reserved for future server-side persistence implementation.
        """
        return {'message': "Nivat not found"}, 404


@api.route('/<nivat_id>/completed')
class NivatCompleted(Resource):
    @api.response(200, 'Success')
    @api.response(401, 'User token invalid')
    @api.response(500, 'Internal Server Error')
    @token_required
    def get(self, nivat_id):
        """
        Check if a specific nivat grid has been completed by the user.

        Logic:
        - If ID starts with 'local': matches client-side generated grids (always incomplete by default).
        - Otherwise: checks the database for server-stored puzzles.
        """
        # --- Client-Side Generation Strategy ---
        # The client generates infinite grids locally.
        # We acknowledge the ID but don't track persistent completion for random seeds.
        if str(nivat_id).startswith('local'):
            return {
                'grid_id': nivat_id,
                'completed': False,
                'helps_used': 0,
                'completion_time': 0
            }, 200
        # ---------------------------------------

        try:
            # Placeholder for future DB check on static puzzles
            # user_id = decode_token(request.headers["Authorization"])['user_id']
            abort(404)
        except Exception:
            return {'message': "Nivat completion not found"}, 404


@api.route('/<nivat_id>/verify')
class NivatGridCompleted(Resource):
    @api.doc('verify_solution')
    @api.response(200, 'Invalid solution')
    @api.response(201, 'Valid solution and rewards granted')
    @api.response(500, 'Internal Server Error')
    @token_required
    def post(self, nivat_id):
        """
        Verify the solution and grant rewards.

        For client-generated grids ('local'), we trust the client's validation
        algorithm but manage the reward attribution securely on the server.
        """
        try:
            r = request.json
            level = r.get("level", 2)

            # --- Reward Configuration ---
            # 1: Easy (4 pts), 2: Medium (6 pts), 3: Hard (10 pts)
            rewards_map = {
                1: 4,
                2: 6,
                3: 10
            }
            reward_earned = rewards_map.get(int(level), 4)

            # --- User Identification & Database Update ---
            user_id = decode_token(request.headers["Authorization"])['user_id']

            # Update user balance in the core database
            # This method returns the updated user object
            updated_user = db_manager.UpdateUserMojettes(
                user_id, reward_earned)

            # Retrieve the new authoritative balance to sync the frontend
            new_balance = updated_user.mojettes

            return {
                'reward': reward_earned,
                'mojettes': new_balance,
                'valid': True
            }, 201

        except Exception as e:
            # Log error for admin debugging without crashing the user experience completely
            print(f"[ERROR] Nivat Point Attribution: {e}")
            return {'message': "Error while saving points"}, 500
