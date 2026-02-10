from datetime import date, datetime
from typing import List, Optional

from database.models import (Base, Carre, CarreCompleted, CheckoutSession,
                             Department, Formation, FormationAvailability,
                             FormationBought, FormationCategory, Game, Mojette,
                             MojetteCompleted, MojetteShape, Problem,
                             ProblemCompleted, Region, Reward, User, WeekProblem,
                             WeekProblemCompleted, UserDataRequest, UserDataDeletion)
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Column, Row, func

db = SQLAlchemy(model_class=Base)


class DatabaseManager:

    def __init__(self):
        self.db = db

    # USERS
    def ReadUsers(self) -> List[User]:
        return self.db.session.query(User).order_by(User.created_at.desc()).all()

    def ReadUserById(self, id) -> User | None:
        return self.db.session.query(User).filter(User.id == id).first()

    def ReadUserByUsername(self, username) -> User | None:
        return self.db.session.query(User).filter(User.username == username).first()

    def ReadUserByEmail(self, email) -> User | None:
        return self.db.session.query(User).filter(User.email == email).first()

    def CreateUser(self, user: User) -> User:
        self.db.session.add(user)
        self.db.session.commit()
        return user

    def UpdateUser(self, id, user_data) -> User | None:
        self.db.session.query(User).filter(User.id == id).update(user_data)
        self.db.session.commit()

    def UpdateUserMojettes(self, id, mojettes) -> User:
        self.db.session.query(User).filter(User.id == id).update(
            {'mojettes': User.mojettes + mojettes})
        self.db.session.commit()
        return self.db.session.query(User).filter(User.id == id).first()

    def DeleteUser(self, id) -> None:
        user = self.db.session.get(User, id)
        self.db.session.delete(user)
        return

    def UpdateUserConfirmationStatus(self, id, token) -> User | None:
        self.db.session.query(User).filter(
            User.id == id, User.confirmation_token == token).update({'confirmed': True})
        self.db.session.commit()
        return self.db.session.query(User).filter(User.id == id, User.confirmation_token == token).first()

    def UserIsAdmin(self, id) -> bool:
        return self.db.session.query(User).filter(User.id == id, User.role == "Admin").first() is not None

    # GAMES
    def ReadGames(self) -> List[Game]:
        return self.db.session.query(Game).all()

    # WEEK PROBLEMS
    def ReadWeekProblems(self) -> list[WeekProblem]:
        return self.db.session.query(WeekProblem).order_by(WeekProblem.date.asc()).all()

    def ReadWeekProblemById(self, problem_id) -> WeekProblem | None:
        return self.db.session.query(WeekProblem).filter(WeekProblem.id == problem_id, WeekProblem.displayed == True).first()

    def ReadWeekProblemByDate(self, monday_date: date) -> Optional[WeekProblem]:
        return self.db.session.query(WeekProblem).filter(WeekProblem.date == monday_date, WeekProblem.displayed == True).first()

    def ReadMostRecentWeekProblemBeforeDate(self, ref_date: date) -> Optional[WeekProblem]:
        return (
            self.db.session.query(WeekProblem)
            .filter(WeekProblem.date <= ref_date, WeekProblem.displayed == True)
            .order_by(WeekProblem.date.desc())
            .first()
        )

    def CreateWeekProblem(self, problem_data) -> WeekProblem:
        new_week_problem = WeekProblem(
            figure_path=problem_data['figure_path'],
            nb_val_to_find=problem_data['nb_val_to_find'],
            variables=problem_data['variables'],
            values_list=problem_data['values_list'],
            solution=problem_data['solution'],
            date=problem_data['date'],
            displayed=problem_data.get('displayed', True),
            reward_mojette=problem_data.get('reward_mojette', 0),
            reward_token_coin=problem_data.get('reward_token_coin', 0)
        )
        self.db.session.add(new_week_problem)
        self.db.session.commit()
        return new_week_problem

    def UpdateWeekProblem(self, problem_id, update_data) -> 'WeekProblem':
        self.db.session.query(WeekProblem).filter(WeekProblem.id == problem_id).update(update_data)
        self.db.session.commit()
        return self.db.session.query(WeekProblem).filter(WeekProblem.id == problem_id).first()

    def DeleteWeekProblem(self, problem_id) -> None:
        wp = self.db.session.get(WeekProblem, problem_id)
        self.db.session.delete(wp)
        self.db.session.commit()

    def CreateWeekProblemCompleted(self, completed_data) -> WeekProblemCompleted:
        new_completed = WeekProblemCompleted(
            user_id=completed_data['user_id'],
            week_problem_id=completed_data['week_problem_id'],
            helps_used=completed_data.get('helps_used', 0),
        )
        if completed_data.get('completion_date'):
            new_completed.completion_date = completed_data['completion_date']
        # upsert-like: avoid duplicate primary key insert
        existing = self.db.session.query(WeekProblemCompleted).filter(
            WeekProblemCompleted.user_id == new_completed.user_id,
            WeekProblemCompleted.week_problem_id == new_completed.week_problem_id
        ).first()
        if existing is None:
            self.db.session.add(new_completed)
            self.db.session.commit()
            return new_completed
        return existing

    def AddWeekProblemRewardsToUser(self, user_id: int, reward_mojette: int, reward_token_coin: int) -> User:
        # increment user balances atomically
        self.db.session.query(User).filter(User.id == user_id).update({
            User.mojettes: User.mojettes + int(reward_mojette or 0),
            User.token_coin: User.token_coin + int(reward_token_coin or 0)
        })
        self.db.session.commit()
        return self.db.session.query(User).filter(User.id == user_id).first()

    def ReadWeekProblemCompletedByPrimaryKey(self, user_id: int, problem_id: int) -> WeekProblemCompleted | None:
        return (
            self.db.session.query(WeekProblemCompleted)
            .filter(WeekProblemCompleted.user_id == user_id, WeekProblemCompleted.week_problem_id == problem_id)
            .first()
        )

    def ReadWeekProblemsCompletedByUser(self, user_id: int) -> list[int]:
        rows = (
            self.db.session.query(WeekProblemCompleted.week_problem_id)
            .filter(WeekProblemCompleted.user_id == user_id)
            .all()
        )
        return [r[0] for r in rows]

    def ReadWeekProblemCompletionsByProblem(self, problem_id: int) -> list[Row[tuple[WeekProblemCompleted, User]]]:
        """Return all completions for a given week problem, joined with user for display."""
        return (
            self.db.session.query(WeekProblemCompleted, User)
            .select_from(WeekProblemCompleted)
            .join(User, User.id == WeekProblemCompleted.user_id)
            .filter(WeekProblemCompleted.week_problem_id == problem_id)
            .order_by(WeekProblemCompleted.completion_date.asc())
            .all()
        )

    # PROBLEMS
    def ReadProblems(self) -> List[Row[tuple[Problem, Department]]]:
        return self.db.session.query(Problem, Department).join(Department).all()

    def ReadProblemById(self, user_id) -> Row[tuple[Problem, Game, Reward]] | None:
        return self.db.session.query(Problem, Reward).join(Reward, Reward.game == Problem.game).filter(Problem.id == user_id).first()

    def ReadProblemSolutionById(self, user_id) -> Problem | None:
        return self.db.session.query(Problem.solution).filter(Problem.id == user_id).first()

    def ReadProblemNthHelpCost(self, problem_id, help_number: int) -> int | None:
        if ([1, 2, 3].count(help_number) == 0):
            raise ValueError("help_number must be between 1 and 3")
        column_to_query: Column[int] = getattr(
            Reward, 'help_{}_percent_cost'.format(help_number))
        row = self.db.session.query(column_to_query).join(
            Problem).filter(Problem.id == problem_id).first()
        if (row is None):
            return None
        return row.tuple()[0]

    def ReadProblemsCompleted(self) -> List[ProblemCompleted]:
        return self.db.session.query(ProblemCompleted).all()

    def ReadProblemCompletedByPrimaryKey(self, user_id, problem_id) -> Row[tuple[ProblemCompleted, Reward]] | None:
        return (
            self.db.session.query(ProblemCompleted, Reward)
            .select_from(ProblemCompleted)
            .join(Problem)
            .join(Reward, Reward.game == Problem.game)
            .join(Department)
            .filter(ProblemCompleted.user_id == user_id, ProblemCompleted.problem_id == problem_id)
            .first()
        )

    def ReadProblemsCompletedByUser(self, user_id) -> List[Row[tuple[Problem, ProblemCompleted, Department]]]:
        return self.db.session.query(Problem, ProblemCompleted, Department).select_from(ProblemCompleted).join(Problem, ProblemCompleted.problem_id == Problem.id, isouter=True).join(Department, Department.number == Problem.department).filter(ProblemCompleted.user_id == user_id).all()

    # TODO : change problem_data to a ProblemCompleted object
    def CreateProblemCompleted(self, problem_data) -> ProblemCompleted:
        new_problem_completed = ProblemCompleted(
            user_id=problem_data['user_id'],
            problem_id=problem_data['problem_id'],
            helps_used=problem_data['helps_used'],
        )
        if problem_data.get('completion_date'):
            new_problem_completed.completion_date = problem_data['completion_date']
        self.db.session.add(new_problem_completed)
        self.db.session.commit()
        return new_problem_completed

    def ReadRegions(self) -> List[Region]:
        return self.db.session.query(Region).all()

    def ReadDepartmentsByRegionCode(self, region_code) -> List[Department]:
        return self.db.session.query(Department).filter(Department.region == region_code).all()

    def ReadProblemReward(self, probleme_id) -> int | None:
        row = self.db.session.query(Reward.reward).select_from(Reward).join(
            Problem, Reward.game == Problem.game and Reward.level == Problem.level).filter(Problem.id == probleme_id).first()
        if (row is None):
            return None
        return row.tuple()[0]

    # MOJETTES
    def ReadMojettes(self, page=0) -> List[Mojette]:
        return self.db.session.query(Mojette).limit(30).offset(page * 30).all()

    def ReadMojettesByLevelAndPage(self, user_id, level, page) -> List[Row[tuple[Mojette, MojetteCompleted]]]:
        return (
            self.db.session.query(Mojette, MojetteCompleted)
            .select_from(Mojette)
            .join(MojetteCompleted, (
                (Mojette.id == MojetteCompleted.grid_id) &
                (MojetteCompleted.user_id == user_id)),
                isouter=True
            )
            .filter(Mojette.level == level)
            .limit(30)
            .offset(page * 30)
            .all()
        )

    # the order of the tuple is important, we want the ID of mojette, not mojetteShape
    def ReadFirstMojetteNotPublished(self) -> Row[tuple[MojetteShape, Mojette, Reward]] | None:
        return self.db.session.query(
            MojetteShape, Mojette, Reward).select_from(Mojette).join(MojetteShape).join(
            Reward, Reward.game == Mojette.game).filter(
            Mojette.published == False).first()

    # the order of the tuple is important, we want the ID of mojette, not mojetteShape
    def ReadMojetteById(self, id) -> Row[tuple[MojetteShape, Mojette, Reward]] | None:
        return (
            self.db.session.query(MojetteShape, Mojette, Reward)
            .select_from(Mojette)
            .join(MojetteShape)
            .join(Reward, Reward.game == Mojette.game)
            .filter(Mojette.id == id)
            .first()
        )

    # the order of the tuple is important, we want the ID of mojette, not mojetteShape
    def ReadMojetteByLevelAndOffset(self, level, offset) -> Row[tuple[MojetteShape, Mojette, Reward]] | None:
        return (
            self.db.session.query(MojetteShape, Mojette, Reward)
            .select_from(Mojette)
            .join(MojetteShape)
            .join(Reward, (Mojette.level == Reward.level) & (Mojette.game == Reward.game))
            .filter(Mojette.level == level)
            .limit(1)
            .offset(offset)
            .first()
        )

    def ReadMojetteHelpCost(self, id) -> int | None:
        row = (
            self.db.session.query(Reward.help_1_percent_cost)
            .join(
                Mojette)
            .filter(Mojette.id == id)
            .first()
        )
        if (row is None):
            return None
        return row.tuple()[0]

    def CreateMojette(self, mojette: Mojette) -> Mojette:
        self.db.session.add(mojette)
        self.db.session.commit()
        return mojette

    def ReadMojettesCompleted(self) -> List[MojetteCompleted]:
        return self.db.session.query(MojetteCompleted).all()

    def ReadMojettesCompletedByUser(self, user_id) -> List[MojetteCompleted]:
        return self.db.session.query(MojetteCompleted).filter(MojetteCompleted.user_id == user_id).all()

    def ReadMojetteCompletedByPrimaryKey(self, user_id, grid_id) -> MojetteCompleted | None:
        return self.db.session.query(MojetteCompleted).join(Mojette).join(Reward, Reward.game == Mojette.game).filter(MojetteCompleted.user_id == user_id, MojetteCompleted.grid_id == grid_id).first()

    # TODO : change mojette_data to a MojetteCompleted object
    def CreateMojetteCompleted(self, mojette_data) -> MojetteCompleted:
        new_mojette_completed = MojetteCompleted(
            user_id=mojette_data['user_id'],
            grid_id=mojette_data['grid_id'],
            helps_used=mojette_data['helps_used'],
            completion_time=mojette_data['completion_time']
        )
        self.db.session.add(new_mojette_completed)
        self.db.session.commit()
        return new_mojette_completed

    def ReadMojetteReward(self, id) -> int | None:
        row = self.db.session.query(Reward.reward).join(
            Mojette, Mojette.game == Reward.game and Mojette.level == Reward.level).filter(Mojette.id == id).first()
        if (row is None):
            return None
        return row.tuple()[0]

    def ReadRankedLeaderboard(
        self,
        user_id: int,
        grid_id: int,
        base_score: int = 1000,
        points_lost_per_second: int = 1,
        points_lost_per_help: int = 50,
        leaderboard_size=10,
        leaderboard_range=2
    ) -> list[dict] | None:
        """
        Récupère le classement des utilisateurs pour une grille spécifique, incluant :
        - Le top des meilleurs joueurs
        - Les joueurs proches du rang de l'utilisateur spécifié

        Le score est calculé comme :
        score = max(0, base_score - (time_penalty * completion_time) - \
                    (help_penalty * helps_used))

        Args:
            user_id: ID de l'utilisateur de référence
            grid_id: ID de la grille de jeu
            base_score: Score maximal initial (par défaut 1000)
            points_lost_per_second: Points perdus par seconde (par défaut 1)
            points_lost_per_help: Points perdus par aide utilisée (par défaut 50)
            leaderboard_size: Nombre de tops joueurs à retourner (par défaut 10)
            leaderboard_range: Étendue autour du rang de l'utilisateur (par défaut 2)

        Returns:
            Une liste de dictionnaires contenant les infos des joueurs, triée par position,
            ou None si l'utilisateur n'a pas de score.

            Format des données:
            {
                'user_id': int,
                'username': str,
                'completion_time': float,
                'helps_used': int,
                'score': float,
                'position': int
            }
        """
        # Calcul du score
        score_expr = func.greatest(
            0,
            base_score - (points_lost_per_second *
                          MojetteCompleted.completion_time)
                       - (points_lost_per_help * MojetteCompleted.helps_used)
        )

        # Création de la sous-requête pour le classement complet
        ranked_users = (
            self.db.session.query(
                User.id,
                User.username,
                MojetteCompleted.completion_time,
                MojetteCompleted.helps_used,
                score_expr.label('score'),
                func.row_number().over(order_by=score_expr.desc()).label('position')
            )
            .join(MojetteCompleted, User.id == MojetteCompleted.user_id)
            .filter(MojetteCompleted.grid_id == grid_id)
            .subquery()
        )

        # Récupération du rang de l'utilisateur
        user_rank = (
            self.db.session.query(ranked_users.c.position)
            .filter(ranked_users.c.id == user_id)
            .scalar()
        )

        # Définir la condition de filtre en fonction de la présence de l'utilisateur dans le classement
        if user_rank is None:
            # Si l'utilisateur n'est pas dans le classement, renvoyer seulement le top du classement
            filter_condition = (ranked_users.c.position <= leaderboard_size)
        else:
            # Sinon, inclure le top du classement et les joueurs proches du rang de l'utilisateur
            filter_condition = (
                (ranked_users.c.position <= leaderboard_size) |
                (ranked_users.c.position.between(
                    user_rank - leaderboard_range,
                    user_rank + leaderboard_range
                ))
            )

        # Récupération des résultats finaux avec la condition appropriée
        return (
            self.db.session.query(
                ranked_users.c.id.label('user_id'),
                ranked_users.c.username,
                ranked_users.c.completion_time,
                ranked_users.c.helps_used,
                ranked_users.c.score,
                ranked_users.c.position
            )
            .filter(filter_condition)
            .order_by(ranked_users.c.position)
            .limit(leaderboard_size + leaderboard_range * 2 + 1)  # Évite de dépasser le nombre de calculs nécessaires
            .all()
        )

    def ReadRandomMojetteIds(self, count=31) -> List[int]:
        """
        Récupère un nombre spécifié d'IDs de grilles Mojette de manière aléatoire
        parmi celles qui n'ont jamais été complétées.

        Args:
            count: Nombre d'IDs à récupérer

        Returns:
            Liste d'IDs de grilles Mojette sélectionnés aléatoirement
        """
        # On récupère tous les grid_id de la table MojetteCompleted dans une sous-requête
        subquery = self.db.session.query(MojetteCompleted.grid_id).subquery()

        return [
            row[0] for row in self.db.session.query(Mojette.id)
            .join(subquery, Mojette.id == subquery.c.grid_id, isouter=True)
            .filter(subquery.c.grid_id == None)  # Que les grilles non complétées
            .order_by(func.random())  # Aléatoire
            .limit(count)
            .all()
        ]

    # CARRE
    def ReadCarres(self, offset) -> List[Carre]:
        return self.db.session.query(Carre).limit(100).offset(offset).all()

    def ReadFirstCarreNotPublished(self) -> Row[tuple[Carre, Reward]] | None:
        return self.db.session.query(Carre, Reward).select_from(Carre).join(Reward, Reward.game == Carre.game and Reward.level == Carre.level).filter(Carre.published == 0).first()

    def ReadRandomCarreNotPublished(self) -> Row[tuple[Carre, Reward]] | None:
        return self.db.session.query(Carre, Reward).select_from(Carre).join(Reward, Reward.game == Carre.game and Reward.level == Carre.level).filter(Carre.published == 0).order_by(func.random()).limit(1).first()

    def ReadCarreById(self, id) -> Row[tuple[Carre, Reward]] | None:
        return self.db.session.query(Carre, Reward).select_from(Carre).join(Reward, Reward.game == Carre.game and Reward.level == Carre.level).filter(Carre.id == id).first()

    def CreateCarre(self, carre: Carre) -> Carre:
        self.db.session.add(carre)
        self.db.session.commit()
        return carre

    def ReadCarresCompleted(self) -> List[CarreCompleted]:
        return self.db.session.query(CarreCompleted).all()

    def ReadCarreCompletedByPrimaryKey(self, user_id, carre_id) -> CarreCompleted | None:
        return self.db.session.query(CarreCompleted).join(Carre).join(Reward, Reward.game == Carre.game and Reward.level == Carre.level).filter(CarreCompleted.user_id == user_id, CarreCompleted.grid_id == carre_id).first()

    # TODO : change carre_data to a CarreCompleted object
    def CreateCarreCompleted(self, carre_data) -> CarreCompleted:
        new_carre_completed = CarreCompleted(
            user_id=carre_data['user_id'], grid_id=carre_data['carre_id'], completion_time=carre_data['completion_time'])
        self.db.session.add(new_carre_completed)
        self.db.session.commit()
        return new_carre_completed

    def ReadCarreReward(self, carre_id) -> int | None:
        row = self.db.session.query(Reward.reward).join(
            Carre, Carre.game == Reward.game and Carre.level == Reward.level).filter(Carre.id == carre_id).first()
        if (row is None):
            return None
        return row.tuple()[0]

# FORMATIONS

    def ReadFormations(self) -> List[Formation]:
        return self.db.session.query(Formation).all()

    def ReadFormationsCalendar(self) -> List[Row[tuple[Formation, FormationAvailability]]]:
        return self.db.session.query(Formation, FormationAvailability)\
            .select_from(Formation).join(FormationAvailability)\
            .filter(FormationAvailability.delivery_date > datetime.now()) \
            .filter(Formation.displayed == True) \
            .order_by(Formation.id, FormationAvailability.delivery_date.desc()).all()

    def ReadFormationsByCategoryCode(self, category_code, admin=False) -> List[Formation]:
        query = self.db.session.query(Formation).join(FormationCategory).filter(FormationCategory.code == category_code)
        if not admin:
            query = query.filter(Formation.displayed == True)
        return query.all()

    def ReadFormationCategories(self) -> List[FormationCategory]:
        return self.db.session.query(FormationCategory).all()

    def ReadFormationCategoryByCode(self, category_code) -> FormationCategory | None:
        return self.db.session.query(FormationCategory).filter(FormationCategory.code == category_code).first()

    def ReadFormationById(self, formation_id) -> Formation:
        return self.db.session.query(Formation).filter(Formation.id == formation_id).first()

    def ReadFormationSessions(self, formation_id) -> List[FormationAvailability]:
        return self.db.session.query(FormationAvailability).filter(FormationAvailability.formation_id == formation_id).all()

    def nextSession(self, formation_id) -> FormationAvailability | None:
        return self.db.session.query(FormationAvailability).filter(FormationAvailability.formation_id == formation_id, FormationAvailability.delivery_date > datetime.now()).order_by(FormationAvailability.delivery_date).first()

    def BuyFormation(self, user_id, formation_id, pay=True) -> User | None:
        user = self.db.session.query(User).filter(User.id == user_id).first()
        formation = self.db.session.query(Formation).filter(
            Formation.id == formation_id).first()
        if pay:
            if user.token_coin < formation.price:
                raise ValueError("Not enough token coins")
            user.token_coin -= formation.price
        formationBought = FormationBought(
            user_id=user_id, formation_id=formation_id, purchase_date=datetime.now())
        self.db.session.add(formationBought)
        self.db.session.commit()
        return user

    def FormationOwnedByUser(self, user_id, formation_id) -> bool:
        return self.db.session.query(FormationBought).filter(FormationBought.user_id == user_id, FormationBought.formation_id == formation_id).first() is not None

    def ReadFormationUsers(self, formation_id) -> List[User]:
        return self.db.session.query(User).join(FormationBought).filter(FormationBought.formation_id == formation_id).all()

    def UpdateFormationCategory(self, category_code, category_data) -> FormationCategory | None:
        self.db.session.query(FormationCategory).filter(
            FormationCategory.code == category_code).update(category_data)
        self.db.session.commit()
        return self.db.session.query(FormationCategory).filter(FormationCategory.code == category_code).first()

    def UpdateFormation(self, formation_id, formation_data) -> Formation | None:
        self.db.session.query(Formation).filter(
            Formation.id == formation_id).update(formation_data)
        self.db.session.commit()
        return self.db.session.query(Formation).filter(Formation.id == formation_id).first()

    def DeleteFormation(self, formation_id) -> None:
        self.db.session.query(FormationAvailability).filter(
            FormationAvailability.formation_id == formation_id).delete()
        self.db.session.query(FormationBought).filter(
            FormationBought.formation_id == formation_id).delete()
        self.db.session.query(Formation).filter(
            Formation.id == formation_id).delete()
        self.db.session.commit()
        return

    def CreateFormation(self, formation_data) -> Formation:
        new_formation = Formation(
            name=formation_data['name'],
            description=formation_data['description'],
            category=formation_data['category'],
            price=formation_data['price'],
            img_link=formation_data['img_link'],
            document_link=formation_data.get('document_link', ''),
            displayed=formation_data.get('displayed', True)
        )
        self.db.session.add(new_formation)
        self.db.session.commit()
        return new_formation

    def UpdateFormationSession(self, formation_availability_id, session_data) -> FormationAvailability | None:
        self.db.session.query(FormationAvailability).filter(
            FormationAvailability.formation_availability_id == formation_availability_id
        ).update(session_data)
        self.db.session.commit()
        return self.db.session.query(FormationAvailability).filter(FormationAvailability.formation_availability_id == formation_availability_id).first()

    def DeleteFormationSession(self, formation_availability_id) -> None:
        session = self.db.session.get(
            FormationAvailability, formation_availability_id)
        self.db.session.delete(session)
        self.db.session.commit()
        return

    def CreateFormationSession(self, formation_id, session_data) -> FormationAvailability:
        new_session = FormationAvailability(
            formation_id=formation_id,
            delivery_date=session_data['delivery_date'],
            duration_minutes=session_data['duration_minutes'],
            speaker=session_data['speaker'],
            live_link=session_data['live_link'],
            replay_link=session_data['replay_link'],
        )
        self.db.session.add(new_session)
        self.db.session.commit()
        return new_session
# Payment

    def createCheckoutSession(self, checkoutSession: CheckoutSession) -> CheckoutSession:
        self.db.session.add(checkoutSession)
        self.db.session.commit()
        return checkoutSession

    def readCheckoutSession(self, session_id) -> CheckoutSession | None:
        return self.db.session.query(CheckoutSession).filter(CheckoutSession.session_id == session_id).first()

    def payToken(self, session_id, user_id, quantity) -> CheckoutSession | None:
        user = self.db.session.query(User).filter(User.id == user_id).first()
        user.token_coin += quantity
        session = self.db.session.query(CheckoutSession)\
            .filter(CheckoutSession.session_id == session_id).first()
        session.status = 'confirmed'
        session.finished_at = datetime.now()
        self.db.session.commit()
        return session

    def payTokenPromoMojette(self, session_id, user_id, quantity, promo_mojette_amount) -> CheckoutSession | None:
        user = self.db.session.query(User).filter(User.id == user_id).first()
        user.token_coin += quantity
        user.mojettes -= promo_mojette_amount
        session = self.db.session.query(CheckoutSession)\
            .filter(CheckoutSession.session_id == session_id).first()
        session.status = 'confirmed'
        session.finished_at = datetime.now()
        self.db.session.commit()
        return session

    def payMojette(self, session_id, user_id, quantity) -> CheckoutSession | None:
        user = self.db.session.query(User).filter(User.id == user_id).first()
        user.mojettes += quantity
        session = self.db.session.query(CheckoutSession)\
            .filter(CheckoutSession.session_id == session_id).first()
        session.status = 'confirmed'
        session.finished_at = datetime.now()
        self.db.session.commit()
        return session

    def cancelCheckoutSession(self, session_id) -> CheckoutSession | None:
        session = self.db.session.query(CheckoutSession)\
            .filter(CheckoutSession.session_id == session_id).first()
        session.status = 'cancelled'
        session.finished_at = datetime.now()
        self.db.session.commit()
        return session
    # RGPD

    def CreateUserDataRequest(self, user_data_request: UserDataRequest) -> UserDataRequest:
        """Create a new user data request record"""
        self.db.session.add(user_data_request)
        self.db.session.commit()
        return user_data_request

    def CreateUserDataDeletion(self, user_data_deletion: UserDataDeletion) -> UserDataDeletion:
        """Create a new user data deletion record"""
        self.db.session.add(user_data_deletion)
        self.db.session.commit()
        return user_data_deletion
