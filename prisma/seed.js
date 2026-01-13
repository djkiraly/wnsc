const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create default admin user
  // Default password: Admin123456! (meets requirements: 12+ chars, uppercase, lowercase, number)
  const hashedPassword = await bcrypt.hash('Admin123456!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@westernnebraskasports.org' },
    update: {
      passwordHash: hashedPassword,
      name: 'Admin User',
      role: 'SUPER_ADMIN',
      memberStatus: 'PRESIDENT',
      active: true,
    },
    create: {
      email: 'admin@westernnebraskasports.org',
      passwordHash: hashedPassword,
      name: 'Admin User',
      role: 'SUPER_ADMIN',
      memberStatus: 'PRESIDENT',
      active: true,
    },
  });

  console.log('Created admin user:', admin.email);
  console.log('Default admin password: Admin123456!');

  // Create sample editor user
  // Default password: Editor123456!
  const editorPassword = await bcrypt.hash('Editor123456!', 12);

  const editor = await prisma.user.upsert({
    where: { email: 'editor@westernnebraskasports.org' },
    update: {
      passwordHash: editorPassword,
      name: 'Editor User',
      role: 'EDITOR',
      memberStatus: 'MEMBER',
      active: true,
    },
    create: {
      email: 'editor@westernnebraskasports.org',
      passwordHash: editorPassword,
      name: 'Editor User',
      role: 'EDITOR',
      memberStatus: 'MEMBER',
      active: true,
    },
  });

  console.log('Created editor user:', editor.email);

  // Create sample events
  const events = [
    {
      title: 'Western Nebraska High School Basketball Tournament',
      slug: 'western-nebraska-high-school-basketball-tournament',
      description: 'Annual high school basketball tournament featuring teams from across Western Nebraska. Three days of exciting competition showcasing the best young talent in the region.',
      category: 'Basketball',
      startDate: new Date('2026-02-15T09:00:00'),
      endDate: new Date('2026-02-17T18:00:00'),
      location: 'Scottsbluff, NE',
      venueName: 'Scottsbluff High School',
      contactName: 'John Smith',
      contactEmail: 'john@example.com',
      contactPhone: '(308) 555-0100',
      status: 'PUBLISHED',
      published: true,
      metaDescription: 'Join us for the annual Western Nebraska High School Basketball Tournament in Scottsbluff.',
      keywords: 'basketball, tournament, high school, Scottsbluff, Nebraska',
      createdById: admin.id,
    },
    {
      title: 'Summer Youth Soccer Camp',
      slug: 'summer-youth-soccer-camp',
      description: 'Week-long soccer camp for youth ages 8-14. Professional coaching, skill development, and fun competitions. All skill levels welcome!',
      category: 'Soccer',
      startDate: new Date('2026-06-20T08:00:00'),
      endDate: new Date('2026-06-24T16:00:00'),
      location: 'Alliance, NE',
      venueName: 'Alliance Soccer Complex',
      contactName: 'Sarah Johnson',
      contactEmail: 'sarah@example.com',
      contactPhone: '(308) 555-0200',
      status: 'PUBLISHED',
      published: true,
      metaDescription: 'Youth soccer camp in Alliance, NE. Professional coaching for ages 8-14.',
      keywords: 'soccer, camp, youth, Alliance, Nebraska',
      createdById: admin.id,
    },
    {
      title: 'Western Nebraska Marathon',
      slug: 'western-nebraska-marathon',
      description: 'Scenic marathon and half-marathon through the beautiful Western Nebraska landscape. Full marathon, half marathon, and 5K options available.',
      category: 'Running',
      startDate: new Date('2026-09-12T07:00:00'),
      endDate: new Date('2026-09-12T14:00:00'),
      location: 'Gering, NE',
      venueName: 'Gering Civic Center',
      contactName: 'Mike Wilson',
      contactEmail: 'mike@example.com',
      contactPhone: '(308) 555-0300',
      registrationUrl: 'https://example.com/register',
      status: 'DRAFT',
      published: false,
      metaDescription: 'Marathon and half-marathon event in scenic Western Nebraska.',
      keywords: 'marathon, running, half marathon, Gering, Nebraska',
      createdById: editor.id,
    },
  ];

  for (const event of events) {
    await prisma.event.upsert({
      where: { slug: event.slug },
      update: {},
      create: event,
    });
  }

  console.log('Created sample events');

  // Create sample settings
  const settings = [
    { key: 'organization_name', value: 'Western Nebraska Sports Council' },
    { key: 'tagline', value: 'Driving Sports Tourism in Western Nebraska' },
    { key: 'contact_email', value: 'info@westernnebraskasports.org' },
    { key: 'contact_phone', value: '(308) 555-1234' },
    { key: 'address', value: 'Western Nebraska' },
    { key: 'meta_title', value: 'Western Nebraska Sports Council' },
    { key: 'meta_description', value: 'Assisting local organizations in developing and promoting sporting events to drive tourism to Western Nebraska.' },
    { key: 'meta_keywords', value: 'sports, Nebraska, tourism, events' },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log('Created site settings');

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
