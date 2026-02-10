import argparse
import json
import os
import time

import bcrypt
from utils.common import load_environment
# SQLAlchemy imports
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from datetime import datetime, date, timedelta

json_file_error = "Data format in JSON file is not as expected"

env_state = load_environment()

# Build the database URL using environment variables
DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_DATABASE")
DB_PORT = os.getenv("DB_PORT", "3306")

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
# Create the Engine and the Session
engine = create_engine(DATABASE_URL, echo=False, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# We'll keep a single, global session for the script
session = SessionLocal()


# ------------------------------------------------------------------------------
# Helper function to reset a table
# ------------------------------------------------------------------------------
def reset_table(table, id_column):
    """
    Attempt to delete rows from `table` where `id_column` != 0,
    fallback if it’s a text column (i.e., != ""), then reset AUTO_INCREMENT.
    """
    try:
        session.execute(
            text(f"DELETE FROM {table} WHERE {id_column} != 0")
        )
        session.execute(
            text(f"ALTER TABLE {table} AUTO_INCREMENT = 1")
        )
        print(f"Table {table.upper()} reset successfully - numeric id")
    except Exception:
        try:
            session.execute(
                text(f"DELETE FROM {table} WHERE {id_column} != ''")
            )
            session.execute(
                text(f"ALTER TABLE {table} AUTO_INCREMENT = 1")
            )
            print(f"Table {table.upper()} reset successfully - text id")
        except Exception as e:
            print(f"Failed to reset {table.upper()}")
            print(e)


# ------------------------------------------------------------------------------
# Populate Game
# ------------------------------------------------------------------------------
def populate_game():
    with open('./Json/_games.json', encoding="UTF-8") as json_file:
        data = json.load(json_file)

    shapes = data.get('games', [])
    if isinstance(shapes, list) and all(isinstance(item, dict) for item in shapes):
        for record in shapes:
            sql = text("INSERT INTO game (id, name) VALUES (:id, :name)")
            try:
                session.execute(sql, {
                    'id': record['id'],
                    'name': record['name']
                })
            except Exception as e:
                print(
                    f"Données clés manquantes pour la forme: {record.get('name')}")
                print(e)

        session.commit()
        print("Games inserted successfully")
    else:
        print(json_file_error)


# ------------------------------------------------------------------------------
# Populate Region
# ------------------------------------------------------------------------------
def populate_region():
    with open('./Json/_regions.json', encoding="UTF-8") as json_file:
        data = json.load(json_file)

    regions = data.get('regions', [])
    if isinstance(regions, list) and all(isinstance(item, dict) for item in regions):
        for record in regions:
            name = record.get('name')
            region_code = record.get('regionCode')
            coordinates = record.get('coordinates')
            view_box = record.get('viewBox')  # optional

            if view_box:
                sql = text("""
                    INSERT INTO region (name, region_code, coordinates, viewBox)
                    VALUES (:name, :region_code, :coordinates, :viewBox)
                """)
                params = {
                    'name': name,
                    'region_code': region_code,
                    'coordinates': coordinates,
                    'viewBox': view_box
                }
            else:
                sql = text("""
                    INSERT INTO region (name, region_code, coordinates)
                    VALUES (:name, :region_code, :coordinates)
                """)
                params = {
                    'name': name,
                    'region_code': region_code,
                    'coordinates': coordinates
                }

            try:
                session.execute(sql, params)
            except Exception as e:
                print(f"Données clés manquantes pour la région: {name}")
                print(e)

        session.commit()
        print("Region data inserted successfully")
    else:
        print(json_file_error)


# ------------------------------------------------------------------------------
# Populate Department
# ------------------------------------------------------------------------------
def populate_department():
    with open('./Json/_departments.json', encoding="UTF-8") as json_file:
        data = json.load(json_file)

    departments = data.get('departments', [])
    if isinstance(departments, list) and all(isinstance(item, dict) for item in departments):
        for record in departments:
            sql = text("""
                INSERT INTO department (number, name, coordinates, zones, region)
                VALUES (:number, :name, :coordinates, :zones, :region)
            """)
            try:
                params = {
                    'number': record['id'],
                    'name': record['name'],
                    'coordinates': record['coordinates'],
                    'zones': json.dumps(record['zones']),  # store as JSON
                    'region': record['region']
                }
                session.execute(sql, params)
            except Exception as e:
                print(
                    f"Données clés manquantes pour le département: {record.get('name')}")
                print(e)

        session.commit()
        print("Department data inserted successfully")
    else:
        print(json_file_error)


# ------------------------------------------------------------------------------
# Populate Reward
# ------------------------------------------------------------------------------
def populate_reward():
    with open('./Json/_rewards.json', encoding="UTF-8") as json_file:
        data = json.load(json_file)

    rewards = data.get('rewards', [])
    if isinstance(rewards, list) and all(isinstance(item, dict) for item in rewards):
        for record in rewards:
            sql = text("""
                INSERT INTO reward
                (game, level, reward, help_1_percent_cost, help_2_percent_cost, help_3_percent_cost)
                VALUES (:game, :level, :reward, :h1, :h2, :h3)
            """)
            try:
                session.execute(sql, {
                    'game': record['game'],
                    'level': record['level'],
                    'reward': record['reward'],
                    'h1': record['help_1_percent_cost'],
                    'h2': record['help_2_percent_cost'],
                    'h3': record['help_3_percent_cost']
                })
            except Exception as e:
                print(
                    f"Données clés manquantes pour la récompense: {(record.get('game'), record.get('level'))}")
                print(e)

        session.commit()
        print("Reward data inserted successfully")
    else:
        print(json_file_error)


# ------------------------------------------------------------------------------
# Update Reward
# ------------------------------------------------------------------------------
def update_reward():
    with open('./Json/_rewards.json', encoding="UTF-8") as json_file:
        data = json.load(json_file)

    rewards = data.get('rewards', [])
    if isinstance(rewards, list) and all(isinstance(item, dict) for item in rewards):
        for record in rewards:
            sql = text(f"""
                UPDATE reward
                SET reward = :reward,
                    help_1_percent_cost = :h1,
                    help_2_percent_cost = :h2,
                    help_3_percent_cost = :h3
                WHERE game = {record['game']} AND level = {record['level']}
            """)
            try:
                session.execute(sql, {
                    'reward': record['reward'],
                    'h1': record['help_1_percent_cost'],
                    'h2': record['help_2_percent_cost'],
                    'h3': record['help_3_percent_cost'],
                })
            except Exception as e:
                print(
                    f"Données clés manquantes pour la récompense: {(record.get('game'), record.get('level'))}")
                print(e)

        session.commit()
        print("Reward data updated successfully")
    else:
        print(json_file_error)


# ------------------------------------------------------------------------------
# Populate Problem Type
# ------------------------------------------------------------------------------
def populate_problem_type():
    with open('./Json/_problem_type.json', encoding="UTF-8") as json_file:
        data = json.load(json_file)

    problem_types = data.get('problem_type', [])
    if isinstance(problem_types, list) and all(isinstance(item, dict) for item in problem_types):
        for record in problem_types:
            sql = text(
                "INSERT INTO problem_type (id, name) VALUES (:id, :name)")
            try:
                session.execute(sql, {
                    'id': record['id']+1,
                    'name': record['name']
                })
            except Exception as e:
                print(
                    f"Données clés manquantes pour le problème: {record.get('name')}")
                print(e)

        session.commit()
        print("Problem type data inserted successfully")
    else:
        print(json_file_error)


# ------------------------------------------------------------------------------
# Populate Problem
# ------------------------------------------------------------------------------
def populate_problem():
    with open('./Json/_enigmes.json', encoding="UTF-8") as json_file:
        data = json.load(json_file)

    problems = data.get('enigmes', [])
    if isinstance(problems, list) and all(isinstance(item, dict) for item in problems):
        for record in problems:
            # Build the JSON data
            question_json = json.dumps(record.get('question', []))
            variables_json = json.dumps(record.get('variables', []))
            liste_val_json = json.dumps(record.get('liste_val', []))
            solution_json = json.dumps(record.get('solution', []))
            # Derive department & type
            department = int(str(record['id'])[0:2])
            problem_type = 3 if len(str(record['id'])) == 2 else int(
                str(record['id'])[2:]) + 1

            problem_statement = record.get('enonce')
            help_1 = record.get('aide1')
            help_2 = record.get('aide2')
            help_3 = record.get('aide3')

            sql = text("""
                INSERT INTO problem
                (game, level, department, type, statement, question, nb_question,
                 help_1, help_2, help_3, figure_path, variables, values_list, solution)
                VALUES
                (:game, :level, :department, :type, :statement, :question, :nb_question,
                 :help_1, :help_2, :help_3, :figure_path, :variables, :values_list, :solution)
            """)
            try:
                session.execute(sql, {
                    'game': 1,
                    'level': record['niveau'],
                    'department': department,
                    'type': problem_type,
                    'statement': problem_statement,
                    'question': question_json,
                    'nb_question': record.get('nbQuestion'),
                    'help_1': help_1,
                    'help_2': help_2,
                    'help_3': help_3,
                    'figure_path': record.get('figure'),
                    'variables': variables_json,
                    'values_list': liste_val_json,
                    'solution': solution_json
                })
            except Exception as e:
                print(
                    f"Données clés manquantes pour le problème: {record.get('id')}")
                print(e)

        session.commit()
        print("Problem data inserted successfully")
    else:
        print(json_file_error)

# ------------------------------------------------------------------------------
# Populate enigmes semaine
# ------------------------------------------------------------------------------

def populate_week_problems():
    with open('./Json/_enigmes_semaine.json', encoding="UTF-8") as json_file:
        data = json.load(json_file)

    enigmes_semaine = data.get('enigmes_semaine', [])
    if isinstance(enigmes_semaine, list) and all(isinstance(item, dict) for item in enigmes_semaine):
        for record in enigmes_semaine:
            date_str = record.get('date')
            if date_str:
                try:
                    date_pub = datetime.strptime(date_str, "%Y-%m-%d").date()
                except ValueError:
                    print(f"Format date invalide pour id {record.get('id')}, date utilisée: aujourd'hui")
                    date_pub = date.today()
            else:
                date_pub = date.today()

            sql = text("""
                INSERT INTO week_problem
                (nb_question, figure_path, nb_val_to_find, nb_item, variables, values_list, solution, date)
                VALUES
                (:nb_question, :figure_path, :nb_val_to_find, :nb_item, :variables, :values_list, :solution, :date)
            """)

            try:
                session.execute(sql, {
                    'nb_question': record.get('nbQuestion'),
                    'figure_path': record.get('figure'),
                    'nb_val_to_find': record.get('nbValToFind'),
                    'nb_item': record.get('nbItem'),
                    'variables': json.dumps(record.get('variables', [])),
                    'values_list': json.dumps(record.get('liste_val', [])),
                    'solution': json.dumps(record.get('solution', [])),
                    'date': date_pub
                })
            except Exception as e:
                print(f"Erreur insertion WeekProblem id: {record.get('id')}")
                print(e)

        session.commit()
        print("Données WeekProblem insérées avec succès")
    else:
        print("Erreur fichier JSON ou format incorrect")

# ------------------------------------------------------------------------------
# Update Problem
# ------------------------------------------------------------------------------
def update_problem():
    with open('./Json/_enigmes.json', encoding="UTF-8") as json_file:
        data = json.load(json_file)

    problems = data.get('enigmes', [])
    if isinstance(problems, list) and all(isinstance(item, dict) for item in problems):
        for record in problems:
            department = int(str(record['id'])[0:2])
            problem_type = 2 if len(str(record['id'])) == 2 else int(
                str(record['id'])[2:])
            # Prepare JSON
            question_json = json.dumps(record.get('question', []))
            variables_json = json.dumps(record.get('variables', []))
            liste_val_json = json.dumps(record.get('liste_val', []))
            solution_json = json.dumps(record.get('solution', []))

            problem_statement = record.get('enonce')
            help_1 = record.get('aide1')
            help_2 = record.get('aide2')
            help_3 = record.get('aide3')

            sql = text(f"""
                UPDATE problem
                   SET level = :level,
                       statement = :statement,
                       question = :question,
                       nb_question = :nb_question,
                       figure_path = :figure_path,
                       variables = :variables,
                       values_list = :values_list,
                       solution = :solution,
                       help_1 = :help_1,
                       help_2 = :help_2,
                       help_3 = :help_3
                 WHERE department = {department} AND type = {problem_type}
            """)
            try:
                session.execute(sql, {
                    'level': record.get('niveau'),
                    'statement': problem_statement,
                    'question': question_json,
                    'nb_question': record.get('nbQuestion'),
                    'figure_path': record.get('figure'),
                    'variables': variables_json,
                    'values_list': liste_val_json,
                    'solution': solution_json,
                    'help_1': help_1,
                    'help_2': help_2,
                    'help_3': help_3
                })
            except Exception as e:
                print(
                    f"Données clés manquantes pour le problème: {record.get('id')}")
                print(e)

        session.commit()
        print("Problem data updated successfully")
    else:
        print(json_file_error)


# ------------------------------------------------------------------------------
# Populate Mojette Shape
# ------------------------------------------------------------------------------
def populate_mojette_shape():
    with open('./Json/_mojette_shapes.json', encoding="UTF-8") as json_file:
        data = json.load(json_file)

    shapes = data.get('shapes', [])
    if isinstance(shapes, list) and all(isinstance(item, dict) for item in shapes):
        for record in shapes:
            sql = text("""
                INSERT INTO mojette_shape
                (id, name, height, width, array_box, nb_bin_down, nb_bin_left, nb_bin_right)
                VALUES
                (:id, :name, :height, :width, :array_box, :nb_bin_down, :nb_bin_left, :nb_bin_right)
            """)
            try:
                session.execute(sql, {
                    'id': record['id'],
                    'name': record['name'],
                    'height': record['height'],
                    'width': record['width'],
                    'array_box': record['array_box'],
                    'nb_bin_down': record['nb_bin_down'],
                    'nb_bin_left': record['nb_bin_left'],
                    'nb_bin_right': record['nb_bin_right']
                })
            except Exception as e:
                print(
                    f"Données clés manquantes pour la forme: {record.get('name')}")
                print(e)

        session.commit()
        print("Mojette shape data inserted successfully")
    else:
        print(json_file_error)


# ------------------------------------------------------------------------------
# Populate Mojette
# ------------------------------------------------------------------------------
def populate_mojette():
    with open('./Json/_problems_mojette.json', encoding="UTF-8") as json_file:
        data = json.load(json_file)

    for value in data.values():
        sql_base = """
            INSERT INTO mojette (id, game, level, shape, bin_values, solution)
            VALUES (:id, :game, :level, :shape, :bin_values, :solution)
        """
        params = {
            'id': value.get('id'),
            'game': 2,
            'level': value.get('level'),
            'shape': value.get('shape'),
            'bin_values': value.get('valBin'),
            'solution': value.get('solution')
        }

        date_str = value.get('date')
        if date_str:
            date_parts = date_str.split('-')
            if len(date_parts) == 3:
                # Override the base SQL with a new insert that includes date
                sql_base = """
                    INSERT INTO mojette (id, game, level, date, shape, bin_values, solution)
                    VALUES (:id, :game, :level, :date, :shape, :bin_values, :solution)
                """
                date_val = datetime(
                    int(date_parts[0]),
                    int(date_parts[1]),
                    int(date_parts[2])
                ).strftime('%Y-%m-%d')
                params['date'] = date_val

        try:
            session.execute(text(sql_base), params)
        except Exception as e:
            print("Can't insert mojette in table")
            print(e)

    session.commit()
    print("Mojette data inserted successfully")


# ------------------------------------------------------------------------------
# Update Mojette
# ------------------------------------------------------------------------------
def update_mojette():
    with open('./Json/_problems_mojette.json', encoding="UTF-8") as json_file:
        data = json.load(json_file)

    for value in data.values():
        id_val = value.get('id')
        level = value.get('level')
        shape = value.get('shape')
        bin_values = value.get('valBin')
        solution = value.get('solution')
        date_str = value.get('date')

        # Start building the query string
        sql_parts = [
            "UPDATE mojette SET level = :level, shape = :shape, bin_values = :bin_values"
        ]
        params = {
            'level': level,
            'shape': shape,
            'bin_values': bin_values
        }

        # If date is valid, include it
        if date_str:
            date_parts = date_str.split('-')
            if len(date_parts) == 3:
                date_val = datetime(
                    int(date_parts[0]),
                    int(date_parts[1]),
                    int(date_parts[2])
                ).strftime('%Y-%m-%d')
                sql_parts.append(", date = :date")
                params['date'] = date_val

        # If solution is present
        if solution is not None:
            sql_parts.append(", solution = :solution")
            params['solution'] = solution

        # Add WHERE clause for the id
        sql_parts.append(f"WHERE id = {id_val}")

        final_sql = " ".join(sql_parts)

        try:
            session.execute(text(final_sql), params)
        except Exception as e:
            print("Can't update mojette in table")
            print(e)

    session.commit()
    print("Mojette data updated successfully")


# ------------------------------------------------------------------------------
# Populate Carre
# ------------------------------------------------------------------------------
def populate_cpt():
    with open('./Json/_problems_CPT.json', encoding="UTF-8") as json_file:
        data = json.load(json_file)

    for key, value in data.items():
        # Example logic to set level:
        # level = (len(value.get('listeCarres')) - 9) // 2
        level = 1
        carre_list_str = ",".join(str(x) for x in value['listeCarres'])

        sql = text("""
            INSERT INTO carre (id, game, level, height, width, carre_list)
            VALUES (:id, :game, :level, :height, :width, :carre_list)
        """)

        params = {
            'id': int(key) + 1,
            'game': 3,
            'level': level,
            'height': value.get('height'),
            'width': value.get('width'),
            'carre_list': carre_list_str
        }

        try:
            session.execute(sql, params)
        except Exception as e:
            print("Can't insert value in table")
            print(e)

    session.commit()
    print("Carre data inserted successfully")


# ------------------------------------------------------------------------------
# Update Carre
# ------------------------------------------------------------------------------
def update_cpt():
    with open('./Json/_problems_CPT.json', encoding="UTF-8") as json_file:
        data = json.load(json_file)

    for key, value in data.items():
        level = 1
        carre_list_str = ",".join(str(x) for x in value['listeCarres'])

        sql = text(f"""
            UPDATE carre
               SET level = :level,
                   height = :height,
                   width = :width,
                   carre_list = :carre_list
             WHERE id = {int(key) + 1}
        """)
        params = {
            'level': level,
            'height': value.get('height'),
            'width': value.get('width'),
            'carre_list': carre_list_str
        }

        try:
            session.execute(sql, params)
        except Exception as e:
            print("Can't update carre in table")
            print(e)

    session.commit()
    print("Carre data updated successfully")


# ------------------------------------------------------------------------------
# Populate Users
# ------------------------------------------------------------------------------
def populate_users():
    with open('./Json/_users.json', encoding="UTF-8") as json_file:
        data = json.load(json_file)

    users = data.get('users', [])
    if isinstance(users, list) and all(isinstance(item, dict) for item in users):
        for record in users:
            username = record.get('username')
            password = record.get('password')
            email = record.get('email')
            confirmation_token = record.get('confirmation_token')
            role = record.get('role')
            confirmed = record.get('confirmed')

            if username and password and email:
                # Hash password
                password_hash = bcrypt.hashpw(password.encode(
                    'utf-8'), bcrypt.gensalt()).decode('utf-8')

                sql = text("""
                    INSERT INTO user
                    (username, password_hash, email, confirmation_token, role, confirmed)
                    VALUES (:username, :password_hash, :email, :confirmation_token, :role, :confirmed)
                """)
                params = {
                    'username': username,
                    'password_hash': password_hash,
                    'email': email,
                    'confirmation_token': confirmation_token,
                    'role': role,
                    'confirmed': confirmed
                }
                try:
                    session.execute(sql, params)
                except Exception as e:
                    print("Can't insert value in user table")
                    print(e)
            else:
                print(f"Missing key data for user: {username}")

        session.commit()
        print("User data inserted successfully")
    else:
        print(json_file_error)

# ------------------------------------------------------------------------------
# Populate Formations
# ------------------------------------------------------------------------------


def populate_formations():
    with open('./Json/_formations.json', encoding="UTF-8") as json_file:
        data = json.load(json_file)

    formations = data.get('formations', [])
    if isinstance(formations, list) and all(isinstance(item, dict) for item in formations):
        for record in formations:
            sql1 = text("""
                INSERT INTO formation_category (id, category_name, code, category_description)
                VALUES (:id, :category_name, :code, :category_description)
            """)
            try:
                session.execute(sql1, {
                    'id': record['id'],
                    'category_name': record['name'],
                    'code': record['code'],
                    'category_description': record['description']
                })
                for formation in record['formations']:
                    sql2 = text("""
                        INSERT INTO formation (id, name, category, description, price, img_link, document_link)
                        VALUES (:id, :name, :category, :description, :price, :img_link, :document_link)
                    """)
                    try:
                        session.execute(sql2, {
                            'id': formation['id'],
                            'name': formation['name'],
                            'category': record['id'],
                            'description': formation['description'] if 'description' in formation else '',
                            'price': formation['price'] if 'price' in formation else 0,
                            'img_link': formation['img_link'] if 'img_link' in formation else '',
                            'document_link': formation['document_link'] if 'document_link' in formation else ''
                        })
                        for availability in formation['sessions']:
                            sql3 = text("""
                                INSERT INTO formation_availability (formation_id, delivery_date, duration_minutes, speaker, live_link, replay_link)
                                VALUES (:formation_id, :delivery_date, :duration_minutes, :speaker, :live_link, :replay_link)
                            """)
                            try:
                                session.execute(sql3, {
                                    'formation_id': formation['id'],
                                    'delivery_date': datetime.strptime(availability['delivery_date'], '%Y-%m-%d %H:%M:%S') - timedelta(hours=1),
                                    'duration_minutes': availability['duration_minutes'] if 'duration_minutes' in availability else 0,
                                    'speaker': availability['speaker'] if 'speaker' in availability else '',
                                    'live_link': availability['live_link'] if 'live_link' in availability else '',
                                    'replay_link': availability['replay_link'] if 'replay_link' in availability else ''
                                })
                            except Exception as e:
                                print(
                                    f"Missing key data for formation session: {availability['delivery_date']}")
                                print(e)
                    except Exception as e:
                        print(
                            f"Missing key data for formation: {formation['name']}")
                        print(e)
            except Exception as e:
                print(
                    f"Missing key data for formation category: {record['name']}")
                print(e)

        session.commit()
        print("Formation data inserted successfully")
    else:
        print("Data format in JSON file is not as expected")

# ------------------------------------------------------------------------------
# Reset Tables
# ------------------------------------------------------------------------------


def reset_tables():
    reset_table("carre_completed", "user_id")
    reset_table("mojette_completed", "user_id")
    reset_table("problem_completed", "user_id")
    reset_table("carre", "id")
    reset_table("problem", "id")
    reset_table("mojette", "id")
    reset_table("reward", "game")
    reset_table("game", "id")
    reset_table("department", "number")
    reset_table("region", "region_code")
    reset_table("mojette_shape", "id")
    reset_table("problem_type", "id")
    reset_table("formation_bought", "formation_id")
    reset_table("formation_availability", "formation_id")
    reset_table("formation", "id")
    reset_table("formation_category", "id")
    session.commit()


# ------------------------------------------------------------------------------
# Populate DB
# ------------------------------------------------------------------------------
def populate_db():
    populate_game()
    populate_region()
    populate_department()
    populate_reward()
    populate_problem_type()
    populate_problem()
    populate_week_problems()
    populate_mojette_shape()
    populate_mojette()
    populate_cpt()
    populate_formations()


# ------------------------------------------------------------------------------
# Draw the Database schema
# ------------------------------------------------------------------------------
def draw_schema():
    from sqlalchemy import MetaData
    from sqlalchemy_schemadisplay import create_schema_graph
    metadata = MetaData()
    metadata.reflect(bind=engine)
    graph = create_schema_graph(
        metadata=metadata,
        engine=engine,
        show_datatypes=False,
        show_indexes=False,
        rankdir='LR'
    )
    graph.write_png('../docs/db_schema.png')


# ------------------------------------------------------------------------------
# Main
# ------------------------------------------------------------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description='Script to operate actions on DB')

    parser.add_argument('-r', '--reset', action='store_true', help='Reset DB')
    parser.add_argument('-p', '--populate',
                        action='store_true', help='Populate DB')
    parser.add_argument('-ue', '--update-enigme',
                        action='store_true', help='Update enigmes in DB')
    parser.add_argument('-um', '--update-mojette',
                        action='store_true', help='Update mojette in DB')
    parser.add_argument('-uc', '--update-carre',
                        action='store_true', help='Update carre in DB')
    parser.add_argument('-ur', '--update-reward',
                        action='store_true', help='Update rewards in DB')
    parser.add_argument('-pu', '--populate-user',
                        action='store_true', help='Populate users in DB')
    parser.add_argument('-ru', '--reset-user',
                        action='store_true', help='Delete users in DB')
    parser.add_argument('-pw', '--populate-week-problems',
                        action='store_true', help='Populate week problems in DB')
    parser.add_argument('-d', '--draw', action='store_true',
                        help='Draw the Database schema')

    args = vars(parser.parse_args())

    if not env_state:
        raise ValueError("L'environnement n'est pas défini correctement.")
    print(f"Environment set to: {env_state}.\n If this is not correct, please cancel the command in the next 5 seconds.")
    time.sleep(5)

    if args['reset']:
        reset_tables()

    if args['populate']:
        populate_db()

    if args['update_enigme']:
        update_problem()

    if args['update_mojette']:
        update_mojette()

    if args['update_carre']:
        update_cpt()

    if args['update_reward']:
        update_reward()

    if args['populate_user']:
        populate_users()

    if args['reset_user']:
        reset_table("user", "id")

    if args["populate_week_problems"]:
        populate_week_problems()

    if args['draw']:
        draw_schema()

    # Close the global session when finished
    session.close()
