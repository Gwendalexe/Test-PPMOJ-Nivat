def get_array_width(arr):
    if type(arr) != list or not len(arr): return 0
    depth = lambda L: isinstance(L, list) and max(map(depth, L)) + 1
    return 1 if (depth(arr) == 1) else len(arr[0])




needed_list = ["EMAIL_USER", "EMAIL_PASSWORD", "EMAIL_PORT", "EMAIL_SERVER", "EMAIL_DEFAULT_SENDER",
"FRONT_URL", "API_URL",
"DB_USER", "DB_HOST", "DB_PORT", "DB_PASSWORD", "DB_DATABASE",
"SECRET_KEY", "STRIPE_PUBLIC_KEY", "STRIPE_PRIVATE_KEY", "DISCORD_WEBHOOK_URL"
]


def load_environment():
    import os
    from dotenv import load_dotenv, find_dotenv
    envs = {'development_local': '.env.development.local',
          'development': '.env.development', 'production': '.env.prod'}
    env_state = os.getenv('ENV', None)
    if env_state is None:
        raise ValueError('''! Erreur: la variable d'environnement 'ENV' n'est pas définie !\n
                            Veuillez définir la variable d'environnement 'ENV' avec l'une des valeurs suivantes : 'development_local', 'development', ou 'production'.\n
                            - Sur Linux/Mac : export ENV=development,\n
                            - Sur Windows (cmd) : set ENV=development,\n
                            - Sur Windows (PowerShell) : $env:ENV="development."
                                  ''')
    if env_state not in envs:
        raise ValueError(f"! Erreur: l'environnement spécifié n'existe pas ! {env_state}\nVeuillez utiliser l'une des valeurs suivantes : 'development_local', 'development', ou 'production'.")

    dotenv_file = envs[env_state]
    try:
        loaded_bool = load_dotenv(find_dotenv(dotenv_file))
        if not loaded_bool:
            raise FileNotFoundError(f"! Erreur: le fichier {dotenv_file} est introuvable ou n'a pas pu être chargé.")
    except Exception as e:
        raise RuntimeError(f"! Erreur lors du chargement du fichier {dotenv_file} : {str(e)}")

    missing_vars = [var for var in needed_list if os.getenv(var) is None]
    if missing_vars:
        raise EnvironmentError(f"! Erreur: les variables d'environnement suivantes sont manquantes dans le fichier {dotenv_file} : {', '.join(missing_vars)}")


    print(f'Running in {env_state} mode from {dotenv_file}.')
    return env_state
