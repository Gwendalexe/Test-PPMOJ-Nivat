"""rgpd_database_for_data_history_and_col_for_data_deletion

Revision ID: ea6edf8a2eab
Revises: 75bf5f23b03a
Create Date: 2026-01-11 18:41:01.354492

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ea6edf8a2eab'
down_revision = '75bf5f23b03a'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'user_data_request',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('datetime', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('extra', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'])
    )
    op.create_table(
        'user_data_deletion',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('datetime', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('extra', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'])
    )
    op.add_column(
        "user",
        sa.Column("deleted", sa.Boolean(), nullable=False, server_default=sa.text("0")),
    )


def downgrade():
    op.drop_column("user", "deleted")
    op.drop_table('user_data_deletion')
    op.drop_table('user_data_request')
