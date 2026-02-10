import datetime
import random

import database.models as models
from core.models import (completion_response_model, leaderboard_model,
                         mojette_complete_model, mojette_completed_model,
                         mojette_help_model, mojette_model,
                         mojette_model_with_solution,
                         mojette_verification_model, simple_mojette_model)
from database.database import DatabaseManager
from database.models import Mojette as MojetteModel
from flask import abort, request
from flask_restx import Namespace, Resource
from utils.daily_grid_manager import DailyGridManager
from utils.decorators import token_required
from utils.token import decode_token
from utils.validation import add_mojette_to_completed_list

api = Namespace('mojettes', description='Mojettes related operations')


db_manager = DatabaseManager()


daily_grid_manager = DailyGridManager()


@api.route('')
class MojetteList(Resource):
    @api.marshal_list_with(simple_mojette_model)
    @api.response(401, 'User token invalid')
    @api.doc(params={"level": "Filter grids based on level", "page": "Pagination index"})
    @token_required
    def get(self):
        '''List all mojettes grid'''
        token_decoded = decode_token(request.headers["Authorization"])
        user_id = token_decoded['user_id']
        level = request.args.get('level')
        page = 0 if request.args.get(
            'page') is None else request.args.get('page')
        try:
            if not level:
                data = models.Mojette.serialize_list(
                    db_manager.ReadMojettes(int(page)))
            else:
                data = models.Mojette.serialize_list_row(
                    db_manager.ReadMojettesByLevelAndPage(user_id, int(level), int(page)))
            for mojette in data:
                mojette['solved'] = "user_id" in mojette and mojette['user_id'] is not None
        except Exception:
            abort(404, "Mojettes not found")
        return data, 200

    @api.marshal_with(mojette_model)
    # Make sure the model is correct for validation
    @api.expect(mojette_model_with_solution, validate=True)
    @api.response(201, 'Mojette added successfully')
    @api.response(500, 'Internal Server Error')
    @token_required
    def post(self):
        """Adds a new mojette"""
        # not used currently (for future dashboard use)
        abort(404)
        r = request.json
        try:
            new_mojette = MojetteModel(
                id=r['id'],
                level=r['level'],
                date=datetime.date.today(),
                published=r['published'],
                height=r['height'],
                width=r['width'],
                bin_values=r['bin_values'],
                array_box=r['array_box'],
                nb_bin_down=r['nb_bin_down'],
                nb_bin_left=r['nb_bin_left'],
                nb_bin_right=r['nb_bin_right'],
                solution=r['solution'],
            )
            db_manager.CreateMojette(new_mojette)
        except Exception as e:
            abort(500, str(e))

        return {"message": 'Mojette added successfully'}, 201


@api.route('/<int:mojette_id>')
class Mojette(Resource):
    @api.marshal_with(mojette_model)
    @api.response(401, 'User token invalid')
    @api.response(500, 'Internal Server Error')
    @token_required
    def get(self, mojette_id):
        '''Retrieve one mojette by id'''

        try:
            data = models.Serializer.serialize_row(
                db_manager.ReadMojetteById(mojette_id))
            data['bin_values'] = data['bin_values'].split(',')
            data['array_box'] = data['array_box'].split(' ')
            if data is None:
                abort(404)

        except Exception:
            abort(404, "Mojette not found")
        return data, 200


@api.route('/current')
class MojetteCurrent(Resource):
    @api.marshal_with(mojette_model)
    @api.response(401, 'User token invalid')
    @token_required
    def get(self):
        '''Retrieve current mojette grid'''
        try:
            data = models.Serializer.serialize_row(
                db_manager.ReadFirstMojetteNotPublished())
            if data is None:
                abort(404)
            data['bin_values'] = data['bin_values'].split(',')
            data['array_box'] = data['array_box'].split(' ')
        except Exception:
            abort(404, "Mojette not found")
        return data, 200


@api.route('/complete')
class MojetteCompletedByUser(Resource):
    @api.marshal_list_with(mojette_complete_model)
    @api.response(401, 'User token invalid')
    @api.response(201, 'Mojette completion added successfully')
    @api.response(500, 'Internal Server Error')
    @token_required
    def get(self):
        '''Retrieve user completed mojettes'''

        token_decoded = decode_token(request.headers["Authorization"])
        is_admin = token_decoded['admin']
        user_id = token_decoded['user_id']
        try:
            if is_admin:
                data = models.Serializer.serialize_list(
                    db_manager.ReadMojettesCompleted())
            else:
                data = models.Serializer.serialize_list(
                    db_manager.ReadMojettesCompletedByUser(user_id))
            if data is None:
                abort(404)
        except Exception:
            abort(404, "Mojettes completed not found")
        return data, 200


@api.route('/<int:offset>/level/<int:mojette_level>')
class MojetteByLevel(Resource):
    @api.response(401, 'User token invalid')
    @api.response(201, 'Mojette completion added successfully')
    @api.response(500, 'Internal Server Error')
    @api.marshal_list_with(mojette_model)
    @token_required
    def get(self, offset, mojette_level):
        '''Retrieve mojette grid by level and offset'''
        try:
            data = models.Serializer.serialize_row(
                db_manager.ReadMojetteByLevelAndOffset(mojette_level, offset))
            data['bin_values'] = data['bin_values'].split(',')
            data['array_box'] = data['array_box'].split(' ')
            if data is None:
                abort(404)
        except Exception:
            abort(404, "Mojette not found")
        return data, 200


@api.route('/<int:mojette_id>/hint')
class MojetteHint(Resource):
    @api.marshal_with(mojette_help_model)
    @api.response(400, 'Not enough Mojettes')
    @api.response(401, 'User token invalid')
    @api.response(500, 'Internal Server Error')
    @token_required
    def get(self, mojette_id):
        '''Retrieve one mojette hint by id'''
        user_id = decode_token(request.headers["Authorization"])['user_id']
        try:
            data = models.Serializer.serialize_row(
                db_manager.ReadMojetteById(mojette_id))

            assert data is not None and data['solution'] is not None

            solutionArr = data['solution'].split(',')
            help_cost = data['help_1_percent_cost']
            reward = data['reward']
            randIndex = random.randint(0, len(solutionArr) - 1)
        except Exception:
            abort(404, "Mojette or hint not found")

        try:
            mojettes = db_manager.UpdateUserMojettes(
                user_id, -help_cost * reward / 100).mojettes

        except Exception:
            abort(400, "Not enough Mojettes")

        return {
            "tile": randIndex,
            "value": int(solutionArr[randIndex]),
            "mojettes": mojettes
        }, 200


@api.route('/<int:mojette_id>/completed')
class MojetteCompleted(Resource):
    @api.marshal_with(mojette_completed_model)
    @api.response(401, 'User token invalid')
    @api.response(500, 'Internal Server Error')
    @token_required
    def get(self, mojette_id):
        '''Retrieve if user has completed mojette grid'''

        user_id = decode_token(request.headers["Authorization"])['user_id']
        try:
            data = db_manager.ReadMojetteCompletedByPrimaryKey(
                user_id, mojette_id).serialize()
            assert data is not None
            return data, 200
        except Exception:
            abort(404, "Mojette completion not found")


@api.route('/<int:mojette_id>/verify')
class MojetteGridCompleted(Resource):
    @api.doc('verify_solution')
    @api.expect(mojette_verification_model, validate=True)
    @api.marshal_with(completion_response_model)
    @api.response(200, 'Invalid solution')
    @api.response(201, 'Valid solution')
    @api.response(400, 'Invalid JSON body, "grid" is required')
    @api.response(401, 'User token invalid')
    @api.response(404, 'Mojette not found')
    @api.response(500, 'Internal Server Error')
    @token_required
    def post(self, mojette_id):
        '''Verify if the provided solution is valid for mojette grid'''
        r = request.json
        helps_used = r["helps_used"]
        completion_time = r["completion_time"]

        user_id = decode_token(request.headers["Authorization"])['user_id']
        try:
            data = models.Serializer.serialize_row(
                db_manager.ReadMojetteById(mojette_id))

            if data is None or data['solution'] is None:
                abort(404, "Mojette not found")

            if ([int(x) for x in data['solution'].split(',')] == r['grid']):
                mojette_completed_data = {
                    'grid_id': mojette_id,
                    'user_id': user_id,
                    'helps_used': helps_used,
                    'completion_date': datetime.date.today(),
                    'completion_time': completion_time
                }

                return add_mojette_to_completed_list(mojette_completed_data)

            return {'reward': 5, 'mojettes': 5}, 200
        except Exception as e:
            abort(500, str(e))


@api.route('/<int:mojette_id>/leaderboard')
class Leaderboard(Resource):
    @api.marshal_with(leaderboard_model)
    @api.response(401, 'User token invalid')
    @api.response(500, 'Internal Server Error')
    @api.doc(params={"size": "Number of top players to return (default 10)",
                     "range": "Range of players to return above and below the user (default 2)"})
    @token_required
    def get(self, mojette_id):
        '''
        Récupère le classement des joueurs pour une grille Mojette spécifique.
        Cette route génère un classement personnalisé qui inclut:
        1. Les meilleurs joueurs (top N)
        2. La position de l'utilisateur actuel (si l'utilisateur a un score pour cette grille)
        3. Les joueurs juste au-dessus de l'utilisateur (si non inclus dans le top)
        4. Les joueurs juste en-dessous de l'utilisateur

        Si l'utilisateur n'a pas de score pour cette grille, seul le top du classement est renvoyé,
        et la section 'user' sera None.

        Si aucun joueur n'a de score pour cette grille (données vides), une structure vide
        est renvoyée avec toutes les listes vides et 'user' à None.

        Cette structure permet d'afficher un leaderboard contextualisé qui montre
        à la fois les meilleurs scores et la position relative de l'utilisateur lorsqu'il a participé.

        Args:
            mojette_id (int): ID de la grille Mojette pour laquelle récupérer le classement

        Query Parameters:
            size (int): Nombre de joueurs en tête de classement à retourner (défaut: 10)
            range (int): Nombre de joueurs à afficher au-dessus et en-dessous de
                         l'utilisateur actuel (défaut: 2)

        Returns:
            dict: Contient jusqu'à 4 sections:
                - top: Liste des N meilleurs joueurs (liste vide si aucun score)
                - user: Position et score de l'utilisateur actuel (None si l'utilisateur n'a pas de score)
                - above_user: Joueurs juste au-dessus de l'utilisateur (si non dans le top, vide si user est None)
                - below_user: Joueurs juste en-dessous de l'utilisateur (vide si user est None)
            int: 200 pour succès, même si aucune donnée n'est disponible

        Raises:
            404: Si le classement est introuvable
            401: Si le token utilisateur est invalide
        '''
        user_id = decode_token(request.headers["Authorization"])['user_id']
        try:
            leaderboard_size = request.args.get('size')
            leaderboard_size = int(leaderboard_size) if leaderboard_size is not None else 10
            leaderboard_range = request.args.get('range')
            leaderboard_range = int(leaderboard_range) if leaderboard_range is not None else 2

            data = db_manager.ReadRankedLeaderboard(user_id,
                                                    mojette_id,
                                                    leaderboard_range=leaderboard_range,
                                                    leaderboard_size=leaderboard_size
                                                    )
            if len(data) == 0:
                return {
                    'top': [],
                    'user': None,
                    'above_user': [],
                    'below_user': []
                }, 200
            top = data[:leaderboard_size]
            filtered_users = list(filter(lambda x: x.user_id == user_id, data))
            user_entry = filtered_users[0] if filtered_users else None
            above_user = []
            below_user = []

            if user_entry:
                user_position = user_entry.position
                # On récupère les joueurs au-dessus et en-dessous de l'utilisateur
                if user_position > leaderboard_size:
                    above_user = list(filter(lambda e: e.position < user_position and
                                             e.position >= user_position - leaderboard_range and
                                             e.position > leaderboard_size, data))
                    below_user = list(filter(
                        lambda e: e.position > user_position and e.position <= user_position + leaderboard_range, data))

            return {
                'top': top,
                'user': user_entry,
                'above_user': above_user,
                'below_user': below_user
            }, 200
        except Exception as e:
            print(e)
            abort(404, "Leaderboard not found")

@api.route('/grid/<int:id>')
class MojetteById(Resource):
    @api.marshal_with(mojette_model)
    @api.response(401, 'User token invalid')
    @api.response(404, 'Grid not found')
    @api.response(500, 'Internal Server Error')
    @token_required
    def get(self, id):
        '''
        Récupère une grille Mojette spécifique à partir de son ID.

        Args:
            id (int): ID de la grille Mojette.

        Returns:
            dict: Détails de la grille Mojette.
        '''
        try:
            data = models.Serializer.serialize_row(
                db_manager.ReadMojetteById(id)
            )

            if data is None:
                abort(404, "Grid not found")

            data['bin_values'] = data['bin_values'].split(',') if isinstance(data['bin_values'], str) else data['bin_values']
            data['array_box'] = data['array_box'].split(' ') if isinstance(data['array_box'], str) else data['array_box']

            return data, 200

        except Exception as e:
            abort(500, str(e))
            
@api.route('/daily')
class MojetteDaily(Resource):
    @api.marshal_with(mojette_model)
    @api.response(401, 'User token invalid')
    @api.response(404, 'Daily grid not found')
    @api.response(500, 'Internal Server Error')
    @api.doc(params={"day": "Optional: Specific day of the current month (1-31)"})
    @token_required
    def get(self):
        '''
        Récupère la grille Mojette du jour.

        Cette route utilise le gestionnaire de grilles quotidiennes (DailyGridManager) pour:
        1. Déterminer quelle grille correspond au jour actuel
        2. Vérifier si un nouveau mois a commencé (auquel cas de nouvelles grilles sont générées)
        3. Récupérer et formater les données de la grille

        Query Parameters:
            day (int): Jour spécifique du mois (1-31). Si non spécifié, utilise le jour actuel.

        Returns:
            dict: Les détails de la grille Mojette du jour
            int: 200 pour succès, autre code pour erreur

        Note:
            Chaque mois, un nouvel ensemble de grilles est aléatoirement assigné
            aux jours du mois, stocké dans un fichier JSON.
        '''
        # Récupérer le jour demandé s'il est spécifié, sinon utiliser aujourd'hui
        day_param = request.args.get('day')
        day = int(day_param) if day_param is not None else None

        try:
            # Récupérer l'ID de la grille du jour
            mojette_id = daily_grid_manager.get_daily_grid_id(day)
            if mojette_id == -1:
                abort(404, "Invalid day specified")

            # Récupérer les détails de la grille depuis la base de données
            data = models.Serializer.serialize_row(
                db_manager.ReadMojetteById(mojette_id))

            if data is None:
                abort(404, "Daily grid not found")

            # Formater les données de la réponse
            data['bin_values'] = data['bin_values'].split(',')
            data['array_box'] = data['array_box'].split(' ')

            return data, 200

        except Exception as e:
            abort(500, str(e))


@api.route('/daily/completed')
class MojetteDailyCompleted(Resource):
    @api.response(401, 'User token invalid')
    @api.response(500, 'Internal Server Error')
    @token_required
    def get(self):
        '''
        Récupère la liste des grilles quotidiennes du mois en cours avec leur statut de complétion.

        Cette route permet au front-end d'afficher dans l'interface quelles grilles du jour
        ont déjà été complétées par l'utilisateur connecté. Elle retourne un objet où chaque
        clé est un jour du mois, et la valeur est un booléen indiquant si la grille a été complétée.

        Returns:
            dict: Jours du mois (clés) et leur statut de complétion (valeurs)
            int: 200 pour succès

        Example:
            {
                "1": true,  // La grille du 1er du mois a été complétée
                "2": false, // La grille du 2 n'a pas été complétée
                "3": true,
                ...
            }
        '''
        user_id = decode_token(request.headers["Authorization"])['user_id']

        try:
            # Récupérer les données du mois en cours
            today = datetime.date.today()
            current_month = f"{today.year}-{today.month}"

            # Charger les données des grilles quotidiennes
            daily_data = daily_grid_manager.load_data()

            # Si le mois courant n'est pas encore généré, on le fait maintenant
            if daily_data["current_month"] != current_month:
                daily_grid_manager._generate_monthly_grids(current_month)
                daily_data = daily_grid_manager.load_data()

            # Récupérer les IDs des grilles pour chaque jour du mois
            grids_by_day = daily_data["grids"]

            # Préparer le résultat
            completion_status = {}

            # Pour chaque jour du mois jusqu'à aujourd'hui
            for day in range(1, today.day + 1):
                day_str = str(day)

                # Si ce jour existe dans les grilles quotidiennes
                if day_str in grids_by_day:
                    mojette_id = grids_by_day[day_str]

                    # Vérifier si l'utilisateur a complété cette grille
                    completed = db_manager.ReadMojetteCompletedByPrimaryKey(
                        user_id, mojette_id)
                    completion_status[day_str] = completed is not None

            return completion_status, 200

        except Exception as e:
            print(
                f"Erreur lors de la récupération des grilles quotidiennes complétées: {e}")
            abort(500, str(e))
