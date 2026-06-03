#!/bin/bash
set -e

# ============================================================
# Shopee Dashboard — Auto Deploy Script
# Usage:
#   bash deploy.sh                     → akses via ip:4321
#   DOMAIN=shop.example.com bash deploy.sh  → akses via domain (SSL)
# ============================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=4321
DB_NAME="shopee_dashboard"
DB_USER="shopee"
DB_PASS="shopee123"
WEB_TOKEN="${WEB_TOKEN:-adminrahasia123}"
EMAIL="${EMAIL:-admin@example.com}"

echo ""
echo "=========================================="
echo "  Shopee Dashboard — Auto Deploy"
echo "=========================================="
echo ""

# --- 1. Detect OS ---
if ! grep -qi "ubuntu\|debian" /etc/os-release 2>/dev/null; then
  warn "Script ini dioptimalkan untuk Ubuntu/Debian. Mungkin tidak bekerja di OS lain."
fi

# --- 2. Update system ---
log "Mengupdate sistem..."
apt-get update -qq > /dev/null 2>&1

# --- 3. Node.js ---
if command -v node &> /dev/null; then
  NODE_VER=$(node -v)
  log "Node.js sudah terinstall: $NODE_VER"
else
  log "Menginstall Node.js 20.x..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
  apt-get install -y nodejs > /dev/null 2>&1
  log "Node.js $(node -v) terinstall"
fi

# --- 4. MySQL ---
if command -v mysql &> /dev/null; then
  log "MySQL sudah terinstall"
else
  log "Menginstall MySQL Server..."
  DEBIAN_FRONTEND=noninteractive apt-get install -y mysql-server > /dev/null 2>&1
  systemctl enable mysql > /dev/null 2>&1
  systemctl start mysql
  log "MySQL terinstall dan berjalan"
fi

# Pastikan MySQL berjalan
if ! systemctl is-active --quiet mysql; then
  systemctl start mysql
fi

# --- 5. Setup Database ---
log "Menyiapkan database..."
mysql -u root -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true
mysql -u root -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';" 2>/dev/null || true
mysql -u root -e "ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';" 2>/dev/null || true
mysql -u root -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost'; FLUSH PRIVILEGES;" 2>/dev/null || true
log "Database '${DB_NAME}' siap (user: ${DB_USER})"

# --- 6. Install dependencies ---
log "Menginstall npm dependencies..."
cd "$APP_DIR"
npm install --omit=dev > /dev/null 2>&1
npm install prisma --save-dev > /dev/null 2>&1
log "Dependencies terinstall"

# --- 7. Setup .env ---
log "Menulis file .env..."
cat > "$APP_DIR/.env" << EOF
DATABASE_URL="mysql://${DB_USER}:${DB_PASS}@localhost:3306/${DB_NAME}"
WEB_TOKEN="${WEB_TOKEN}"
PORT=${PORT}
EOF

# --- 8. Prisma migrate ---
log "Menjalankan Prisma migrate..."
npx prisma db push --skip-generate > /dev/null 2>&1
npx prisma generate > /dev/null 2>&1
log "Database schema tersinkronisasi"

# --- 9. Build Next.js ---
log "Build aplikasi Next.js..."
npm run build > /dev/null 2>&1
log "Build selesai"

# --- 10. Firewall ---
if command -v ufw &> /dev/null; then
  ufw allow ${PORT}/tcp > /dev/null 2>&1 || true
  if [ -n "$DOMAIN" ]; then
    ufw allow 'Nginx Full' > /dev/null 2>&1 || true
  fi
  log "Port ${PORT} dibuka di firewall"
fi

# --- 11. Systemd service ---
log "Membuat systemd service..."
cat > /etc/systemd/system/shopee-dashboard.service << EOF
[Unit]
Description=Shopee Dashboard (Next.js)
After=network.target mysql.service

[Service]
Type=simple
User=root
WorkingDirectory=${APP_DIR}
ExecStart=$(which node) ${APP_DIR}/node_modules/.bin/next start -p ${PORT} -H 0.0.0.0
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
EnvironmentFile=${APP_DIR}/.env

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable shopee-dashboard > /dev/null 2>&1
systemctl restart shopee-dashboard
log "Service 'shopee-dashboard' berjalan"

# --- 12. Nginx + SSL (opsional, jika DOMAIN di-set) ---
if [ -n "$DOMAIN" ]; then
  log "Menyiapkan Nginx untuk domain: ${DOMAIN}"

  # Install Nginx jika belum ada
  if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx > /dev/null 2>&1
  fi

  # Install Certbot jika belum ada
  if ! command -v certbot &> /dev/null; then
    apt-get install -y certbot python3-certbot-nginx > /dev/null 2>&1
  fi

  # Nginx config
  cat > /etc/nginx/sites-available/shopee-dashboard << EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
        proxy_buffering off;
    }
}
EOF

  ln -sf /etc/nginx/sites-available/shopee-dashboard /etc/nginx/sites-enabled/
  rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
  nginx -t > /dev/null 2>&1 && systemctl reload nginx

  # SSL
  log "Memasang SSL certificate..."
  certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m "${EMAIL}" > /dev/null 2>&1 && \
    log "SSL berhasil dipasang" || \
    warn "SSL gagal (pastikan DNS domain sudah mengarah ke IP ini)"
else
  log "Tanpa domain — akses via IP:${PORT}"
fi

# --- Done! ---
echo ""
echo "=========================================="
echo -e "  ${GREEN}Deploy selesai!${NC}"
echo "=========================================="
echo ""
if [ -n "$DOMAIN" ]; then
  echo -e "  URL:   ${GREEN}https://${DOMAIN}/?token=${WEB_TOKEN}${NC}"
else
  IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
  echo -e "  URL:   ${GREEN}http://${IP}:${PORT}/?token=${WEB_TOKEN}${NC}"
fi
echo ""
echo "  Service:  systemctl status shopee-dashboard"
echo "  Logs:     journalctl -u shopee-dashboard -f"
echo "  Restart:  systemctl restart shopee-dashboard"
echo ""
