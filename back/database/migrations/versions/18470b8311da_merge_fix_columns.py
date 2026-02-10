"""merge fix columns

Revision ID: 18470b8311da
Revises: ea6edf8a2eab
Create Date: 2026-02-05 23:44:58.226671

"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '18470b8311da'
down_revision = 'ea6edf8a2eab'
branch_labels = None
depends_on = None


def upgrade():
    # Modification des colonnes existantes (nettoyage types)
    with op.batch_alter_table('carre_completed', schema=None) as batch_op:
        batch_op.alter_column('completion_date',
                              existing_type=sa.DATE(),
                              type_=sa.DateTime(),
                              existing_nullable=True)

    with op.batch_alter_table('formation', schema=None) as batch_op:
        batch_op.alter_column('price',
                              existing_type=mysql.DECIMAL(
                                  precision=10, scale=2),
                              type_=sa.Integer(),
                              existing_nullable=True)

    with op.batch_alter_table('formation_availability', schema=None) as batch_op:
        batch_op.add_column(sa.Column(
            'formation_availability_id', sa.Integer(), autoincrement=True, nullable=False))
        batch_op.add_column(sa.Column('duration_minutes',
                            sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('speaker', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('live_link', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('replay_link', sa.Text(), nullable=True))

    with op.batch_alter_table('formation_category', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('category_name', sa.Text(), nullable=True))
        batch_op.add_column(
            sa.Column('category_description', sa.Text(), nullable=True))
        # On ne drop pas les anciennes colonnes si elles n'existent plus, par sécurité on ne met rien ici.

    with op.batch_alter_table('mojette_completed', schema=None) as batch_op:
        batch_op.alter_column('completion_date',
                              existing_type=sa.DATE(),
                              type_=sa.DateTime(),
                              existing_nullable=True)

    with op.batch_alter_table('problem_completed', schema=None) as batch_op:
        batch_op.alter_column('completion_date',
                              existing_type=sa.DATE(),
                              type_=sa.DateTime(),
                              existing_nullable=True)

    # L'AJOUT CRUCIAL POUR TON JEU
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.add_column(sa.Column('tutorial_mojette_done',
                            sa.Boolean(), server_default='0', nullable=False))
        batch_op.add_column(
            sa.Column('password_reset_token', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('stripe_id', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('deleted', sa.Boolean(),
                            server_default='0', nullable=False))


def downgrade():
    # On garde le downgrade simple au cas où
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.drop_column('deleted')
        batch_op.drop_column('stripe_id')
        batch_op.drop_column('password_reset_token')
        batch_op.drop_column('tutorial_mojette_done')
