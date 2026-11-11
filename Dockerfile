# ---------- Stage 1: Build the React/Vite frontend ----------
FROM node:20 AS frontend

WORKDIR /app

COPY package*.json ./

# Install exact dependencies from package-lock.json
RUN npm ci

COPY . .

# Build frontend assets
RUN npm run build


# ---------- Stage 2: PHP + Apache server ----------
FROM php:8.4-apache

# Install PHP extensions Laravel needs (PostgreSQL)
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
    unzip \
    git \
    && docker-php-ext-install pdo pdo_pgsql zip \
    && a2enmod rewrite \
    && sed -ri '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf \
    && rm -rf /var/lib/apt/lists/*

# Make Apache serve Laravel's public folder
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public

RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
    /etc/apache2/sites-available/*.conf

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy Laravel application
COPY . .

# Copy built React/Vite assets
COPY --from=frontend /app/public/build ./public/build

# Install production PHP dependencies
RUN composer install \
    --no-dev \
    --optimize-autoloader \
    --no-interaction

# Set Laravel permissions
RUN chown -R www-data:www-data storage bootstrap/cache

# Create storage symbolic link
RUN php artisan storage:link

# Render communicates with Apache on port 80
EXPOSE 80

# Run migrations before starting Apache
CMD ["sh", "-c", "php artisan migrate --force && exec apache2-foreground"]