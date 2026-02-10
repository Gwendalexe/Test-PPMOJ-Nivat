"""Fix figure_path for existing problems in week_problem

Revision ID: 53c4fb90a680
Revises: 39b77e7e548f
Create Date: 2025-10-30 16:01:04.699707

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '53c4fb90a680'
down_revision = '39b77e7e548f'
branch_labels = None
depends_on = None

PREFIX = "/week_problems/image/"

def upgrade():
    conn = op.get_bind()
    # Ajoute le préfixe si pas déjà présent, et si la colonne n’est pas vide
    conn.execute(sa.text(f"""
        UPDATE week_problem
        SET figure_path = CONCAT(:p, figure_path)
        WHERE figure_path IS NOT NULL
          AND figure_path <> ''
          AND figure_path NOT LIKE :p_like
          -- (optionnel) évite de préfixer les URLs absolues :
          AND figure_path NOT LIKE 'http%%'
    """), {"p": PREFIX, "p_like": PREFIX + "%"})

def downgrade():
    conn = op.get_bind()
    # Retire le préfixe si présent (opération inverse)
    conn.execute(sa.text(f"""
        UPDATE week_problem
        SET figure_path = SUBSTRING(figure_path, LENGTH(:p) + 1)
        WHERE figure_path LIKE :p_like
    """), {"p": PREFIX, "p_like": PREFIX + "%"})
