
from database.database import DatabaseManager
from flask import abort
from utils.common import get_array_width

db_manager = DatabaseManager()


# PROBLEM
def verify_region_solution(data, solutions):
    return data["values"] == solutions


def verify_standard_solution(data, solutions):
    values_to_verify = data["values"]
    indice_a_verifier = data["indice"]
    solution_to_compare = []

    if not len(indice_a_verifier):
        return [item for items in solutions for item in items] == values_to_verify

    for indice in indice_a_verifier:
        if isinstance(solutions[indice], list):
            [solution_to_compare.append(x) for x in solutions[indice]]
        else:
            solution_to_compare.append(solutions[indice])

    return solution_to_compare == values_to_verify


# CARRE
def are_all_carre_used(user_solution, solution_carre_list):
    user_carre_array = [x['size'] for x in user_solution]
    return user_carre_array.sort() == solution_carre_list.split(',').sort()


def are_all_tiles_covered(solution, width, height):
    arr = [0] * (width * height)
    for tile in solution:
        for i in range(0, tile['size']):
            for j in range(0, tile['size']):
                index = tile['gridX'] + (tile['gridY'] + i) * width + j
                arr[index] = 1

    return all(x == 1 for x in arr)


def is_carre_solution_valid(carre_data, solution):
    return are_all_carre_used(solution, carre_data['carre_list']) and are_all_tiles_covered(solution,
                                                                                            carre_data['width'],
                                                                                            carre_data['height'])


########
# TODO : fix this part for better typing validation with the create entry function
def add_game_to_completed_list(create_entry_func, read_reward_func, data, key):
    try:
        create_entry_func(data)
        reward = read_reward_func(data[key])
        mojettes = db_manager.UpdateUserMojettes(
            data['user_id'], reward).mojettes
    except Exception as e:
        abort(500, str(e))

    return {
        "reward": reward,
        "mojettes": mojettes
    }, 201


def add_mojette_to_completed_list(mojette_data):
    return add_game_to_completed_list(db_manager.CreateMojetteCompleted, db_manager.ReadMojetteReward, mojette_data,
                                      'grid_id')


def add_problem_to_completed_list(problem_data):
    return add_game_to_completed_list(db_manager.CreateProblemCompleted, db_manager.ReadProblemReward, problem_data,
                                      'problem_id')


def add_carre_to_completed_list(carre_data):
    return add_game_to_completed_list(db_manager.CreateCarreCompleted, db_manager.ReadCarreReward, carre_data,
                                      'carre_id')
