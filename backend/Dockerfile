# ── Stage 1: Install dependencies ─────────────────────────────────────────────
# Interview tip: Multi-stage builds keep the final image small and secure.
# The builder stage has pip + build tools; the runtime stage has ONLY what's needed.
FROM python:3.12-slim AS builder

WORKDIR /app

# Install into an isolated venv so we can copy just the venv to the next stage
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Stage 2: Lean runtime image ────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

WORKDIR /app

# Copy only the installed packages from builder (no pip, no build tools)
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Non-root user for security (interview tip: never run containers as root)
RUN adduser --disabled-password --gecos "" appuser
USER appuser

COPY . .

EXPOSE 8000

# --reload is for dev. In production, remove --reload and add --workers 4
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
