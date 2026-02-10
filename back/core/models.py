from flask_restx import Namespace, fields

model_namespace = Namespace('', description='Models')

#USER
login_form_model = model_namespace.model('LoginForm', {
  'username': fields.String,
  'password': fields.String,
})

login_return_model = model_namespace.model('LoginReturn', {
    'id': fields.Integer,
    'username': fields.String(required=True),
    'email': fields.String(required=True),
    'mojettes': fields.Integer(default=0),
    'token_coin': fields.Integer(default=0),
    'token': fields.String,
    'role': fields.String,
    'confirmed': fields.Boolean(default=False),
    'tutorial_mojette_done': fields.Boolean(default=False)
})

user_minimal_model = model_namespace.model('RegisterForm', {
  **login_form_model,
  'email': fields.String,
})

user_edit_model = model_namespace.model('UserEdit', {
    **user_minimal_model,
    'oldPassword': fields.String,
})

user_model = model_namespace.model('User', {
    'id': fields.Integer,
    'username': fields.String(required=True),
    # 'password': fields.String(required=True),
    'email': fields.String(required=True),
    'mojettes': fields.Integer(default=0),
    'token_coin': fields.Integer(default=0),
    'confirmation_token': fields.String,
    'role': fields.String,
    'confirmed': fields.Boolean(default=False),
    'tutorial_mojette_done': fields.Boolean(default=False),
    'created_at': fields.DateTime
})

profile_info = model_namespace.model('Profile', {
    'username': fields.String(required=True),
    'mojettes': fields.Integer,
    'token_coin': fields.Integer,
    'role': fields.String
})

user_confirmation = model_namespace.model('UserConfirmation', {
   "confirmed": fields.Boolean(required=True)
})

#CARRE
carre_model = model_namespace.model('SimpleCarre', {
  'id': fields.Integer,
  'level': fields.Integer(required=True),
  'width': fields.Integer(required=True),
  'height': fields.Integer(required=True),
  'carre_list': fields.List(fields.Integer(), required=True),
})

carre_complete_model = model_namespace.model('CarreComplete', {
  'user_id': fields.Integer(required=True),
  'carre_id': fields.Integer(required=True),
  'completion_time': fields.Integer(required=True)
})

carre_completed_model = model_namespace.model('CarreCompleted', {
  **carre_complete_model,
  'reward': fields.Integer(required=True),
  'completion_date': fields.String(required=True)
})

tile_model = model_namespace.model('Tile',
  {
      'gridX': fields.Integer(required=True, description="Tile X position"),
    'gridY': fields.Integer(required=True, description="Tile Y position"),
    'size': fields.Integer(required=True, description="Tile size")
  }
)

carre_verification_model = model_namespace.model('CarreVerification', {
  'solution': fields.List(fields.Nested(tile_model)),
  'completion_time': fields.Integer(required=True, description="Completion time")
})

#MOJETTE
simple_mojette_model = model_namespace.model('SimpleMojette', {
  'id': fields.Integer,
  'level': fields.Integer(required=True),
  'date': fields.Date(required=True),
  'published': fields.Boolean(required=True),
  'solved': fields.Boolean
})

mojette_model = model_namespace.model('Mojette', {
  **simple_mojette_model,
  'bin_values': fields.List(fields.Integer(), required=True),
  'height': fields.Integer(required=True),
  'width': fields.Integer(required=True),
  'array_box': fields.List(fields.Integer(), required=True),
  'nb_bin_down': fields.Integer(required=True),
  'nb_bin_left': fields.Integer(required=True),
  'nb_bin_right': fields.Integer(required=True),
  'reward': fields.Integer(required=True),
  'help_1_percent_cost': fields.Integer(required=True)
})

mojette_model_with_solution = model_namespace.model('MojetteSolution', {
  **mojette_model,
  'solution': fields.String(required=True)
})

mojette_complete_model = model_namespace.model('MojetteComplete', {
  'user_id': fields.Integer(required=True),
  'grid_id': fields.Integer(required=True),
  'helps_used': fields.Integer(required=True),
  'completion_time': fields.Integer(required=True)
})

mojette_completed_model = model_namespace.model('MojetteCompleted', {
  **mojette_complete_model,
  'reward': fields.Integer(required=True),
  'completion_date': fields.String(required=True)
})

mojette_help_model = model_namespace.model('MojetteHelp', {
  'tile': fields.Integer(required=True),
  'value': fields.Integer(required=True),
  'mojettes': fields.Integer(required=True)
})

mojette_verification_model = model_namespace.model('MojetteVerification', {
  'grid': fields.List(fields.Integer()),
  'helps_used': fields.Integer(required=True, description="Number of helps used"),
  'completion_time': fields.Integer(required=True, description="Completion time")
})

leaderboard_entry_model = model_namespace.model('LeaderboardEntry', {
    'user_id': fields.Integer(required=True),
    'username': fields.String(required=True),
    'completion_time': fields.Integer(required=True),
    'helps_used': fields.Integer(required=True),
    'position': fields.Integer(required=True),
    'score': fields.Integer(required=True)
})

leaderboard_model = model_namespace.model('Leaderboard', {
    'top': fields.List(fields.Nested(leaderboard_entry_model), required=True),
    'user': fields.Nested(leaderboard_entry_model, required=True),
    'above_user': fields.List(fields.Nested(leaderboard_entry_model), required=True),
    'below_user': fields.List(fields.Nested(leaderboard_entry_model), required=True)
})


#PROBLEMS


simple_problem_model = model_namespace.model('SimpleProblem', {
  'id': fields.Integer,
  'level': fields.Integer,
  'department': fields.Integer,
  'type': fields.Integer,
})

simple_problem_model_with_region = model_namespace.model('ProblemWithRegion', {
  **simple_problem_model,
  'region': fields.String,
})

problem_model = model_namespace.model('Problem', {
  **simple_problem_model,
  'statement': fields.String,
  'question': fields.List(fields.String()),
  'nb_question': fields.Integer,
  'figure_path': fields.String,
  'variables': fields.List(fields.String()),
  'unknowns': fields.Integer,
  'values_list': fields.List(fields.List(fields.Integer())),
  'nb_help': fields.Integer,
  'reward': fields.Integer,
  'help_1_cost': fields.Integer,
  'help_2_cost': fields.Integer,
  'help_3_cost': fields.Integer,
  #'solution': fields.List(fields.Integer(), required=True),
})

problem_extended_model = model_namespace.model('ProblemExtended', {
   **problem_model,
  'help_1': fields.String(required=True),
  'help_2': fields.String,
  'help_3': fields.String,
})

problem_completed_model = model_namespace.model('ProblemCompleted', {
  'user_id': fields.Integer(required=True),
  'problem_id': fields.Integer(required=True),
  'helps_used': fields.Integer(required=True),
  'completion_date': fields.String(required=True),
  'type': fields.Integer(required=True),
  'department': fields.Integer(required=True),
  'region': fields.String(required=True),
  'reward': fields.Integer(required=True),
})

problem_verification_model = model_namespace.model('ProblemVerification', {
  'values': fields.List(fields.Integer, required=True, description="List of values to verify against the solution"),
  'indice': fields.List(fields.Integer, description="Indices to verify in the solution"),
  'helps_used': fields.Integer(required=True, description="Number of helps used")
})

problem_help_model = model_namespace.model('ProblemHelp', {
  'help': fields.String(required=True),
  'mojettes': fields.Integer(required=True)
})

#UTILS

completion_response_model = model_namespace.model('CompletionModel', {
  'reward': fields.Integer(required=True),
  'mojettes': fields.Integer(required=True)
})

#FORMATIONS

formation_category_model = model_namespace.model('FormationCategory', {
  'id': fields.Integer,
  'category_name': fields.String(required=True),
  'code': fields.String(required=True),
  'category_description': fields.String(required=True)
})

formation_model = model_namespace.model('Formation', {
  'id': fields.Integer,
  'name':  fields.String(required=True),
  'category': fields.Integer(required=True),
  'description': fields.String(required=True),
  'price': fields.Integer(required=True),
  'img_link': fields.String(required=True),
  'document_link': fields.String(required=True),
  'displayed': fields.Boolean(required=True),
})

formation_session_model = model_namespace.model('FormationSession', {
    'formation_id': fields.Integer(required=True),
    'formation_availability_id': fields.Integer(),
    'delivery_date': fields.DateTime(required=True),
    'duration_minutes': fields.Integer(required=True),
    'speaker': fields.String(required=True),
    'live_link': fields.String(),
    'replay_link': fields.String(),
})

formation_extended_model = model_namespace.model('FormationExtended', {
    **formation_model,
    'owned': fields.Boolean(required=True),
    'sessions': fields.List(fields.Nested(formation_session_model))
})

# PAYMENT
create_checkout_session_model = model_namespace.model('CreateCheckoutSession', {
    'line_items': fields.List(fields.Nested(model_namespace.model('Item', {
        'price': fields.String(required=True),
        'quantity': fields.Integer(required=True)
    })), required=True)
})
