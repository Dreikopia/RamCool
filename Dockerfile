# ---------- Stage 1: build the React/Vite frontend ----------
FROM node:20 AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ---------- Stage 2: the PHP + Apache server ----------
# 8.4 is the floor: composer.lock pins symfony 8.1, which requires >= 8.4.1
FROM php:8.4-apache

# Install PHP extensions Laravel needs (pgsql = PostgreSQL)
RUN apt-get update && apt-get install -y libpq-dev libzip-dev unzip git \
    && docker-php-ext-install pdo pdo_pgsql zip \
    && a2enmod rewrite \
    && sed -ri '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# Make Apache serve Laravel's /public folder
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf

# Install Composer (PHP's package manager)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . .
COPY --from=frontend /app/public/build ./public/build

RUN composer install --no-dev --optimize-autoloader --no-interaction
RUN chown -R www-data:www-data storage bootstrap/cache

# Serves uploaded product images from storage/app/public at /storage/*
RUN php artisan storage:link

# Run migrations, then start Apache.
# Seeding is a one-off: run `php artisan db:seed --class=UserSeeder --force`
# once in the Render Shell, never on boot (it resets the admin password).
CMD php artisan migrate --force && apache2-foreground