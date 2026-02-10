import datetime
from sqlalchemy import (DECIMAL, JSON, Boolean, Column, Date, DateTime,
                        ForeignKey, ForeignKeyConstraint, Integer, Row, String,
                        Text, func)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.inspection import inspect
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    Base object, all models should inherit from this class.
    """
    pass


metadata = Base.metadata


class Serializer(object):
    """
    Helper class for serializing SQLAlchemy objects into dictionaries.
    """

    def serialize(self):
        """
        Serialize the Database object into a dictionary
        """
        return {c: getattr(self, c) for c in inspect(self).attrs.keys()}

    @staticmethod
    def serialize_list(l):
        """
        Serialize a list of Database objects into a list of dictionaries
        """
        return [m.serialize() for m in l]

    @staticmethod
    def serialize_row(row: Row):
        """
        Serialize a Row object, result of a join into a dictionary
        warning: if there are multiple columns with the same name, only the last one will be kept
        """
        combined_dict = {}
        for table in row:
            if table is None:
                continue
            data = table.serialize()
            combined_dict.update(data)
        return combined_dict

    @staticmethod
    def serialize_list_row(l):
        """
        Serialize a list of Row objects, result of a join into a list of dictionaries
        warning: if there are multiple columns with the same name, only the last one will be kept
        """
        return [Serializer.serialize_row(m) for m in l]

# users


class User(Base, Serializer):
    """
    User model representing a user in the system.

    Attributes:
        id (int): Primary key, auto-incremented.
        username (str): Unique username of the user, cannot be null.
        email (str): Unique email of the user, cannot be null.
        password_hash (str): Hashed password of the user, cannot be null.
        confirmation_token (str): Token used for email confirmation.
        confirmed (bool): Indicates whether the user's email is confirmed, defaults to False.
        tutorial_mojette_done (bool): Indicates wheter the user has completed or not the mojette tutorial.
        password_reset_token (str): Token used for password reset.
        created_at (datetime): Timestamp when the user was created, defaults to current time.
        mojettes (int): Number of mojettes the user has, defaults to 0.
        token_coin (int): Number of token coins the user has, defaults to 0.
        role (str): Role of the user in the system.
        stripe_id (str): Stripe customer id associated with the user.
        deleted (bool): Indicates whether the user account is deleted, defaults to False.
    """

    __tablename__ = 'user'

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    confirmation_token = Column(Text)
    confirmed = Column(Boolean, default=False, server_default='0', nullable=False)
    tutorial_mojette_done = Column(Boolean, default=False, server_default='0', nullable=False)
    password_reset_token = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    mojettes = Column(Integer, default=0)
    token_coin = Column(Integer, default=0)
    role = Column(Text)
    stripe_id = Column(Text, nullable=True, default=None)
    deleted = Column(Boolean, default=False, server_default='0', nullable=False)

# games


class Game(Base, Serializer):
    """
    Represents the type of a game

    Attributes:
        id (int): The primary key of the game, auto-incremented.
        name (str): The name of the game.
    """

    __tablename__ = 'game'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text)

# Vadrouille en france


class Reward(Base, Serializer):
    """
    Represents a reward for a game

    Attributes:
        game (int): The ID of the game associated with the reward.
        level (int): The level at which the reward is given.
        reward (int): The reward amount.
        help_1_percent_cost (int): The cost percentage for the first help option.
        help_2_percent_cost (int): The cost percentage for the second help option.
        help_3_percent_cost (int): The cost percentage for the third help option.
    """

    __tablename__ = 'reward'

    game = Column(Integer, ForeignKey('game.id'), primary_key=True)
    level = Column(Integer, primary_key=True)
    reward = Column(Integer)
    help_1_percent_cost = Column(Integer)
    help_2_percent_cost = Column(Integer)
    help_3_percent_cost = Column(Integer)


class Region(Base, Serializer):
    """
    Represents a geographical region.

    Attributes:
        region_code (str): The unique code identifying the region.
        name (str): The name of the region.
        coordinates (str): used in the UI for SVG representation of the region.
        viewBox (str): used in the UI for SVG representation of the region.
    """

    __tablename__ = 'region'

    region_code = Column(String(255), primary_key=True)
    name = Column(Text)
    coordinates = Column(Text, nullable=False)
    viewBox = Column(Text)


class Department(Base, Serializer):
    """
    Represents a department within a region.

    Attributes:
        number (str): The unique number identifying the department.
        name (str): The name of the department.
        region (str): The code of the region this department belongs to.
        coordinates (str): Used in the UI for SVG representation of the department.
        zones (JSON): JSON object representing different zones within the department.
    """

    __tablename__ = 'department'

    number = Column(String(255), primary_key=True)
    name = Column(Text)
    region = Column(String(255), ForeignKey('region.region_code'))
    coordinates = Column(Text, nullable=False)
    zones = Column(JSON)


class ProblemType(Base, Serializer):
    """
    Represents a type of problem for "vadrouille en france" in the database.

    Attributes:
        id (int): The primary key of the problem type.
        name (str): The name of the problem type.
    """

    __tablename__ = 'problem_type'

    id = Column(Integer, primary_key=True)
    name = Column(Text)


class Problem(Base, Serializer):
    """
    Represents a problem for "vadrouille en france" in the database.

    Attributes:
        id (int): The primary key for the problem, auto-incremented.
        game (int): The game identifier.
        level (int): The level identifier.
        department (str): The department number, foreign key referencing 'department.number'.
        type (int): The problem type identifier, foreign key referencing 'problem_type.id'.
        statement (str): The statement of the problem.
        question (dict): The question details in JSON format.
        nb_question (int): The number of questions.
        help_1 (str): The first help text.
        help_2 (str): The second help text.
        help_3 (str): The third help text.
        figure_path (str): The path to the figure associated with the problem.
        variables (dict): The variables used in the problem in JSON format.
        values_list (dict): The list of values in JSON format.
        solution (dict): The solution details in JSON format.
        _table_args_ (tuple): Foreign key constraints for the table.
    """

    __tablename__ = 'problem'

    id = Column(Integer, primary_key=True, autoincrement=True)
    game = Column(Integer, ForeignKey('game.id'))
    level = Column(Integer)
    department = Column(String(255), ForeignKey(
        'department.number'), primary_key=True)
    type = Column(Integer, ForeignKey('problem_type.id'), primary_key=True)
    statement = Column(Text, nullable=False)
    question = Column(JSON, nullable=False)
    nb_question = Column(Integer)
    help_1 = Column(Text)
    help_2 = Column(Text)
    help_3 = Column(Text)
    figure_path = Column(Text)
    variables = Column(JSON)
    values_list = Column(JSON)
    solution = Column(JSON)
    _table_args_ = (
        ForeignKeyConstraint(
            ['game', 'level'],
            ['reward.game', 'reward.level']
        ), {}
    )

class WeekProblem(Base, Serializer):
    """
    Represents a problem for "enigme de la semaine" in the database.

    Attributes:
        id (int): The primary key for the problem, auto-incremented.
        figure_path (str): The path to the figure associated with the problem.
        nb_val_to_find (int): Number of values the user needs to find.
        problem_statement (str): The statement text to display on week problems.
        problem_question (str): The question text to display on week problems.
        variables (dict): The variables used in the problem in JSON format.
        values_list (dict): The list of values in JSON format.
        solution (dict): The solution details in JSON format.
        date (date): Date of the beginning of the week (Monday of the week of the enigma).
        displayed (bool): Whether this problem is displayed on the website.
    """
    __tablename__ = 'week_problem'

    id = Column(Integer, primary_key=True, autoincrement=True)
    figure_path = Column(Text)
    nb_val_to_find = Column(Integer)
    problem_statement = Column(Text, nullable=True)
    problem_question = Column(Text, nullable=True)
    variables = Column(JSON)
    values_list = Column(JSON)
    solution = Column(JSON)
    date = Column(Date, default=datetime.date.today)
    displayed = Column(Boolean, default=True, nullable=False)
    reward_mojette = Column(Integer, default=0, nullable=False)
    reward_token_coin = Column(Integer, default=0, nullable=False)

class ProblemCompleted(Base, Serializer):
    """
    Represents a record of a problem completed by a user.

    Attributes:
        user_id (int): The ID of the user who completed the problem. This is a foreign key referencing the 'user' table.
        problem_id (int): The ID of the completed problem. This is a foreign key referencing the 'problem' table.
        helps_used (int): The number of helps used by the user to complete the problem.
        completion_date (Date): The date when the problem was completed.
    """

    __tablename__ = 'problem_completed'

    user_id = Column(Integer, ForeignKey('user.id'), primary_key=True)
    problem_id = Column(Integer, ForeignKey('problem.id'), primary_key=True)
    helps_used = Column(Integer)
    completion_date = Column(DateTime, server_default=func.now())


class WeekProblemCompleted(Base, Serializer):
    """
    Represents a record of a week problem completed by a user.

    Attributes:
        user_id (int): The ID of the user who completed the week problem.
        week_problem_id (int): The ID of the completed week problem.
        completion_date (DateTime): The date and time when the week problem was completed.
        helps_used (int): Optional number of helps used.
    """

    __tablename__ = 'week_problem_completed'

    user_id = Column(Integer, ForeignKey('user.id'), primary_key=True)
    week_problem_id = Column(Integer, ForeignKey('week_problem.id'), primary_key=True)
    completion_date = Column(DateTime, server_default=func.now())
    helps_used = Column(Integer)


# Jeu Mojette

class MojetteShape(Base, Serializer):
    """
    Represents a Mojette Shape in the database.
    Attributes:
        id (int): The primary key of the Mojette Shape.
        name (str): The name of the Mojette Shape.
        height (int): The height of the Mojette Shape.
        width (int): The width of the Mojette Shape.
        array_box (str): The array box representation of the Mojette Shape.
        nb_bin_down (int): The number of bins down.
        nb_bin_left (int): The number of bins left.
        nb_bin_right (int): The number of bins right.
    """

    __tablename__ = 'mojette_shape'

    id = Column(Integer, primary_key=True)
    name = Column(Text, nullable=False)
    height = Column(Integer, nullable=False)
    width = Column(Integer, nullable=False)
    array_box = Column(Text, nullable=False)
    nb_bin_down = Column(Integer, nullable=False)
    nb_bin_left = Column(Integer, nullable=False)
    nb_bin_right = Column(Integer, nullable=False)


class Mojette(Base, Serializer):
    """
    Mojette model class representing the 'mojette' table in the database.

    Attributes:
        id (int): Primary key of the mojette.
        game (int): Foreign key referencing the 'game.id'.
        level (int): Level of the mojette.
        date (Date): Date associated with the mojette.
        shape (int): Foreign key referencing the 'mojette_shape.id'.
        bin_values (str): Binary values associated with the mojette.
        solution (str): Solution text for the mojette.
        published (bool): Indicates whether the mojette is published. Defaults to False.
        _table_args_ (tuple): Foreign key constraint linking 'game' and 'level' to 'reward.game' and 'reward.level'.
    """

    __tablename__ = 'mojette'

    id = Column(Integer, primary_key=True)
    game = Column(Integer, ForeignKey('game.id'))
    level = Column(Integer)
    date = Column(Date)
    shape = Column(Integer, ForeignKey('mojette_shape.id'))
    bin_values = Column(Text)
    solution = Column(Text)
    published = Column(Boolean, default=False,
                       server_default='0', nullable=False)
    _table_args_ = (
        ForeignKeyConstraint(
            ['game', 'level'],
            ['reward.game', 'reward.level']
        ), {}
    )


class MojetteCompleted(Base, Serializer):
    """
    Represents a completed Mojette puzzle by a user.

    Attributes:
        user_id (int): The ID of the user who completed the puzzle.
        grid_id (int): The ID of the completed Mojette puzzle.
        helps_used (int): The number of helps used by the user to complete the puzzle.
        completion_date (Date): The date when the puzzle was completed.
        completion_time (int): The time taken by the user to complete the puzzle, in seconds.
    """

    __tablename__ = 'mojette_completed'

    user_id = Column(Integer, ForeignKey('user.id'), primary_key=True)
    grid_id = Column(Integer, ForeignKey('mojette.id'), primary_key=True)
    helps_used = Column(Integer)
    completion_date = Column(DateTime, server_default=func.now())
    completion_time = Column(Integer)

# carres


class Carre(Base, Serializer):
    """
    Carre model representing a square entity in the database.
    Attributes:
        id (int): Primary key of the Carre.
        game (int): Foreign key referencing the game ID.
        level (int): Level of the Carre.
        width (int): Width of the Carre.
        height (int): Height of the Carre.
        carre_list (str): List of Carre items in text format.
        published (bool): Indicates if the Carre is published. Defaults to False.
    """

    __tablename__ = 'carre'

    id = Column(Integer, primary_key=True)
    game = Column(Integer, ForeignKey('game.id'))
    level = Column(Integer)
    width = Column(Integer)
    height = Column(Integer)
    carre_list = Column(Text)
    published = Column(Boolean, default=False,
                       server_default='0', nullable=False)
    _table_args_ = (
        ForeignKeyConstraint(
            ['game', 'level'],
            ['reward.game', 'reward.level']
        ), {}
    )


class CarreCompleted(Base, Serializer):
    """
    CarreCompleted is a model representing the completion of a 'carre' (grid) by a user.

    Attributes:
        user_id (int): The ID of the user who completed the grid. This is a foreign key referencing the 'user' table.
        grid_id (int): The ID of the completed grid. This is a foreign key referencing the 'carre' table.
        completion_date (Date): The date when the grid was completed.
        completion_time (int): The time taken to complete the grid, in seconds.
    """

    __tablename__ = 'carre_completed'

    user_id = Column(Integer, ForeignKey('user.id'), primary_key=True)
    grid_id = Column(Integer, ForeignKey('carre.id'), primary_key=True)
    completion_date = Column(DateTime, server_default=func.now())
    completion_time = Column(Integer)

# formations


class FormationCategory(Base, Serializer):
    """
    Represents a category of formation in the database.
    Attributes:
        id (int): The primary key of the formation category, auto-incremented.
        name (str): The name of the formation category.
        code (str): The code of the formation category.
        description (str): The description of the formation category.
    """

    __tablename__ = 'formation_category'

    id = Column(Integer, primary_key=True, autoincrement=True)
    category_name = Column(Text)
    code = Column(Text)
    category_description = Column(Text)


class Formation(Base, Serializer):
    """
    Represents a Formation entity in the database.

    Attributes:
        id (int): The primary key of the formation, auto-incremented.
        name (str): The name of the formation.
        category (int): The foreign key referencing the formation category.
        description (str): The description of the formation.
        duration (str): The duration of the formation, human-readable.
        price (int): The price of the formation in tokens.
        img_link (str): The link to the image associated with the formation.
        displayed (bool): Whether this formation is displayed on the website.
    """

    __tablename__ = 'formation'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text)
    category = Column(Integer, ForeignKey('formation_category.id'))
    description = Column(Text)
    price = Column(Integer)
    img_link = Column(Text)
    document_link = Column(Text)
    displayed = Column(Boolean, default=True, nullable=False)


class FormationBought(Base, Serializer):
    """
    Represents a record of a formation (course) bought by a user.
    Attributes:
        user_id (int): The ID of the user who bought the formation.
        formation_id (int): The ID of the formation that was bought.
        purchase_date (Date): The date when the formation was purchased.
    """

    __tablename__ = 'formation_bought'

    user_id = Column(Integer, ForeignKey('user.id'), primary_key=True)
    formation_id = Column(Integer, ForeignKey(
        'formation.id'), primary_key=True)
    purchase_date = Column(Date)


class FormationAvailability(Base, Serializer):
    """
    Represents the availability of a formation on a specific delivery date.
    Attributes:
        formation_id (int): The ID of the formation. This is a foreign key referencing the 'formation' table.
        formation_availability_id (int): The ID of the formation availability, auto-incremented.
        delivery_date (date): The date on which the formation is available.
        live_link (str): The link to the live.
        replay_link (str): The link to the replay.
    """

    __tablename__ = 'formation_availability'

    formation_id = Column(Integer, ForeignKey('formation.id'))
    formation_availability_id = Column(
        Integer, primary_key=True, autoincrement=True)
    delivery_date = Column(DateTime)
    duration_minutes = Column(Integer)
    speaker = Column(Text)
    live_link = Column(Text)
    replay_link = Column(Text)

# payment


class CheckoutSession(Base, Serializer):
    """
    Represents a pending or completed checkout session.
    Attributes:
        session_id (str): The stripe ID of the checkout session.
        user_id (int): The ID of the user who initiated the checkout session.
        status (str): The status of the checkout session, either 'pending', 'confirmed' or 'cancelled'.
        created_at (datetime): The timestamp when the checkout session was created.
        finished_at (datetime): The timestamp when the checkout session was finished (confirmed or cancelled).
    """

    __tablename__ = 'checkout_session'

    session_id = Column(String(255), primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'))
    status = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    finished_at = Column(DateTime, server_default=None)

# RGPD


class UserDataRequest(Base, Serializer):
    """
    Represents a record of a user data export request for RGPD compliance.

    Attributes:
        id (int): Primary key, auto-incremented.
        user_id (int): The ID of the user requesting data export.
        datetime (DateTime): Timestamp of the request.
        status (str): Status of the request (e.g., 'pending', 'completed', 'failed').
        extra (str): Optional error message or additional information.
    """

    __tablename__ = 'user_data_request'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    datetime = Column(DateTime, server_default=func.now(), nullable=False)
    status = Column(String(50), nullable=False)
    extra = Column(Text, nullable=True)


class UserDataDeletion(Base, Serializer):
    """
    Represents a record of a user account deletion request for RGPD compliance.

    Attributes:
        id (int): Primary key, auto-incremented.
        user_id (int): The ID of the user requesting account deletion.
        datetime (DateTime): Timestamp of the deletion request.
        status (str): Status of the deletion (e.g., 'pending', 'completed', 'failed').
        extra (str): Optional error message or additional information.
    """

    __tablename__ = 'user_data_deletion'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    datetime = Column(DateTime, server_default=func.now(), nullable=False)
    status = Column(String(50), nullable=False)
    extra = Column(Text, nullable=True)
