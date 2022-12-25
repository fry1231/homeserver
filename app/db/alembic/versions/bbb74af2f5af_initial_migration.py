"""Initial migration

Revision ID: bbb74af2f5af
Revises: 
Create Date: 2022-12-18 22:06:45.733383

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'bbb74af2f5af'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('tasks',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('text', sa.String(length=256), nullable=False),
    sa.Column('finished', sa.Boolean(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('users',
    sa.Column('telegram_id', sa.Integer(), nullable=False),
    sa.PrimaryKeyConstraint('telegram_id')
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('users')
    op.drop_table('tasks')
    # ### end Alembic commands ###
