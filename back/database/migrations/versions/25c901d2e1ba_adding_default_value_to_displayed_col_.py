"""adding default value to displayed col in week_problem

Revision ID: 25c901d2e1ba
Revises: 1d6ff0a8c8f2
Create Date: 2025-12-19 14:04:38.263438

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '25c901d2e1ba'
down_revision = '1d6ff0a8c8f2'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column('week_problem', 'displayed',
                    existing_type=sa.Boolean(),
                    server_default=sa.true(),
                    existing_nullable=True)


def downgrade():
    op.alter_column('week_problem', 'displayed',
                    existing_type=sa.Boolean(),
                    server_default=None,
                    existing_nullable=True)
