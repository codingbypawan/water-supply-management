const cron = require('node-cron');
const webpush = require('web-push');
const { Op } = require('sequelize');
const { Event, User, Customer, Plant } = require('../models');
const env = require('../config/environment');

// Configure web-push with VAPID keys
if (env.vapid.publicKey && env.vapid.privateKey) {
  webpush.setVapidDetails(
    env.vapid.subject,
    env.vapid.publicKey,
    env.vapid.privateKey
  );
}

/**
 * Send push notification to a user
 */
const sendPushToUser = async (user, payload) => {
  if (!user.push_subscription) return;

  try {
    const subscription = JSON.parse(user.push_subscription);
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (error) {
    // If subscription is expired/invalid (410 Gone), clear it
    if (error.statusCode === 410 || error.statusCode === 404) {
      await User.update({ push_subscription: null }, { where: { id: user.id } });
    }
    console.error(`Push failed for user ${user.id}:`, error.message);
  }
};

/**
 * Check for today's events and notify relevant plant admins/tenant admins
 */
const notifyTodayEvents = async () => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Find all events scheduled for today that are approved/pending
    const events = await Event.findAll({
      where: {
        event_date: today,
        status: { [Op.in]: ['pending', 'approved'] },
      },
      include: [
        { model: Customer, as: 'customer', attributes: ['name', 'phone'] },
      ],
      order: [['event_date', 'ASC']],
    });

    if (events.length === 0) return;

    // Group events by plant_id
    const eventsByPlant = {};
    for (const event of events) {
      const pid = event.plant_id;
      if (!eventsByPlant[pid]) eventsByPlant[pid] = [];
      eventsByPlant[pid].push(event);
    }

    // For each plant, notify admins who have push subscriptions
    for (const [plantId, plantEvents] of Object.entries(eventsByPlant)) {
      const plant = await Plant.findByPk(plantId, { attributes: ['id', 'name', 'tenant_id'] });
      if (!plant) continue;

      // Find users with push subscriptions for this plant (admins)
      const users = await User.findAll({
        where: {
          tenant_id: plant.tenant_id,
          [Op.or]: [
            { plant_id: plantId },
            { role: { [Op.in]: ['tenant_admin', 'platform_admin'] } },
          ],
          push_subscription: { [Op.ne]: null },
          status: 'active',
        },
      });

      if (users.length === 0) continue;

      // Build notification
      const eventCount = plantEvents.length;
      const eventList = plantEvents.map((e) => {
        const name = e.customer?.name || e.customer_name || 'Unknown';
        const type = (e.event_type || 'event').replace('_', ' ');
        return `• ${name} — ${type}`;
      }).join('\n');

      const payload = {
        title: `📅 ${eventCount} Event${eventCount > 1 ? 's' : ''} Today — ${plant.name}`,
        body: eventList,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: `events-today-${plantId}-${today}`,
        data: {
          url: '/events',
          plantId,
          date: today,
        },
      };

      // Send to all subscribed users
      for (const user of users) {
        await sendPushToUser(user, payload);
      }

      console.log(`📨 Sent event notifications to ${users.length} user(s) for plant ${plant.name}`);
    }
  } catch (error) {
    console.error('Event notification cron error:', error);
  }
};

/**
 * Start the event notification scheduler
 * Runs at 8:00 AM, 10:00 AM, and 12:00 PM daily
 */
const startEventNotificationCron = () => {
  if (!env.vapid.publicKey || !env.vapid.privateKey) {
    console.log('⚠️  VAPID keys not configured — push notifications disabled');
    return;
  }

  // 8:00 AM
  cron.schedule('0 8 * * *', () => {
    console.log('🔔 Running 8 AM event notification check...');
    notifyTodayEvents();
  });

  // 10:00 AM
  cron.schedule('0 10 * * *', () => {
    console.log('🔔 Running 10 AM event notification check...');
    notifyTodayEvents();
  });

  // 12:00 PM
  cron.schedule('0 12 * * *', () => {
    console.log('🔔 Running 12 PM event notification check...');
    notifyTodayEvents();
  });

  console.log('✅ Event notification cron scheduled (8 AM, 10 AM, 12 PM)');
};

module.exports = { startEventNotificationCron, notifyTodayEvents };
