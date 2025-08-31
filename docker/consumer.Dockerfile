FROM python:3.11-slim
WORKDIR /app
COPY streaming/consumer/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt
COPY streaming/consumer /app
ENV PYTHONUNBUFFERED=1
CMD ["python", "consumer.py"]
