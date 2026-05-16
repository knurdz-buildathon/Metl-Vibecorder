# Metl-VibeCoder Workspace Image
# Includes Node.js 20, Python 3.11, code-server, Git, Playwright, and common dev tools

FROM mcr.microsoft.com/devcontainers/javascript-node:20-bookworm

ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_ENV=development
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    ca-certificates \
    python3.11 \
    python3.11-venv \
    python3-pip \
    build-essential \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libgbm1 \
    libasound2 \
    fonts-liberation \
    libappindicator3-1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxtst6 \
    libpango-1.0-0 \
    libcairo2 \
    libatspi2.0-0 \
    libgtk-3-0 \
    && rm -rf /var/lib/apt/lists/*

# Install code-server (OpenVSCode Server variant)
RUN curl -fsSL https://code-server.dev/install.sh | sh

# Install Playwright browsers and dependencies
RUN npx playwright install-deps chromium
RUN npx playwright install chromium

# Pre-install common global npm packages
RUN npm install -g \
    typescript@5.5 \
    tsx@4.19 \
    nodemon@3.1 \
    ts-node@10.9 \
    @types/node@20

# Pre-install common Python packages in system Python for quick access
RUN pip3 install --no-cache-dir --break-system-packages \
    pytest>=8.2 \
    httpx>=0.27 \
    requests>=2.32 \
    black>=24.4 \
    ruff>=0.5 \
    mypy>=1.10 || true

# Create a default Python venv that sessions can use
RUN python3.11 -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache-dir \
      pytest>=8.2 \
      httpx>=0.27 \
      requests>=2.32
ENV PATH="/opt/venv/bin:$PATH"

# Create workspace directory
WORKDIR /workspace

# Set default password for code-server (override with CODE_SERVER_PASSWORD env)
ENV PASSWORD=metlcode

# Expose code-server port
EXPOSE 8080

# Start code-server with sensible defaults
ENTRYPOINT ["code-server", "--bind-addr", "0.0.0.0:8080", "--auth", "password", "--disable-telemetry", "/workspace"]
