FROM python:3.10.11-slim

WORKDIR /app

COPY ./requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir ormar-postgres-extensions
RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

COPY . .