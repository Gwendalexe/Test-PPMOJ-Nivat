"""add rewards and week problem completed

Revision ID: 45503107dc2e
Revises: 57a4d44f8057
Create Date: 2025-11-03 17:47:22.917647

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '45503107dc2e'
down_revision = '57a4d44f8057'
branch_labels = None
depends_on = None

def upgrade():
    # Add new reward columns to week_problem with default 0
    op.add_column('week_problem', sa.Column('reward_mojette', sa.Integer(), nullable=False, server_default=sa.text('0')))
    op.add_column('week_problem', sa.Column('reward_token_coin', sa.Integer(), nullable=False, server_default=sa.text('0')))

    # Create week_problem_completed table
    op.create_table(
        'week_problem_completed',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('week_problem_id', sa.Integer(), nullable=False),
        sa.Column('completion_date', sa.DateTime(), nullable=True),
        sa.Column('helps_used', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.ForeignKeyConstraint(['week_problem_id'], ['week_problem.id'], ),
        sa.PrimaryKeyConstraint('user_id', 'week_problem_id')
    )

    # Optional: drop server defaults to rely on application defaults thereafter
    op.alter_column('week_problem', 'reward_mojette', server_default=None)
    op.alter_column('week_problem', 'reward_token_coin', server_default=None)


def downgrade():
    # Drop week_problem_completed table
    op.drop_table('week_problem_completed')

    # Remove added columns from week_problem
    op.drop_column('week_problem', 'reward_token_coin')
    op.drop_column('week_problem', 'reward_mojette')


