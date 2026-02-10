"""set completion dates default to now

Revision ID: 1d6ff0a8c8f2
Revises: 920251f90f04
Create Date: 2025-11-13 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1d6ff0a8c8f2'
down_revision = '920251f90f04'
branch_labels = None
depends_on = None


def upgrade():
    timestamp_default = sa.text('now()')

    op.alter_column(
        'problem_completed',
        'completion_date',
        existing_type=sa.DATE(),
        type_=sa.DateTime(),
        server_default=timestamp_default,
        existing_nullable=True,
        postgresql_using='completion_date::timestamp'
    )
    op.alter_column(
        'mojette_completed',
        'completion_date',
        existing_type=sa.DATE(),
        type_=sa.DateTime(),
        server_default=timestamp_default,
        existing_nullable=True,
        postgresql_using='completion_date::timestamp'
    )
    op.alter_column(
        'carre_completed',
        'completion_date',
        existing_type=sa.DATE(),
        type_=sa.DateTime(),
        server_default=timestamp_default,
        existing_nullable=True,
        postgresql_using='completion_date::timestamp'
    )
    op.alter_column(
        'week_problem_completed',
        'completion_date',
        existing_type=sa.DateTime(),
        server_default=timestamp_default,
        existing_nullable=True,
    )


def downgrade():
    op.alter_column(
        'week_problem_completed',
        'completion_date',
        existing_type=sa.DateTime(),
        server_default=None,
        existing_nullable=True,
    )
    op.alter_column(
        'carre_completed',
        'completion_date',
        existing_type=sa.DateTime(),
        type_=sa.DATE(),
        server_default=None,
        existing_nullable=True,
        postgresql_using='completion_date::date'
    )
    op.alter_column(
        'mojette_completed',
        'completion_date',
        existing_type=sa.DateTime(),
        type_=sa.DATE(),
        server_default=None,
        existing_nullable=True,
        postgresql_using='completion_date::date'
    )
    op.alter_column(
        'problem_completed',
        'completion_date',
        existing_type=sa.DateTime(),
        type_=sa.DATE(),
        server_default=None,
        existing_nullable=True,
        postgresql_using='completion_date::date'
    )

