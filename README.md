# Shopee Order Scraper Dashboard

Dashboard modern untuk scraping dan rekap pesanan Shopee Seller Center.

**Stack:** Next.js 14 · Tailwind CSS · MySQL · Prisma · SSE Realtime

## Fitur

- **Scrape pesanan** — Tarik data dari Shopee (API mode / browser)
- **Rekap penghasilan** — Gross, net, breakdown biaya otomatis
- **Modal & laba** — Input HPP per produk, hitung laba bersih
- **Upload cookies** — Netscape / JSON format
- **Multi-user** — Token akses terpisah per pengguna
- **Realtime log** — Live streaming via SSE
- **Responsive** — Sidebar collapsible, mobile-friendly

## Deploy (1 Command)

### Tanpa domain (akses via IP:port)

```bash
bash deploy.sh
```

### Dengan domain + SSL

```bash
DOMAIN=shop.example.com EMAIL=kamu@gmail.com bash deploy.sh
```

### Custom token

```bash
WEB_TOKEN=tokenrahasiaku bash deploy.sh
```

## Akses

Setelah deploy selesai:

```
http://<IP>:4321/?token=adminrahasia123
```

atau jika pakai domain:

```
https://shop.example.com/?token=adminrahasia123
```

## Yang dilakukan deploy.sh

1. Install Node.js 20 (skip jika sudah ada)
2. Install MySQL (skip jika sudah ada)
3. Buat database + user
4. Install npm dependencies
5. Setup Prisma schema
6. Build Next.js
7. Buka port 4321 di firewall
8. Buat systemd service (auto-start)
9. (Opsional) Setup Nginx + Certbot SSL

## Perintah Berguna

```bash
# Status service
systemctl status shopee-dashboard

# Lihat log realtime
journalctl -u shopee-dashboard -f

# Restart
systemctl restart shopee-dashboard

# Stop
systemctl stop shopee-dashboard
```

## Development

```bash
npm install
cp .env.example .env  # edit sesuai kebutuhan
npx prisma db push
npm run dev
```

Buka `http://localhost:4321/?token=adminrahasia123`

## Struktur

```
src/
├── app/(dashboard)/     # Halaman (Dashboard, Scrape, Riwayat, dll)
├── app/api/             # API routes
├── components/          # UI components
│   └── layout/          # Sidebar, Header, Context
└── lib/                 # Auth, Prisma, SSE, utils
```

## Environment Variables

| Variable | Default | Keterangan |
|----------|---------|------------|
| `DATABASE_URL` | `mysql://shopee:shopee123@localhost:3306/shopee_dashboard` | Koneksi MySQL |
| `WEB_TOKEN` | `adminrahasia123` | Token admin untuk akses |
| `PORT` | `4321` | Port server |
