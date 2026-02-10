"""correction of week_problem data logic

Revision ID: 920251f90f04
Revises: 45503107dc2e
Create Date: 2026-01-10 11:43:45.516624

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '920251f90f04'
down_revision = '45503107dc2e'
branch_labels = None
depends_on = None


def upgrade():
    op.drop_column('week_problem', 'nb_item')
    op.drop_column('week_problem', 'nb_question')
    op.add_column('week_problem', sa.Column('problem_statement', sa.Text(), nullable=True))
    op.add_column('week_problem', sa.Column('problem_question', sa.Text(), nullable=True))
    pass


def downgrade():
    op.add_column('week_problem', sa.Column('nb_item', sa.INTEGER(), nullable=True))
    op.add_column('week_problem', sa.Column('nb_question', sa.INTEGER(), nullable=True))
    op.drop_column('week_problem', 'problem_statement')
    op.drop_column('week_problem', 'problem_question')
    pass
