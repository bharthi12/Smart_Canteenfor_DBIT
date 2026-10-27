# ==========================================
# Stage 1: Build the Frontend (React + Vite)
# ==========================================
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Build the Backend (Spring Boot + Java 21)
# ==========================================
FROM maven:3.9.6-eclipse-temurin-21 AS backend-build
WORKDIR /app/backend

COPY backend/pom.xml .
RUN mvn dependency:go-offline -B || true

COPY backend/src ./src

# Embed compiled frontend assets into Spring Boot's static resources
COPY --from=frontend-build /app/frontend/dist ./src/main/resources/static/

RUN mvn clean package -DskipTests

# ==========================================
# Stage 3: Lightweight Production JRE Runtime
# ==========================================
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Copy the compiled executable JAR
COPY --from=backend-build /app/backend/target/*.jar app.jar

EXPOSE 8080
ENV PORT=8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
