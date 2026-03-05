import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { updateManifest, updateBrowserMeta } from '../utils/pwa';

const TenantContext = createContext(null);

export function TenantProvider({ children }) {
  const [tenant, setTenant] = useState(null);
  const [plants, setPlants] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [brandingLoaded, setBrandingLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Resolve branding from domain on mount
  useEffect(() => {
    resolveBranding();
  }, []);

  const resolveBranding = async () => {
    try {
      setLoading(true);
      const hostname = window.location.hostname;

      // Try domain-based resolution
      const { data } = await api.get('/auth/branding', {
        params: { domain: hostname },
      });

      if (data.success && data.data.tenant) {
        const tenantData = data.data.tenant;
        setTenant(tenantData);
        setPlants(data.data.plants || []);
        applyBranding(tenantData.primary_color, tenantData.secondary_color);
        setBrandingLoaded(true);

        // Update PWA manifest & browser meta for this tenant
        updateManifest({ tenantId: tenantData.id });
        updateBrowserMeta({
          name: tenantData.name,
          themeColor: tenantData.primary_color,
          iconUrl: tenantData.logo_url,
        });

        // If only one plant, auto-select
        if (data.data.plants?.length === 1) {
          const autoPlant = data.data.plants[0];
          setSelectedPlant(autoPlant);
          // Prefer plant-specific PWA branding
          updateManifest({ plantId: autoPlant.id });
          updateBrowserMeta({
            name: autoPlant.name || tenantData.name,
            themeColor: autoPlant.primary_color || tenantData.primary_color,
            iconUrl: autoPlant.logo_url || tenantData.logo_url,
          });
        }
      } else {
        // Fallback: Load all tenants/plants for selection
        await loadAllPlants();
      }
    } catch (error) {
      console.error('Branding resolution failed:', error);
      await loadAllPlants();
    } finally {
      setLoading(false);
    }
  };

  const loadAllPlants = async () => {
    try {
      const { data } = await api.get('/auth/plants');
      if (data.success) {
        // Flatten plants from all tenants
        const allPlants = [];
        const tenants = data.data || [];

        tenants.forEach((t) => {
          (t.plants || []).forEach((p) => {
            allPlants.push({
              ...p,
              tenantId: t.id,
              tenantName: t.name,
              tenantSlug: t.slug,
              tenantLogo: t.logo_url,
              tenantPrimaryColor: t.primary_color,
              tenantSecondaryColor: t.secondary_color,
              tenantTagline: t.tagline,
              tenantPhone: t.phone,
            });
          });
        });

        setPlants(allPlants);
      }
    } catch (error) {
      console.error('Failed to load plants:', error);
    }
  };

  const resetTenant = () => {
    setTenant(null);
    setSelectedPlant(null);
    setPlants([]);
    setBrandingLoaded(false);
    document.documentElement.style.setProperty('--brand-primary', '#1E40AF');
    document.documentElement.style.setProperty('--brand-secondary', '#3B82F6');
    document.documentElement.style.setProperty('--brand-light', 'rgba(59, 130, 246, 0.1)');
  };

  const selectPlant = (plant) => {
    setSelectedPlant(plant);

    // If plant has tenant context (from fallback), set it
    if (plant.tenantId) {
      setTenant({
        id: plant.tenantId,
        name: plant.tenantName,
        slug: plant.tenantSlug,
        logo_url: plant.tenantLogo,
        primary_color: plant.tenantPrimaryColor || plant.primary_color,
        secondary_color: plant.tenantSecondaryColor || plant.secondary_color,
        tagline: plant.tenantTagline,
      });
      localStorage.setItem('tenantId', plant.tenantId);
    }

    const primaryColor = plant.primary_color || plant.tenantPrimaryColor || '#1E40AF';
    const secondaryColor = plant.secondary_color || plant.tenantSecondaryColor || '#3B82F6';
    applyBranding(primaryColor, secondaryColor);
    setBrandingLoaded(true);

    // Update PWA manifest & browser meta for the selected plant
    updateManifest({ plantId: plant.id, tenantId: plant.tenantId || plant.tenant_id });
    updateBrowserMeta({
      name: plant.name || plant.tenantName || 'Water Supply',
      themeColor: primaryColor,
      iconUrl: plant.logo_url || plant.tenantLogo,
    });
  };

  const applyBranding = (primaryColor, secondaryColor) => {
    document.documentElement.style.setProperty('--brand-primary', primaryColor || '#1E40AF');
    document.documentElement.style.setProperty('--brand-secondary', secondaryColor || '#3B82F6');

    // Calculate light variant
    const lightColor = hexToRgba(secondaryColor || '#3B82F6', 0.1);
    document.documentElement.style.setProperty('--brand-light', lightColor);
  };

  const hexToRgba = (hex, alpha) => {
    if (!hex) return 'rgba(59, 130, 246, 0.1)';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Also restore from localStorage
  useEffect(() => {
    const storedTenant = localStorage.getItem('tenant');
    const storedPlant = localStorage.getItem('plant');
    if (storedTenant && !tenant) {
      try {
        const t = JSON.parse(storedTenant);
        setTenant(t);
        applyBranding(t.primary_color, t.secondary_color);
        setBrandingLoaded(true);
        // Restore PWA branding from stored tenant
        updateManifest({ tenantId: t.id });
        updateBrowserMeta({
          name: t.name,
          themeColor: t.primary_color,
          iconUrl: t.logo_url,
        });
      } catch {}
    }
    if (storedPlant && !selectedPlant) {
      try {
        const p = JSON.parse(storedPlant);
        setSelectedPlant(p);
        // Prefer plant-specific PWA branding
        updateManifest({ plantId: p.id, tenantId: p.tenant_id });
        updateBrowserMeta({
          name: p.name,
          themeColor: p.primary_color,
          iconUrl: p.logo_url,
        });
      } catch {}
    }
  }, []);

  return (
    <TenantContext.Provider value={{
      tenant,
      plants,
      selectedPlant,
      selectPlant,
      resetTenant,
      loadAllPlants,
      brandingLoaded,
      loading,
      setTenant,
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant must be used within TenantProvider');
  return context;
}

export default TenantContext;
