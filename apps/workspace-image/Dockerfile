# Workspace base image for running user code
# Includes Node.js, Python, Git, Playwright deps, and code-server

FROM mcr.microsoft.com/devcontainers/javascript-node:20-bookworm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Install code-server (OpenVSCode Server variant)
RUN curl -fsSL https://code-server.dev/install.sh | sh

# Install Playwright browsers dependencies
RUN npx playwright install-deps chromium

# Create workspace directory
WORKDIR /workspace

# Expose code-server port
EXPOSE 8080

# Start code-server
ENTRYPOINT ["code-server", "--bind-addr", "0.0.0.0:8080", "--auth", "password", "--disable-telemetry", "/workspace"]
