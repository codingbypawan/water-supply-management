#!/bin/bash
# Usage: ./init-ssl.sh <email> <domain1> <domain2> ...
# Example: ./init-ssl.sh admin@gurukulsetu.in wsm.gurukulsetu.in jalpani.gurukulsetu.in

EMAIL=$1
shift
DOMAINS=("$@")

if [ -z "$EMAIL" ] || [ ${#DOMAINS[@]} -eq 0 ]; then
  echo "Usage: ./init-ssl.sh <email> <domain1> <domain2> ..."
  echo "Example: ./init-ssl.sh admin@gurukulsetu.in wsm.gurukulsetu.in jalpani.gurukulsetu.in"
  exit 1
fi

# Build -d flags for certbot
DOMAIN_ARGS=""
CORS_LIST=""
for d in "${DOMAINS[@]}"; do
  DOMAIN_ARGS="$DOMAIN_ARGS -d $d"
  CORS_LIST="${CORS_LIST:+$CORS_LIST,}https://$d"
done

echo "==> Domains: ${DOMAINS[*]}"
echo "==> CORS origins: $CORS_LIST"
echo ""

# Step 1: Create temporary HTTP-only nginx config for cert challenge
echo "==> Setting up HTTP-only nginx for certificate challenge..."
cp nginx/default.conf nginx/default.conf.bak

cat > nginx/default.conf <<EOF
server {
    listen 80;
    server_name *.gurukulsetu.in gurukulsetu.in;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://frontend:80;
    }
}
EOF

# Step 2: Start services
echo "==> Starting containers..."
CORS_ORIGINS=$CORS_LIST docker compose up -d --build

echo "==> Waiting for nginx to start..."
sleep 10

# Step 3: Request certificate (--cert-name keeps a consistent directory name)
echo "==> Requesting SSL certificate for: ${DOMAINS[*]}"
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  --cert-name gurukulsetu.in \
  $DOMAIN_ARGS

# Step 4: Restore full SSL nginx config
echo "==> Restoring SSL nginx config..."
mv nginx/default.conf.bak nginx/default.conf

# Step 5: Restart nginx with SSL
echo "==> Restarting nginx with SSL..."
CORS_ORIGINS=$CORS_LIST docker compose up -d nginx-proxy

echo ""
echo "========================================="
echo "  SSL setup complete!"
echo "  Live at:"
for d in "${DOMAINS[@]}"; do
  echo "    https://$d"
done
echo ""
echo "  To ADD a new subdomain later:"
echo "    1. Add A record in GoDaddy: <subdomain> -> 15.206.27.6"
echo "    2. Re-run: ./init-ssl.sh $EMAIL ${DOMAINS[*]} newsubdomain.gurukulsetu.in"
echo ""
echo "  Auto-renew cron:"
echo "    0 0 1 * * cd $(pwd) && docker compose run --rm certbot renew && docker compose restart nginx-proxy"
echo "========================================="
