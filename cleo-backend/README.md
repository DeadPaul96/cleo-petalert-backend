# Cleo Backend (FastAPI + Mojo)

Welcome to the high-performance backend architecture for Cleo PetAlert.

## Setting Up Mojo on Windows (via WSL)

Mojo is a compiled language designed for AI and high-performance systems. Currently, native Windows support is under development. Therefore, the official and most robust way to use Mojo on Windows is through **Windows Subsystem for Linux (WSL)**.

### Prerequisites
1. Ensure you have WSL 2 installed (Search for "Turn Windows features on or off" -> Check "Windows Subsystem for Linux").
2. Install a Linux distribution (e.g., Ubuntu) from the Microsoft Store.

### Installation Steps (inside your WSL Ubuntu terminal)

1. **Install Curl (if not present):**
   ```bash
   sudo apt update && sudo apt install curl
   ```

2. **Install the Modular CLI:**
   ```bash
   curl -s https://get.modular.com | sh -
   ```

3. **Install the Mojo SDK:**
   ```bash
   modular install mojo
   ```

4. **Update your Environment Variables:**
   The installation will provide you with specific `export PATH` commands to run. They usually look like this:
   ```bash
   echo 'export MODULAR_HOME="$HOME/.modular"' >> ~/.bashrc
   echo 'export PATH="$MODULAR_HOME/pkg/packages.modular.com_mojo/bin:$PATH"' >> ~/.bashrc
   source ~/.bashrc
   ```

### Running the Project

**Option 1: Pure Python (Development / Testing UI)**
If you just want to test the FastAPI endpoints without compiling Mojo yet, you can run it directly in Windows:
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Option 2: Full Stack (API + PostGIS Database)**
To run the complete environment, including the specialized PostgreSQL database for map coordinates, you must have Docker installed.

```bash
cd cleo-backend
docker-compose up --build
```
This will start your API at `http://localhost:8000` and a fresh PostGIS database simultaneously.

**Compiling Mojo (WSL or Linux required)**
Once Mojo is installed in WSL/Linux, compile the `.mojo` files inside the `mojo_core` directory into binary executables that the Python FastAPI server will call.

```bash
cd mojo_core
mojo build image_compressor.mojo -o image_compressor_bin
```

