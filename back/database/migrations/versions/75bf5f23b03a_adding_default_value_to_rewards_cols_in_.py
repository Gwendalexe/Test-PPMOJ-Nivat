"""adding default value to rewards cols in week_problem

Revision ID: 75bf5f23b03a
Revises: 25c901d2e1ba
Create Date: 2025-12-19 14:22:36.676608

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '75bf5f23b03a'
down_revision = '25c901d2e1ba'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column('week_problem', 'reward_mojette',
                    existing_type=sa.Integer(),
                    server_default='0',
                    existing_nullable=True)
    op.alter_column('week_problem', 'reward_token_coin',
                    existing_type=sa.Integer(),
                    server_default='0',
                    existing_nullable=True)



def downgrade():
    op.alter_column('week_problem', 'reward_mojette',
                    existing_type=sa.Integer(),
                    server_default=None,
                    existing_nullable=True)
    op.alter_column('week_problem', 'reward_token_coin',
                    existing_type=sa.Integer(),
                    server_default=None,
                    existing_nullable=True)
