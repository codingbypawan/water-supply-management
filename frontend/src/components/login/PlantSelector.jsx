import React, { useState } from 'react';

export default function PlantSelector({ plants = [], onSelect }) {
  const [search, setSearch] = useState('');

  const filteredPlants = (plants || []).filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.tenantName && p.tenantName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 bg-blue-50 flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 3c-1.5 4-6 7.5-6 11a6 6 0 0012 0c0-3.5-4.5-7-6-11z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Select Your Plant</h2>
        <p className="text-gray-500 mt-1">Choose your water supply plant to continue</p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search plants..."
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
        />
      </div>

      {/* Plant List */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {filteredPlants.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No plants found</p>
          </div>
        ) : (
          filteredPlants.map((plant) => (
            <button
              key={plant.id}
              onClick={() => onSelect(plant)}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 text-left group"
            >
              {/* Plant Icon/Logo */}
              {plant.logo_url ? (
                <img
                  src={plant.logo_url}
                  alt={plant.name}
                  className="w-12 h-12 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  style={{
                    backgroundColor: plant.primary_color || plant.tenantPrimaryColor || '#1E40AF',
                  }}
                >
                  {plant.name.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 truncate">
                  {plant.name}
                </h3>
                {plant.tenantName && (
                  <p className="text-sm text-gray-500 truncate">{plant.tenantName}</p>
                )}
                {plant.tagline && (
                  <p className="text-xs text-gray-400 truncate mt-0.5">{plant.tagline}</p>
                )}
              </div>

              <svg
                className="w-5 h-5 text-gray-300 group-hover:text-blue-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
