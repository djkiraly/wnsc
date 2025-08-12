const db = require('../config/database');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Check if data already exists
    const existingUsers = await db.query('SELECT COUNT(*) FROM users');
    if (parseInt(existingUsers.rows[0].count) > 0) {
      console.log('📝 Database already contains data. Skipping seed.');
      return;
    }

    // Seed users
    const users = [
      {
        email: 'admin@wnsc.org',
        first_name: 'System',
        last_name: 'Administrator',
        role: 'admin',
        phone: '555-0001',
        organization: 'West Nebraska Sports Council'
      },
      {
        email: 'organizer@wnsc.org',
        first_name: 'Event',
        last_name: 'Organizer',
        role: 'organizer',
        phone: '555-0002',
        organization: 'West Nebraska Sports Council'
      },
      {
        email: 'member1@example.com',
        first_name: 'John',
        last_name: 'Smith',
        role: 'member',
        phone: '555-0003',
        organization: 'Local Athletic Club'
      },
      {
        email: 'member2@example.com',
        first_name: 'Sarah',
        last_name: 'Johnson',
        role: 'member',
        phone: '555-0004',
        organization: 'Community Sports Group'
      }
    ];

    const userIds = [];
    for (const user of users) {
      const result = await db.query(`
        INSERT INTO users (email, first_name, last_name, role, phone, organization, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'active')
        RETURNING id
      `, [user.email, user.first_name, user.last_name, user.role, user.phone, user.organization]);
      
      userIds.push(result.rows[0].id);
      console.log(`👤 Created user: ${user.first_name} ${user.last_name} (${user.role})`);
    }

    // Seed events
    const events = [
      {
        title: 'Annual Basketball Tournament',
        description: 'Our biggest basketball event of the year featuring teams from across West Nebraska.',
        event_type: 'tournament',
        location: 'West Nebraska Sports Complex',
        venue_details: 'Main gymnasium, courts 1-4',
        start_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        end_date: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000), // 32 days from now
        registration_deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        max_participants: 16,
        status: 'published',
        created_by: userIds[1] // organizer
      },
      {
        title: 'Board Meeting - March',
        description: 'Monthly board meeting to discuss upcoming events and budget allocations.',
        event_type: 'meeting',
        location: 'WNSC Office',
        venue_details: 'Conference Room A',
        start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 7 days + 2 hours
        max_participants: 15,
        status: 'published',
        created_by: userIds[0] // admin
      },
      {
        title: 'Youth Soccer Training Camp',
        description: 'Intensive training camp for young soccer players aged 10-16.',
        event_type: 'training',
        location: 'Regional Soccer Fields',
        venue_details: 'Fields 1-3, equipment provided',
        start_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        end_date: new Date(Date.now() + 47 * 24 * 60 * 60 * 1000), // 47 days from now
        registration_deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days from now
        max_participants: 50,
        status: 'draft',
        created_by: userIds[1] // organizer
      }
    ];

    const eventIds = [];
    for (const event of events) {
      const result = await db.query(`
        INSERT INTO events (title, description, event_type, location, venue_details, 
                           start_date, end_date, registration_deadline, max_participants, 
                           status, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `, [
        event.title, event.description, event.event_type, event.location,
        event.venue_details, event.start_date, event.end_date, event.registration_deadline,
        event.max_participants, event.status, event.created_by
      ]);
      
      eventIds.push(result.rows[0].id);
      console.log(`📅 Created event: ${event.title}`);
    }

    // Seed tasks
    const tasks = [
      {
        title: 'Reserve tournament courts',
        description: 'Contact venue manager to reserve basketball courts for the annual tournament',
        priority: 'high',
        status: 'pending',
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        assigned_to: userIds[1], // organizer
        created_by: userIds[0], // admin
        event_id: eventIds[0] // basketball tournament
      },
      {
        title: 'Order tournament trophies',
        description: 'Order trophies for 1st, 2nd, and 3rd place teams',
        priority: 'medium',
        status: 'pending',
        due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        assigned_to: userIds[1], // organizer
        created_by: userIds[0], // admin
        event_id: eventIds[0] // basketball tournament
      },
      {
        title: 'Prepare meeting agenda',
        description: 'Compile agenda items for March board meeting',
        priority: 'high',
        status: 'in_progress',
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        assigned_to: userIds[0], // admin
        created_by: userIds[0], // admin
        event_id: eventIds[1] // board meeting
      },
      {
        title: 'Update website with new events',
        description: 'Add upcoming events to the website calendar',
        priority: 'medium',
        status: 'pending',
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        assigned_to: userIds[1], // organizer
        created_by: userIds[0] // admin
      }
    ];

    for (const task of tasks) {
      await db.query(`
        INSERT INTO tasks (title, description, priority, status, due_date, 
                          assigned_to, created_by, event_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        task.title, task.description, task.priority, task.status,
        task.due_date, task.assigned_to, task.created_by, task.event_id
      ]);
      
      console.log(`✅ Created task: ${task.title}`);
    }

    // Seed event participants
    const participations = [
      { event_id: eventIds[0], user_id: userIds[2], status: 'registered' }, // John in basketball tournament
      { event_id: eventIds[0], user_id: userIds[3], status: 'registered' }, // Sarah in basketball tournament
      { event_id: eventIds[1], user_id: userIds[1], status: 'registered' }, // Organizer in board meeting
      { event_id: eventIds[1], user_id: userIds[2], status: 'registered' }  // John in board meeting
    ];

    for (const participation of participations) {
      await db.query(`
        INSERT INTO event_participants (event_id, user_id, status)
        VALUES ($1, $2, $3)
      `, [participation.event_id, participation.user_id, participation.status]);
    }

    // Update participant counts
    await db.query(`
      UPDATE events 
      SET current_participants = (
        SELECT COUNT(*) 
        FROM event_participants 
        WHERE event_id = events.id AND status = 'registered'
      )
    `);

    console.log('🎯 Created event participations');

    // Create sample notifications
    const notifications = [
      { user_id: userIds[2], title: 'Welcome to WNSC!', message: 'Thanks for joining the West Nebraska Sports Council.', type: 'info' },
      { user_id: userIds[3], title: 'New Task Assigned', message: 'You have been assigned to help with the basketball tournament.', type: 'task' },
      { user_id: userIds[1], title: 'Event Update', message: 'The summer tournament dates have been finalized.', type: 'event' }
    ];

    for (const notification of notifications) {
      await db.query(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES ($1, $2, $3, $4)
      `, [notification.user_id, notification.title, notification.message, notification.type]);
    }

    console.log('📬 Created sample notifications');

    // Seed directory/contacts
    const contacts = [
      {
        contact_name: 'Nebraska State Athletic Association',
        organization: 'NSAA',
        title: 'State Organization',
        email: 'info@nsaa.org',
        phone: '(402) 489-0386',
        address: '500 Charleston St',
        city: 'Lincoln',
        state: 'NE',
        zip_code: '68508',
        website: 'https://nsaa.org',
        contact_type: 'organization',
        notes: 'State governing body for high school athletics in Nebraska.',
        added_by: userIds[0]
      },
      {
        contact_name: 'Mike Johnson',
        organization: 'Johnson Sports Equipment',
        title: 'Sales Manager',
        email: 'mike@johnsonsports.com',
        phone: '(308) 632-4567',
        address: '123 Sports Ave',
        city: 'North Platte',
        state: 'NE',
        zip_code: '69101',
        website: 'https://johnsonsports.com',
        contact_type: 'vendor',
        notes: 'Equipment supplier for tournaments and events.',
        added_by: userIds[1]
      },
      {
        contact_name: 'First National Bank',
        organization: 'First National Bank of the West',
        title: 'Community Banking',
        email: 'community@fnbwest.com',
        phone: '(308) 534-2100',
        address: '400 West 4th Street',
        city: 'North Platte',
        state: 'NE',
        zip_code: '69101',
        website: 'https://fnbwest.com',
        contact_type: 'sponsor',
        notes: 'Major sponsor for youth sports programs.',
        added_by: userIds[0]
      },
      {
        contact_name: 'Sarah Williams',
        organization: 'Western Nebraska Community College',
        title: 'Athletic Director',
        email: 'swilliams@wncc.edu',
        phone: '(308) 635-6015',
        address: '1601 E 27th St',
        city: 'Scottsbluff',
        state: 'NE',
        zip_code: '69361',
        website: 'https://wncc.edu',
        contact_type: 'partner',
        notes: 'Partnership for hosting regional tournaments.',
        added_by: userIds[1]
      },
      {
        contact_name: 'Tom Martinez',
        title: 'Volunteer Coach',
        email: 'tom.martinez@email.com',
        phone: '(308) 520-1234',
        city: 'Ogallala',
        state: 'NE',
        contact_type: 'contact',
        notes: 'Experienced coach available for clinics and camps.',
        added_by: userIds[2]
      }
    ];

    for (const contact of contacts) {
      await db.query(`
        INSERT INTO directory (
          contact_name, organization, title, email, phone, address, city, state, 
          zip_code, website, notes, contact_type, added_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        contact.contact_name,
        contact.organization || null,
        contact.title || null,
        contact.email || null,
        contact.phone || null,
        contact.address || null,
        contact.city || null,
        contact.state || null,
        contact.zip_code || null,
        contact.website || null,
        contact.notes || null,
        contact.contact_type,
        contact.added_by
      ]);
    }

    console.log('📞 Created sample directory contacts');

    console.log('✅ Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('🎉 Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedData };