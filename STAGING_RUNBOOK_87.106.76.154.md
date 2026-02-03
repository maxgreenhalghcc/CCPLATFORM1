# CCPLATFORM1 — Staging setup on 87.106.76.154 (IONOS)

## Current blocker: SSH from Max IP is blocked
Your public IP (example): `138.248.244.167`

### Unblock via IONOS Console (no SSH needed)
In IONOS Cloud Panel → Servers → select VPS → **Actions** → **Remote Console / KVM / VNC**.
Then run as root:
```bash
fail2ban-client set sshd unbanip 138.248.244.167
# optional allowlist:
# echo "ignoreip = 127.0.0.1/8 138.248.244.167" >> /etc/fail2ban/jail.local
# systemctl restart fail2ban
```

## After SSH is restored: install MySQL + create staging DB
Run on 87.106.76.154:
```bash
sudo apt-get update
sudo apt-get install -y mysql-server

sudo mysql -e "CREATE DATABASE IF NOT EXISTS custom_cocktails_staging;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'cc_stage'@'localhost' IDENTIFIED BY 'CHANGE_ME_STRONG';"
sudo mysql -e "GRANT ALL PRIVILEGES ON custom_cocktails_staging.* TO 'cc_stage'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

## Nginx reverse proxy + SSL
We will run:
- web (Next) on `127.0.0.1:3100`
- api (Nest) on `127.0.0.1:4100`

### Nginx site: staging.custom-cocktails.co.uk
Create `/etc/nginx/sites-available/ccplatform1-staging-web`:
```nginx
server {
  server_name staging.custom-cocktails.co.uk;
  location / {
    proxy_pass http://127.0.0.1:3100;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

### Nginx site: staging-api.custom-cocktails.co.uk
Create `/etc/nginx/sites-available/ccplatform1-staging-api`:
```nginx
server {
  server_name staging-api.custom-cocktails.co.uk;
  location / {
    proxy_pass http://127.0.0.1:4100;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Enable + reload:
```bash
sudo ln -sf /etc/nginx/sites-available/ccplatform1-staging-web /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/ccplatform1-staging-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### SSL (Certbot)
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d staging.custom-cocktails.co.uk -d staging-api.custom-cocktails.co.uk
```

## App env (staging)
Staging will point to same recipe endpoint contract (`/generate`) via Render:
- `RECIPE_URL=https://ccrecipebuilder.onrender.com`

Web must set:
- `NEXTAUTH_URL=https://staging.custom-cocktails.co.uk`
- `NEXT_PUBLIC_API_URL=https://staging-api.custom-cocktails.co.uk/v1`
- `NEXT_PUBLIC_API_BASE_URL=https://staging-api.custom-cocktails.co.uk`

API must set:
- `API_PORT=4100`
- `CORS_ORIGINS=https://staging.custom-cocktails.co.uk`
- `DATABASE_URL=mysql://cc_stage:CHANGE_ME_STRONG@127.0.0.1:3306/custom_cocktails_staging`
- `RECIPE_URL=https://ccrecipebuilder.onrender.com`

## Notes
- Rotate secrets posted in chat (NEXTAUTH_SECRET) after staging is stable.
- Prefer Stripe test keys on staging.
