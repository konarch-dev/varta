# VARTA Hostinger VPS Deployment & Runbook

This guide details the procedure for deploying VARTA on an existing Hostinger VPS running Docker Compose and Nginx, alongside existing web services without downtime or port collisions.

---

## 1. Pre-Deployment Inspection Checklist

Before modifying any configuration or deploying containers on the VPS, execute the following non-destructive commands via SSH:

```bash
# 1. Inspect running Docker containers and networks
docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"
docker network ls

# 2. Inspect active listening ports on host
sudo ss -tulpn | grep LISTEN

# 3. Check memory & disk availability
free -m
df -h

# 4. Inspect current Nginx configuration
sudo nginx -t
ls -la /etc/nginx/sites-enabled/
```

Confirm that:
- Ports `3050` and `3051` are NOT occupied by other services (if occupied, adjust in `docker-compose.prod.yml`).
- VPS has at least 1GB of free RAM and at least 10GB of free disk space.
- Existing containers belong to different Compose project names.

---

## 2. Directory & Storage Setup

```bash
# 1. Create dedicated application directory
sudo mkdir -p /var/www/varta
sudo chown -R $USER:$USER /var/www/varta
cd /var/www/varta

# 2. Clone repository or pull updates
git clone <your-repo-url> .

# 3. Configure production environment
cp .env.example .env
nano .env # Set strong random passwords and production domain names
```

---

## 3. Launching VARTA Docker Containers

VARTA uses a dedicated project name `-p varta` and isolated bridge network `varta-network`.

```bash
# Build and start services in background
docker compose -p varta -f docker/docker-compose.prod.yml up -d --build

# Run database migrations and generate Prisma client inside container
docker exec -it varta-prod-api npx prisma migrate deploy

# Verify container health
docker compose -p varta -f docker/docker-compose.prod.yml ps
```

---

## 4. Host Nginx & HTTPS Configuration

```bash
# 1. Copy the Nginx configuration template
sudo cp docker/nginx/varta.conf /etc/nginx/sites-available/varta.conf

# 2. Update server_name to your actual domain
sudo nano /etc/nginx/sites-available/varta.conf

# 3. Enable site and test syntax
sudo ln -s /etc/nginx/sites-available/varta.conf /etc/nginx/sites-enabled/
sudo nginx -t

# 4. Obtain SSL certificates via Certbot
sudo certbot --nginx -d varta.yourdomain.com -d api.varta.yourdomain.com

# 5. Reload Nginx
sudo systemctl reload nginx
```

---

## 5. Automated Database Backups (Cron)

Set up a daily automated backup at 03:00 AM UTC:

```bash
# Edit crontab
crontab -e

# Add the following line:
0 3 * * * /var/www/varta/docker/scripts/backup-db.sh >> /var/log/varta-backup.log 2>&1
```

---

## 6. Rollback Procedure

If a deployment fails or unexpected issues occur:

```bash
cd /var/www/varta

# 1. Rollback code to previous git release tag
git checkout <previous-tag-or-commit>

# 2. Restart containers with previous version
docker compose -p varta -f docker/docker-compose.prod.yml up -d --build

# 3. If database restoration is needed:
./docker/scripts/restore-db.sh /var/www/varta/backups/<backup-file>.sql.gz
```
