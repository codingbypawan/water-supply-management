const { Tenant, Plant } = require('../models');
const ApiResponse = require('../utils/response');

/**
 * Tenant Resolution Middleware
 * Resolves tenant from:
 * 1. Custom domain
 * 2. Subdomain (slug)
 * 3. X-Tenant-ID header (fallback)
 * 4. Query param ?tenantId=
 */
const tenantResolver = async (req, res, next) => {
  try {
    let tenant = null;

    // 1. Try custom domain
    const hostname = req.hostname;
    if (hostname && hostname !== 'localhost') {
      tenant = await Tenant.findOne({ where: { domain: hostname, status: 'active' } });

      // 2. Try subdomain / slug
      if (!tenant) {
        const parts = hostname.split('.');
        if (parts.length > 1) {
          const subdomain = parts[0];
          if (subdomain !== 'www' && subdomain !== 'app' && subdomain !== 'api') {
            tenant = await Tenant.findOne({ where: { slug: subdomain, status: 'active' } });
          }
        }
      }
    }

    // 3. Try X-Tenant-ID header
    if (!tenant) {
      const tenantId = req.headers['x-tenant-id'];
      if (tenantId) {
        tenant = await Tenant.findOne({ where: { id: tenantId, status: 'active' } });
      }
    }

    // 4. Try query param
    if (!tenant && req.query.tenantId) {
      tenant = await Tenant.findOne({ where: { id: req.query.tenantId, status: 'active' } });
    }

    // Set tenant context on request (can be null for branding/plant-list endpoints)
    req.tenant = tenant;
    req.tenantId = tenant ? tenant.id : null;

    next();
  } catch (error) {
    console.error('Tenant resolution error:', error);
    return ApiResponse.error(res, 'Tenant resolution failed');
  }
};

/**
 * Require tenant to be resolved - use after tenantResolver
 */
const requireTenant = (req, res, next) => {
  if (!req.tenant) {
    return ApiResponse.badRequest(res, 'Tenant could not be resolved. Please select a plant or check your domain.');
  }
  if (req.tenant.status !== 'active') {
    return ApiResponse.forbidden(res, 'Tenant is suspended or expired');
  }
  next();
};

module.exports = { tenantResolver, requireTenant };
