# syntax=docker/dockerfile:1
FROM python:3.11-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app

COPY pyproject.toml ./
RUN pip install --upgrade pip && \
    pip install --no-cache-dir fastapi==0.111.0 uvicorn[standard]==0.29.0 pydantic==2.7.1 python-dotenv==1.0.1 pyjwt[crypto]==2.8.0

COPY app ./app
EXPOSE 5000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5000"]
