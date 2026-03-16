# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# --- MOJO INSTALLATION PLACEHOLDER ---
# In a true production environment, you would install the Modular CLI and Mojo here.
# Note: Mojo currently requires specific architectures (Linux x86_64, macOS ARM64).
# RUN curl -s https://get.modular.com | sh -
# RUN modular install mojo
# ENV PATH="$PATH:/root/.modular/pkg/packages.modular.com_mojo/bin"
# -------------------------------------

# Copy the current directory contents into the container at /app
COPY . /app

# Expose port 8000 for FastAPI
EXPOSE 8000

# Run FastAPI using uvicorn, respecting the PORT environment variable
CMD sh -c "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"
