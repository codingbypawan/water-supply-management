const { Tenant, Plant } = require('../models');
const ApiResponse = require('../utils/response');

/**
 * Generate a dynamic SVG icon with plant/tenant initial and brand color.
 * Used as PWA icon when no logo_url is available.
 */
const generateSvgIcon = (name, color, size) => {
  const initial = (name || 'W').charAt(0).toUpperCase();
  const fontSize = Math.round(size * 0.45);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="${color || '#1E40AF'}"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
    font-family="system-ui,-apple-system,sans-serif" font-weight="700"
    font-size="${fontSize}" fill="#ffffff">${initial}</text>
  <path d="M${size * 0.5} ${size * 0.78} c-${size * 0.06} 0 -${size * 0.1} -${size * 0.04} -${size * 0.1} -${size * 0.08}
    c0-${size * 0.06} ${size * 0.1}-${size * 0.16} ${size * 0.1}-${size * 0.16}
    s${size * 0.1} ${size * 0.1} ${size * 0.1} ${size * 0.16}
    c0 ${size * 0.04}-${size * 0.04} ${size * 0.08}-${size * 0.1} ${size * 0.08}z"
    fill="rgba(255,255,255,0.3)"/>
</svg>`;
};

/**
 * GET /api/v1/pwa/manifest
 * Returns a dynamic Web App Manifest based on domain, tenant, or plant.
 * Query params: ?domain=, ?tenantId=, ?plantId=
 */
exports.getManifest = async (req, res, next) => {
  try {
    const { domain, tenantId, plantId } = req.query;
    let tenant = null;
    let plant = null;

    // 1. Try plant first (most specific)
    if (plantId) {
      plant = await Plant.findByPk(plantId);
      if (plant) {
        tenant = await Tenant.findByPk(plant.tenant_id);
      }
    }

    // 2. Try tenant ID
    if (!tenant && tenantId) {
      tenant = await Tenant.findByPk(tenantId);
    }

    // 3. Try domain resolution
    if (!tenant && domain && domain !== 'localhost') {
      tenant = await Tenant.findOne({ where: { domain, status: 'active' } });

      if (!tenant) {
        const parts = domain.split('.');
        if (parts.length > 1) {
          const subdomain = parts[0];
          if (!['www', 'app', 'api'].includes(subdomain)) {
            tenant = await Tenant.findOne({ where: { slug: subdomain, status: 'active' } });
          }
        }
      }
    }

    // Determine manifest values (plant overrides tenant)
    const name = plant?.name || tenant?.name || 'Water Supply Management';
    const shortName = (plant?.name || tenant?.name || 'WaterSupply').substring(0, 12);
    const themeColor = plant?.primary_color || tenant?.primary_color || '#1E40AF';
    const backgroundColor = '#ffffff';
    const description = plant?.tagline || tenant?.tagline || 'Water Supply Management System';

    // Build icon URLs
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const iconParams = new URLSearchParams();
    if (plantId) iconParams.set('plantId', plantId);
    else if (tenantId) iconParams.set('tenantId', tenantId);
    else if (domain) iconParams.set('domain', domain);

    const logoUrl = plant?.logo_url || tenant?.logo_url;

    const icons = [192, 512].map((size) => {
      if (logoUrl) {
        // If logo_url is an absolute URL, use it directly
        return {
          src: logoUrl,
          sizes: `${size}x${size}`,
          type: 'image/png',
          purpose: 'any',
        };
      }
      // Use dynamic SVG icon endpoint
      return {
        src: `${baseUrl}/api/v1/pwa/icon/${size}?${iconParams.toString()}`,
        sizes: `${size}x${size}`,
        type: 'image/svg+xml',
        purpose: 'any',
      };
    });

    // Also add maskable icons
    icons.push(
      ...([192, 512].map((size) => {
        if (logoUrl) {
          return {
            src: logoUrl,
            sizes: `${size}x${size}`,
            type: 'image/png',
            purpose: 'maskable',
          };
        }
        return {
          src: `${baseUrl}/api/v1/pwa/icon/${size}?${iconParams.toString()}&maskable=1`,
          sizes: `${size}x${size}`,
          type: 'image/svg+xml',
          purpose: 'maskable',
        };
      }))
    );

    const manifest = {
      name,
      short_name: shortName,
      description,
      icons,
      start_url: '/',
      scope: '/',
      display: 'standalone',
      orientation: 'portrait',
      theme_color: themeColor,
      background_color: backgroundColor,
      categories: ['business', 'utilities'],
      prefer_related_applications: false,
    };

    res.set('Content-Type', 'application/manifest+json');
    res.set('Cache-Control', 'public, max-age=3600');
    return res.json(manifest);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/pwa/icon/:size
 * Generates a dynamic SVG icon for PWA based on plant/tenant branding.
 * Query params: ?plantId=, ?tenantId=, ?domain=, ?maskable=1
 */
exports.getIcon = async (req, res, next) => {
  try {
    const size = parseInt(req.params.size, 10) || 192;
    const { plantId, tenantId, domain, maskable } = req.query;
    let name = 'Water Supply';
    let color = '#1E40AF';

    // Resolve plant or tenant
    if (plantId) {
      const plant = await Plant.findByPk(plantId);
      if (plant) {
        name = plant.name;
        color = plant.primary_color || color;
      }
    } else if (tenantId) {
      const tenant = await Tenant.findByPk(tenantId);
      if (tenant) {
        name = tenant.name;
        color = tenant.primary_color || color;
      }
    } else if (domain && domain !== 'localhost') {
      let tenant = await Tenant.findOne({ where: { domain, status: 'active' } });
      if (!tenant) {
        const parts = domain.split('.');
        if (parts.length > 1) {
          const subdomain = parts[0];
          if (!['www', 'app', 'api'].includes(subdomain)) {
            tenant = await Tenant.findOne({ where: { slug: subdomain, status: 'active' } });
          }
        }
      }
      if (tenant) {
        name = tenant.name;
        color = tenant.primary_color || color;
      }
    }

    const svg = generateSvgIcon(name, color, size);

    res.set('Content-Type', 'image/svg+xml');
    res.set('Cache-Control', 'public, max-age=86400');
    return res.send(svg);
  } catch (error) {
    next(error);
  }
};
