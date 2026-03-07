require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, Tenant, TenantConfig, Plant, PlantConfig, User, SubscriptionPlan, TenantSubscription, Rate } = require('../models');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Sync all models
    await sequelize.sync({ force: true });
    console.log('Tables created');

    // ── 1. Create Subscription Plans ──
    const basicPlan = await SubscriptionPlan.create({
      name: 'Basic',
      description: '1 Plant, Max 1000 customers',
      max_plants: 1,
      max_customers_per_plant: 1000,
      features: { online_payment: false, event_reminders: false, salary_module: false },
      price_monthly: 499,
      price_yearly: 4999,
      billing_model: 'per_tenant',
    });

    const proPlan = await SubscriptionPlan.create({
      name: 'Pro',
      description: 'Multiple plants, All features',
      max_plants: 5,
      max_customers_per_plant: 5000,
      features: { online_payment: true, event_reminders: true, salary_module: true, pwa_notifications: true },
      price_monthly: 999,
      price_yearly: 9999,
      billing_model: 'per_tenant',
    });

    const enterprisePlan = await SubscriptionPlan.create({
      name: 'Enterprise',
      description: 'Unlimited plants, Custom integrations',
      max_plants: -1,
      max_customers_per_plant: -1,
      features: { online_payment: true, event_reminders: true, salary_module: true, pwa_notifications: true, custom_integrations: true },
      price_monthly: 2999,
      price_yearly: 29999,
      billing_model: 'per_tenant',
    });

    console.log('✅ Subscription plans created');

    // ── 2. Create Demo Tenant: Jalpani ──
    const tenant1 = await Tenant.create({
      name: 'Jalpani Water Supply',
      slug: 'jalpani',
      domain: 'jalpani.localhost',
      logo_url: null,
      tagline: 'Pure Water, Pure Life',
      primary_color: '#1E40AF',
      secondary_color: '#3B82F6',
    });

    await TenantConfig.create({
      tenant_id: tenant1.id,
      online_payment_enabled: true,
      allow_event_booking: true,
      allow_partial_payments: true,
      enable_salary_module: true,
    });

    // Subscribe tenant
    await TenantSubscription.create({
      tenant_id: tenant1.id,
      plan_id: proPlan.id,
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      status: 'active',
    });

    console.log('✅ Tenant "Jalpani" created');

    // ── 3. Create Plant ──
    const plant1 = await Plant.create({
      tenant_id: tenant1.id,
      name: 'Jalpani Main Plant',
      address: '123 Water Street, Mumbai',
      phone: '9876543210',
      tagline: 'Serving clean water since 2020',
      primary_color: '#1E40AF',
      secondary_color: '#3B82F6',
    });

    await PlantConfig.create({
      tenant_id: tenant1.id,
      plant_id: plant1.id,
      online_payment_enabled: true,
      distribution_type: 'container',
      event_booking_enabled: true,
      require_event_approval: true,
      auto_payment_reminder: true,
    });

    // Create rate
    await Rate.create({
      tenant_id: tenant1.id,
      plant_id: plant1.id,
      rate_per_unit: 30.00,
      unit_type: 'container',
      effective_from: '2026-01-01',
      status: 'active',
    });

    console.log('✅ Plant created');

    // ── 4. Create Platform Admin ──
    const passwordHash = await bcrypt.hash('admin123', 12);

    await User.create({
      phone: '9999999999',
      password_hash: passwordHash,
      name: 'Platform Admin',
      role: 'platform_admin',
    });

    console.log('✅ Platform Admin created');

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('─────────────────────────────');
    console.log('Platform Admin:  9999999999 / admin123');
    console.log('─────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
