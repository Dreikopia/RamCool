# ---------- Stage 1: build the React/Vite frontend ----------
FROM node:20 AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ---------- Stage 2: the PHP + Apache server ----------
FROM php:8.3-apache

# Install PHP extensions Laravel needs (pgsql = PostgreSQL)
RUN apt-get update && apt-get install -y libpq-dev libzip-dev unzip git \
    && docker-php-ext-install pdo pdo_pgsql zip \
    && a2enmod rewrite

# Make Apache serve Laravel's /public folder
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf

# Install Composer (PHP's package manager)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . .
COPY --from=frontend /app/public/build ./public/build

RUN composer install --no-dev --optimize-autoloader
RUN chown -R www-data:www-data storage bootstrap/cache

# Run migrations, then start Apache
CMD php artisan migrate --force && apache2-foreground