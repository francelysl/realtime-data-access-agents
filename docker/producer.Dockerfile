FROM python:3.11-slim
WORKDIR /app
COPY streaming/producer/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt
COPY streaming/producer /app
ENV PYTHONUNBUFFERED=1
CMD ["python", "producer.py"]
