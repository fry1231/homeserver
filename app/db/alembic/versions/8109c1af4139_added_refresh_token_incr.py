"""added refresh token incr

Revision ID: 8109c1af4139
Revises: c7c3cfec8447
Create Date: 2024-06-17 19:37:11.221936

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '8109c1af4139'
down_revision = 'c7c3cfec8447'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    # Adding column refresh_token_incr to users with a default value 0
    op.add_column('users', sa.Column('refresh_token_incr', sa.Integer(), nullable=False, server_default='0'))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('users', 'refresh_token_incr')
    # ### end Alembic commands ###
