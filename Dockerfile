# ---- Base Node ----
FROM node:18-alpine AS base
WORKDIR /app

# ---- Dependencies ----
# Install dependencies leveraging npm workspaces and Docker cache layers
FROM base AS deps
# Copy root package files
COPY package.json package-lock.json* ./
# Copy workspace package files
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
# Copy smart contracts package file if it exists and is needed for builds (optional)
# COPY smart-contracts/package.json ./smart-contracts/

# Install all dependencies including devDependencies needed for builds
RUN npm install

# ---- Backend Builder ----
# Copy backend source code
FROM deps AS backend-builder
COPY ./backend ./backend

# ---- Frontend Builder ----
# Build the frontend application
FROM deps AS frontend-builder
COPY ./frontend ./frontend
# Copy other necessary root config files for build if needed (e.g., tsconfig.json, tailwind.config.js)
COPY tsconfig.json tailwind.config.js postcss.config.js ./
RUN npm run build --workspace=frontend

# ---- Backend Production Image ----
FROM node:18-alpine AS backend-prod
WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV production
ENV PORT 8080

# Copy production dependencies from the 'deps' stage
COPY --from=deps /app/node_modules ./node_modules
# Copy backend-specific node_modules if they exist (unlikely with workspaces, but safe)
# COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY --from=deps /app/backend/package.json ./backend/package.json

# Copy backend application code from the 'backend-builder' stage
COPY --from=backend-builder /app/backend ./backend

WORKDIR /app/backend
EXPOSE ${PORT}
CMD ["npm", "start"]

# ---- Frontend Production Image ----
FROM node:18-alpine AS frontend-prod
WORKDIR /app

ENV NODE_ENV production
ENV PORT 3000

# Copy production dependencies and frontend package.json
COPY --from=deps /app/node_modules ./node_modules
# Copy frontend-specific node_modules if they exist
# COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY --from=deps /app/frontend/package.json ./frontend/package.json

# Copy built frontend application from the 'frontend-builder' stage
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public
# Copy next.config.js if it exists and is needed at runtime
# COPY --from=frontend-builder /app/frontend/next.config.js ./frontend/

WORKDIR /app/frontend
EXPOSE ${PORT}
CMD ["npm", "start"]
