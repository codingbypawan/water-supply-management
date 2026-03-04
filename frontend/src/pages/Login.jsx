import React from 'react';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import BrandingPanel from '../components/login/BrandingPanel';
import LoginForm from '../components/login/LoginForm';
import PlantSelector from '../components/login/PlantSelector';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Login() {
  const { tenant, selectedPlant, plants, loading, selectPlant } = useTenant();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Already logged in — redirect
  React.useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner message="Detecting your plant..." />
      </div>
    );
  }

  // No tenant detected from domain — show plant selector
  const showPlantSelector = !tenant?.id;

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left — Branding Panel (visible only on lg+ when tenant is known) */}
      {tenant?.id && <BrandingPanel tenant={tenant} plant={selectedPlant} />}

      {/* Right — Form area */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        {showPlantSelector ? (
          <PlantSelector
            plants={plants}
            onSelect={(plant) => selectPlant(plant)}
          />
        ) : (
          <LoginForm
            onSuccess={() => navigate('/dashboard', { replace: true })}
          />
        )}
      </div>
    </div>
  );
}
