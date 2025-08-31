# Use Python 3.12 slim image
FROM python:3.12-slim

# Set working directory inside container
WORKDIR /app

# Install system dependencies (for building some Python packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    sqlite3 \
    libsqlite3-dev \
    vim \
    && rm -rf /var/lib/apt/lists/*
    
# Copy requirements first (better caching)
COPY requirements.txt .

# Upgrade pip and install dependencies
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy rest of the project
COPY . .

# Expose port 8000
EXPOSE 8000

# Run the app
CMD ["python", "run.py"]
