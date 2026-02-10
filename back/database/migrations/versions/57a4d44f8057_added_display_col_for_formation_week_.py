"""added display col for formation & week problems

Revision ID: 57a4d44f8057
Revises: 53c4fb90a680
Create Date: 2025-11-01 17:50:01.707153

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '57a4d44f8057'
down_revision = '53c4fb90a680'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "week_problem",
        sa.Column("displayed", sa.Boolean(), nullable=False, server_default=sa.text("1")),
    )
    op.add_column(
        "formation",
        sa.Column("displayed", sa.Boolean(), nullable=False, server_default=sa.text("1")),
    )

    op.alter_column("week_problem", "displayed", server_default=None)
    op.alter_column("formation", "displayed", server_default=None)


def downgrade():
    op.drop_column("formation", "displayed")
    op.drop_column("week_problem", "displayed")
