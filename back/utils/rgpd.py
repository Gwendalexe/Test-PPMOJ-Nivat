"""
RGPD (GDPR) utilities for user data export and deletion.
"""

import json
from datetime import datetime, date
from io import BytesIO
from database.database import DatabaseManager
from sqlalchemy import text


def get_user_export_data(user_id: int) -> dict:
    """
    Collect all data related to a user for RGPD data export.

    Args:
        user_id: The ID of the user to export data for

    Returns:
        A dictionary containing all user data organized by table
    """
    db_manager = DatabaseManager()
    session = db_manager.db.session

    export_data = {}

    try:
        # Get user's own data
        user = db_manager.ReadUserById(user_id)
        if user:
            export_data['user'] = [user.serialize()]
        else:
            return {'error': 'User not found'}

        # Get checkout sessions
        checkout_sessions = session.execute(
            text('SELECT * FROM checkout_session WHERE user_id = :user_id'),
            {'user_id': user_id}
        ).fetchall()
        if checkout_sessions:
            export_data['checkout_session'] = [dict(row._mapping) for row in checkout_sessions]

        # Get carre completed
        carre_completed = session.execute(
            text('SELECT * FROM carre_completed WHERE user_id = :user_id'),
            {'user_id': user_id}
        ).fetchall()
        if carre_completed:
            export_data['carre_completed'] = [dict(row._mapping) for row in carre_completed]

        # Get formation bought
        formation_bought = session.execute(
            text('SELECT * FROM formation_bought WHERE user_id = :user_id'),
            {'user_id': user_id}
        ).fetchall()
        if formation_bought:
            export_data['formation_bought'] = [dict(row._mapping) for row in formation_bought]

        # Get mojette completed
        mojette_completed = session.execute(
            text('SELECT * FROM mojette_completed WHERE user_id = :user_id'),
            {'user_id': user_id}
        ).fetchall()
        if mojette_completed:
            export_data['mojette_completed'] = [dict(row._mapping) for row in mojette_completed]

        # Get problem completed
        problem_completed = session.execute(
            text('SELECT * FROM problem_completed WHERE user_id = :user_id'),
            {'user_id': user_id}
        ).fetchall()
        if problem_completed:
            export_data['problem_completed'] = [dict(row._mapping) for row in problem_completed]

        # Get week problem completed
        week_problem_completed = session.execute(
            text('SELECT * FROM week_problem_completed WHERE user_id = :user_id'),
            {'user_id': user_id}
        ).fetchall()
        if week_problem_completed:
            export_data['week_problem_completed'] = [dict(row._mapping) for row in week_problem_completed]

        return export_data

    except Exception as e:
        import traceback
        print(f"Error exporting user data: {str(e)}")
        traceback.print_exc()
        return {'error': str(e)}


def convert_to_json_serializable(data: dict) -> dict:
    """
    Convert database data to JSON-serializable format.
    Handles datetime, date objects and other non-JSON types.

    Args:
        data: Dictionary with user data

    Returns:
        Dictionary with JSON-serializable data
    """
    def serialize_value(value):
        if isinstance(value, datetime):
            return value.isoformat()
        elif isinstance(value, date):
            return value.isoformat()
        elif isinstance(value, bytes):
            return value.decode('utf-8')
        elif value is None:
            return None
        else:
            return value

    serialized = {}
    for table_name, records in data.items():
        if isinstance(records, list):
            serialized[table_name] = [
                {k: serialize_value(v) for k, v in record.items()}
                for record in records
            ]
        else:
            serialized[table_name] = serialize_value(records)

    return serialized


def create_user_export_json(user_id: int) -> str:
    """
    Create a JSON string with all user data.

    Args:
        user_id: The ID of the user to export data for

    Returns:
        JSON string with all user data
    """
    export_data = get_user_export_data(user_id)

    if 'error' in export_data:
        return json.dumps(export_data)

    # Convert to JSON-serializable format
    serializable_data = convert_to_json_serializable(export_data)

    # Add metadata
    export_data_with_metadata = {
        'metadata': {
            'export_date': datetime.now().isoformat(),
            'user_id': user_id
        },
        'data': serializable_data
    }

    return json.dumps(export_data_with_metadata, indent=2, ensure_ascii=False)
