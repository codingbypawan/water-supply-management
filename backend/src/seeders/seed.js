require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, Tenant, TenantConfig, Plant, PlantConfig, User, SubscriptionPlan, TenantSubscription, Rate, Customer } = require('../models');

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

    // ── 4. Create Users ──
    const passwordHash = await bcrypt.hash('admin123', 12);

    // Platform Admin
    await User.create({
      tenant_id: tenant1.id,
      phone: '9999999999',
      password_hash: passwordHash,
      name: 'Platform Admin',
      role: 'platform_admin',
    });

    // Tenant Admin
    await User.create({
      tenant_id: tenant1.id,
      phone: '9888888888',
      password_hash: passwordHash,
      name: 'Jalpani Admin',
      role: 'tenant_admin',
    });

    // Plant Admin
    await User.create({
      tenant_id: tenant1.id,
      plant_id: plant1.id,
      phone: '9777777777',
      password_hash: passwordHash,
      name: 'Plant Manager',
      role: 'plant_admin',
    });

    console.log('✅ Users created');

    // ── 5. Create Demo Tenant 2: AquaFlow ──
    const tenant2 = await Tenant.create({
      name: 'AquaFlow Solutions',
      slug: 'aquaflow',
      domain: 'aquaflow.localhost',
      tagline: 'Water for Everyone',
      primary_color: '#059669',
      secondary_color: '#10B981',
    });

    await TenantConfig.create({
      tenant_id: tenant2.id,
      online_payment_enabled: false,
      allow_event_booking: true,
    });

    await TenantSubscription.create({
      tenant_id: tenant2.id,
      plan_id: basicPlan.id,
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      status: 'active',
    });

    const plant2 = await Plant.create({
      tenant_id: tenant2.id,
      name: 'AquaFlow Central',
      address: '456 Stream Ave, Delhi',
      phone: '9666666666',
      primary_color: '#059669',
      secondary_color: '#10B981',
    });

    await PlantConfig.create({
      tenant_id: tenant2.id,
      plant_id: plant2.id,
      distribution_type: 'container',
    });

    await Rate.create({
      tenant_id: tenant2.id,
      plant_id: plant2.id,
      rate_per_unit: 25.00,
      unit_type: 'container',
      effective_from: '2026-01-01',
      status: 'active',
    });

    const passwordHash2 = await bcrypt.hash('admin123', 12);
    await User.create({
      tenant_id: tenant2.id,
      phone: '9555555555',
      password_hash: passwordHash2,
      name: 'AquaFlow Admin',
      role: 'tenant_admin',
    });

    await User.create({
      tenant_id: tenant2.id,
      plant_id: plant2.id,
      phone: '9444444444',
      password_hash: passwordHash2,
      name: 'AquaFlow Plant Manager',
      role: 'plant_admin',
    });

    console.log('✅ Tenant "AquaFlow" created');

    // ── 6. Create sample customers with login accounts ──
    const sampleCustomers = [
      { name: 'Rahul Sharma', phone: '9111111111', address: 'Block A, Sector 12' },
      { name: 'Priya Patel', phone: '9111111112', address: 'Block B, Sector 15' },
      { name: 'Amit Kumar', phone: '9111111113', address: 'Block C, Sector 8' },
      { name: 'Sneha Gupta', phone: '9111111114', address: 'Block D, Sector 20' },
      { name: 'Vikram Singh', phone: '9111111115', address: 'Block E, Sector 5' },
    ];

    for (const cust of sampleCustomers) {
      // Create User account with role 'customer' and password = phone
      const custPasswordHash = await bcrypt.hash(cust.phone, 12);
      const custUser = await User.create({
        tenant_id: tenant1.id,
        plant_id: plant1.id,
        phone: cust.phone,
        password_hash: custPasswordHash,
        name: cust.name,
        role: 'customer',
      });

      await Customer.create({
        tenant_id: tenant1.id,
        plant_id: plant1.id,
        ...cust,
        user_id: custUser.id,
        default_container_count: Math.floor(Math.random() * 3) + 1,
        outstanding_balance: Math.floor(Math.random() * 500) + 100,
      });
    }

    console.log('✅ Sample customers created');

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('─────────────────────────────');
    console.log('Platform Admin:  9999999999 / admin123');
    console.log('Tenant Admin:    9888888888 / admin123');
    console.log('Plant Admin:     9777777777 / admin123');
    console.log('AquaFlow Admin:  9555555555 / admin123');
    console.log('AquaFlow Plant:  9444444444 / admin123');
    console.log('─────────────────────────────');
    console.log('\n📋 Customer Logins (password = phone):');
    console.log('─────────────────────────────');
    console.log('Rahul Sharma:    9111111111 / 9111111111');
    console.log('Priya Patel:     9111111112 / 9111111112');
    console.log('Amit Kumar:      9111111113 / 9111111113');
    console.log('Sneha Gupta:     9111111114 / 9111111114');
    console.log('Vikram Singh:    9111111115 / 9111111115');
    console.log('─────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
