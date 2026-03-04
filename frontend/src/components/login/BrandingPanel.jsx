import React from 'react';

export default function BrandingPanel({ tenant, plant }) {
  const name = plant?.name || tenant?.name || 'Water Supply Management';
  const tagline = plant?.tagline || tenant?.tagline || 'Manage your water supply efficiently';
  const logoUrl = plant?.logo_url || tenant?.logo_url;
  const primaryColor = plant?.primary_color || tenant?.primary_color || '#1E40AF';
  const secondaryColor = plant?.secondary_color || tenant?.secondary_color || '#3B82F6';

  return (
    <div
      className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
      }}
    >
      {/* Background decorative circles */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/5 rounded-full" />

      <div className="relative z-10 text-center">
        {/* Logo */}
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={name}
            className="w-32 h-32 rounded-full mx-auto mb-8 object-cover border-4 border-white/30 shadow-2xl"
          />
        ) : (
          <div className="w-32 h-32 rounded-full mx-auto mb-8 bg-white/20 flex items-center justify-center border-4 border-white/30 shadow-2xl">
            <svg
              className="w-16 h-16 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 3c-1.5 4-6 7.5-6 11a6 6 0 0012 0c0-3.5-4.5-7-6-11z"
              />
            </svg>
          </div>
        )}

        {/* Plant/Tenant Name */}
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
          {name}
        </h1>

        {/* Tagline */}
        <p className="text-xl text-white/80 mb-8 max-w-md leading-relaxed">
          {tagline}
        </p>

        {/* Feature highlights */}
        <div className="space-y-3 text-left max-w-sm mx-auto">
          {[
            'Simple daily water distribution',
            'Track payments & outstanding',
            'Event booking & reminders',
            'Real-time reports & analytics',
          ].map((feature, idx) => (
            <div key={idx} className="flex items-center gap-3 text-white/90">
              <svg className="w-5 h-5 flex-shrink-0 text-white/70" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom text */}
      <div className="absolute bottom-8 text-white/50 text-xs">
        Powered by Water Supply Management SaaS
      </div>
    </div>
  );
}
