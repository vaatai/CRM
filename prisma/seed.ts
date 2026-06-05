import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // ── Clean existing data ──────────────────────────────────────────────────
  await prisma.tagAssignment.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.note.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.company.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.role.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ────────────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      clerkId: 'clerk_seed_admin_001',
      email: 'admin@crm-saas.dev',
      firstName: 'Admin',
      lastName: 'User',
      systemRole: 'SUPER_ADMIN',
    },
  });

  const manager = await prisma.user.create({
    data: {
      clerkId: 'clerk_seed_manager_001',
      email: 'manager@crm-saas.dev',
      firstName: 'Sarah',
      lastName: 'Manager',
      systemRole: 'USER',
    },
  });

  const member = await prisma.user.create({
    data: {
      clerkId: 'clerk_seed_member_001',
      email: 'member@crm-saas.dev',
      firstName: 'John',
      lastName: 'Member',
      systemRole: 'USER',
    },
  });

  console.log(`  Created ${3} users`);

  // ── Organization ─────────────────────────────────────────────────────────
  const org = await prisma.organization.create({
    data: {
      name: 'Acme Corp',
      slug: 'acme-corp',
      website: 'https://acme-corp.example.com',
    },
  });

  console.log(`  Created organization: ${org.name}`);

  // ── Roles (4 system roles) ────────────────────────────────────────────────
  const ownerRole = await prisma.role.create({
    data: {
      name: 'Owner',
      description: 'Full access to all resources including user and role management',
      organizationId: org.id,
      isSystem: true,
    },
  });

  const adminRole = await prisma.role.create({
    data: {
      name: 'Admin',
      description: 'Full access to all CRM resources and user management',
      organizationId: org.id,
      isSystem: true,
    },
  });

  const managerRole = await prisma.role.create({
    data: {
      name: 'Manager',
      description: 'Can manage leads, contacts, deals, and view reports',
      organizationId: org.id,
      isSystem: true,
    },
  });

  const salesAgentRole = await prisma.role.create({
    data: {
      name: 'Sales Agent',
      description: 'Can view and edit leads, contacts, deals; limited delete access',
      organizationId: org.id,
      isSystem: true,
      isDefault: true,
    },
  });

  console.log(`  Created 4 system roles`);

  // ── Permissions (expanded: 11 resources x 5 actions) ─────────────────────
  const resources = ['lead', 'contact', 'company', 'deal', 'task', 'note', 'activity', 'analytics', 'user', 'role', 'email'];
  const actions = ['create', 'read', 'update', 'delete', 'manage'];

  const permMap: Record<string, string> = {};
  for (const resource of resources) {
    for (const action of actions) {
      const perm = await prisma.permission.create({
        data: {
          action,
          resource,
          description: `${action} ${resource}`,
        },
      });
      permMap[`${action}:${resource}`] = perm.id;
    }
  }

  const allPermIds = Object.values(permMap);
  console.log(`  Created ${allPermIds.length} permissions`);

  // Owner gets ALL permissions
  for (const permId of allPermIds) {
    await prisma.rolePermission.create({ data: { roleId: ownerRole.id, permissionId: permId } });
  }

  // Admin gets all CRM CRUD + manage users, read analytics
  const adminPerms = [
    ...['lead', 'contact', 'company', 'deal', 'task', 'note', 'activity', 'email'].flatMap(r =>
      ['create', 'read', 'update', 'delete'].map(a => `${a}:${r}`)
    ),
    'read:analytics',
    'manage:user',
  ];
  for (const key of adminPerms) {
    if (permMap[key]) {
      await prisma.rolePermission.create({ data: { roleId: adminRole.id, permissionId: permMap[key] } });
    }
  }

  // Manager gets CRUD on most CRM resources (no delete on contacts/companies), read analytics, read+create email
  const managerPerms = [
    ...['lead', 'deal', 'task', 'note', 'activity'].flatMap(r =>
      ['create', 'read', 'update', 'delete'].map(a => `${a}:${r}`)
    ),
    ...['contact', 'company'].flatMap(r =>
      ['create', 'read', 'update'].map(a => `${a}:${r}`)
    ),
    'read:analytics',
    'read:email',
    'create:email',
  ];
  for (const key of managerPerms) {
    if (permMap[key]) {
      await prisma.rolePermission.create({ data: { roleId: managerRole.id, permissionId: permMap[key] } });
    }
  }

  // Sales Agent gets read on all CRM, create/update on leads, deals, tasks, notes, activities
  const salesPerms = [
    ...['lead', 'contact', 'company', 'deal', 'task', 'note', 'activity'].map(r => `read:${r}`),
    ...['lead', 'deal', 'task', 'note', 'activity'].flatMap(r =>
      ['create', 'update'].map(a => `${a}:${r}`)
    ),
    'read:analytics',
    'read:email',
  ];
  for (const key of salesPerms) {
    if (permMap[key]) {
      await prisma.rolePermission.create({ data: { roleId: salesAgentRole.id, permissionId: permMap[key] } });
    }
  }

  console.log(`  Assigned permissions to 4 system roles`);

  // ── Organization members ─────────────────────────────────────────────────
  await prisma.organizationMember.createMany({
    data: [
      { userId: admin.id, organizationId: org.id, roleId: ownerRole.id },
      { userId: manager.id, organizationId: org.id, roleId: managerRole.id },
      { userId: member.id, organizationId: org.id, roleId: salesAgentRole.id },
    ],
  });

  console.log(`  Added ${3} members to organization`);

  // ── Tags ─────────────────────────────────────────────────────────────────
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: 'VIP', color: 'PURPLE', organizationId: org.id } }),
    prisma.tag.create({ data: { name: 'Hot Lead', color: 'RED', organizationId: org.id } }),
    prisma.tag.create({ data: { name: 'Enterprise', color: 'BLUE', organizationId: org.id } }),
    prisma.tag.create({ data: { name: 'Follow Up', color: 'YELLOW', organizationId: org.id } }),
    prisma.tag.create({ data: { name: 'Partner', color: 'GREEN', organizationId: org.id } }),
  ]);

  console.log(`  Created ${tags.length} tags`);

  // ── Companies ────────────────────────────────────────────────────────────
  const techCorp = await prisma.company.create({
    data: {
      organizationId: org.id,
      name: 'TechCorp Inc.',
      website: 'https://techcorp.example.com',
      industry: 'Technology',
      size: '51-200',
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
      phone: '+1-555-0100',
      email: 'info@techcorp.example.com',
      description: 'Leading SaaS provider in the enterprise space',
    },
  });

  const globalRetail = await prisma.company.create({
    data: {
      organizationId: org.id,
      name: 'Global Retail Ltd.',
      website: 'https://globalretail.example.com',
      industry: 'Retail',
      size: '201-500',
      city: 'New York',
      state: 'NY',
      country: 'US',
      phone: '+1-555-0200',
      email: 'contact@globalretail.example.com',
    },
  });

  const greenEnergy = await prisma.company.create({
    data: {
      organizationId: org.id,
      name: 'GreenEnergy Solutions',
      website: 'https://greenenergy.example.com',
      industry: 'Energy',
      size: '11-50',
      city: 'Austin',
      state: 'TX',
      country: 'US',
    },
  });

  console.log(`  Created ${3} companies`);

  // ── Contacts ─────────────────────────────────────────────────────────────
  const contactAlice = await prisma.contact.create({
    data: {
      organizationId: org.id,
      ownerId: manager.id,
      createdById: admin.id,
      companyId: techCorp.id,
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice.johnson@techcorp.example.com',
      phone: '+1-555-0101',
      title: 'VP of Engineering',
      source: 'REFERRAL',
      address: '100 Tech Way',
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
    },
  });

  const contactBob = await prisma.contact.create({
    data: {
      organizationId: org.id,
      ownerId: member.id,
      createdById: manager.id,
      companyId: globalRetail.id,
      firstName: 'Bob',
      lastName: 'Smith',
      email: 'bob.smith@globalretail.example.com',
      phone: '+1-555-0201',
      title: 'Head of Procurement',
      source: 'COLD_CALL',
      address: '250 Commerce Blvd',
      city: 'New York',
      state: 'NY',
      country: 'US',
    },
  });

  const contactCarla = await prisma.contact.create({
    data: {
      organizationId: org.id,
      ownerId: manager.id,
      createdById: admin.id,
      companyId: greenEnergy.id,
      firstName: 'Carla',
      lastName: 'Davis',
      email: 'carla.davis@greenenergy.example.com',
      title: 'CEO',
      source: 'EVENT',
      city: 'Austin',
      state: 'TX',
      country: 'US',
    },
  });

  const contactDan = await prisma.contact.create({
    data: {
      organizationId: org.id,
      ownerId: member.id,
      createdById: member.id,
      firstName: 'Dan',
      lastName: 'Wilson',
      email: 'dan.wilson@freelance.example.com',
      phone: '+1-555-0300',
      source: 'SOCIAL_MEDIA',
      description: 'Independent consultant, potential partner',
    },
  });

  console.log(`  Created ${4} contacts`);

  // ── Leads ────────────────────────────────────────────────────────────────
  await prisma.lead.createMany({
    data: [
      {
        organizationId: org.id,
        ownerId: manager.id,
        contactId: contactCarla.id,
        title: 'GreenEnergy platform evaluation',
        status: 'QUALIFIED',
        source: 'REFERRAL',
        value: 75000,
      },
      {
        organizationId: org.id,
        ownerId: member.id,
        contactId: contactDan.id,
        title: 'Consulting partnership opportunity',
        status: 'CONTACTED',
        source: 'SOCIAL_MEDIA',
        value: 15000,
      },
      {
        organizationId: org.id,
        ownerId: manager.id,
        title: 'Inbound demo request — unknown company',
        status: 'NEW',
        source: 'WEBSITE',
        value: 50000,
      },
    ],
  });

  console.log(`  Created ${3} leads`);

  // ── Deals ────────────────────────────────────────────────────────────────
  const dealTech = await prisma.deal.create({
    data: {
      organizationId: org.id,
      ownerId: manager.id,
      createdById: admin.id,
      contactId: contactAlice.id,
      companyId: techCorp.id,
      title: 'TechCorp Enterprise License',
      stage: 'PROPOSAL',
      value: 120000,
      currency: 'USD',
      probability: 60,
      expectedCloseDate: new Date('2026-08-15'),
    },
  });

  const dealRetail = await prisma.deal.create({
    data: {
      organizationId: org.id,
      ownerId: member.id,
      createdById: manager.id,
      contactId: contactBob.id,
      companyId: globalRetail.id,
      title: 'Global Retail CRM Migration',
      stage: 'QUALIFICATION',
      value: 85000,
      currency: 'USD',
      probability: 30,
      expectedCloseDate: new Date('2026-09-30'),
    },
  });

  const dealClosed = await prisma.deal.create({
    data: {
      organizationId: org.id,
      ownerId: manager.id,
      createdById: admin.id,
      contactId: contactCarla.id,
      companyId: greenEnergy.id,
      title: 'GreenEnergy Starter Package',
      stage: 'CLOSED_WON',
      value: 25000,
      currency: 'USD',
      probability: 100,
      closedAt: new Date('2026-05-20'),
    },
  });

  await prisma.deal.create({
    data: {
      organizationId: org.id,
      ownerId: member.id,
      createdById: member.id,
      contactId: contactDan.id,
      title: 'Consulting Services Agreement',
      stage: 'PROSPECTING',
      value: 35000,
      currency: 'USD',
      probability: 10,
      expectedCloseDate: new Date('2026-10-01'),
    },
  });

  await prisma.deal.create({
    data: {
      organizationId: org.id,
      ownerId: manager.id,
      createdById: admin.id,
      contactId: contactAlice.id,
      companyId: techCorp.id,
      title: 'TechCorp Premium Support Add-on',
      stage: 'NEGOTIATION',
      value: 45000,
      currency: 'USD',
      probability: 75,
      expectedCloseDate: new Date('2026-07-15'),
    },
  });

  await prisma.deal.create({
    data: {
      organizationId: org.id,
      ownerId: member.id,
      createdById: manager.id,
      contactId: contactBob.id,
      companyId: globalRetail.id,
      title: 'Global Retail Analytics Dashboard',
      stage: 'CLOSED_LOST',
      value: 60000,
      currency: 'USD',
      probability: 0,
      closedAt: new Date('2026-05-25'),
    },
  });

  console.log(`  Created ${6} deals`);

  // ── Tasks ────────────────────────────────────────────────────────────────
  await prisma.task.createMany({
    data: [
      {
        organizationId: org.id,
        assigneeId: manager.id,
        createdById: admin.id,
        dealId: dealTech.id,
        contactId: contactAlice.id,
        title: 'Send proposal document to Alice',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        type: 'EMAIL',
        dueDate: new Date('2026-06-10'),
      },
      {
        organizationId: org.id,
        assigneeId: member.id,
        createdById: manager.id,
        dealId: dealRetail.id,
        contactId: contactBob.id,
        title: 'Schedule discovery call with Bob',
        status: 'TODO',
        priority: 'MEDIUM',
        type: 'CALL',
        dueDate: new Date('2026-06-07'),
      },
      {
        organizationId: org.id,
        assigneeId: manager.id,
        createdById: admin.id,
        dealId: dealClosed.id,
        title: 'Send onboarding materials to GreenEnergy',
        status: 'COMPLETED',
        priority: 'LOW',
        type: 'EMAIL',
        completedAt: new Date('2026-05-22'),
      },
      {
        organizationId: org.id,
        assigneeId: member.id,
        createdById: member.id,
        title: 'Update CRM contact records for Q2',
        status: 'TODO',
        priority: 'LOW',
        type: 'FOLLOW_UP',
        dueDate: new Date('2026-06-30'),
      },
      {
        organizationId: org.id,
        assigneeId: manager.id,
        createdById: manager.id,
        dealId: dealTech.id,
        contactId: contactAlice.id,
        title: 'Product demo with TechCorp engineering team',
        status: 'TODO',
        priority: 'HIGH',
        type: 'MEETING',
        dueDate: new Date('2026-06-12'),
      },
      {
        organizationId: org.id,
        assigneeId: member.id,
        createdById: admin.id,
        contactId: contactBob.id,
        title: 'Follow up on pricing discussion with Bob',
        status: 'TODO',
        priority: 'MEDIUM',
        type: 'FOLLOW_UP',
        dueDate: new Date('2026-06-15'),
      },
      {
        organizationId: org.id,
        assigneeId: manager.id,
        createdById: admin.id,
        dealId: dealRetail.id,
        contactId: contactBob.id,
        title: 'Quarterly check-in call with Global Retail',
        status: 'TODO',
        priority: 'MEDIUM',
        type: 'CALL',
        dueDate: new Date('2026-06-20'),
      },
      {
        organizationId: org.id,
        assigneeId: member.id,
        createdById: manager.id,
        contactId: contactCarla.id,
        title: 'Send contract renewal email to Carla',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        type: 'EMAIL',
        dueDate: new Date('2026-06-08'),
      },
    ],
  });

  console.log(`  Created ${8} tasks`);

  // ── Activities ───────────────────────────────────────────────────────────
  await prisma.activity.createMany({
    data: [
      {
        organizationId: org.id,
        userId: manager.id,
        contactId: contactAlice.id,
        dealId: dealTech.id,
        type: 'MEETING',
        title: 'Initial demo with TechCorp team',
        description: 'Presented product demo to VP of Engineering and 3 team leads',
        duration: 60,
        occurredAt: new Date('2026-05-15T14:00:00Z'),
      },
      {
        organizationId: org.id,
        userId: member.id,
        contactId: contactBob.id,
        dealId: dealRetail.id,
        type: 'CALL',
        title: 'Follow-up call with Bob',
        description: 'Discussed pricing tiers and integration requirements',
        duration: 30,
        occurredAt: new Date('2026-05-28T10:00:00Z'),
      },
      {
        organizationId: org.id,
        userId: manager.id,
        contactId: contactCarla.id,
        type: 'EMAIL',
        title: 'Sent case study to Carla',
        occurredAt: new Date('2026-05-20T09:00:00Z'),
      },
      {
        organizationId: org.id,
        userId: admin.id,
        type: 'OTHER',
        title: 'Quarterly pipeline review',
        description: 'Reviewed all active deals with the sales team',
        duration: 90,
        occurredAt: new Date('2026-06-01T15:00:00Z'),
      },
    ],
  });

  console.log(`  Created ${4} activities`);

  // ── Notes ────────────────────────────────────────────────────────────────
  await prisma.note.createMany({
    data: [
      {
        organizationId: org.id,
        userId: manager.id,
        contactId: contactAlice.id,
        dealId: dealTech.id,
        content:
          'Alice mentioned they are evaluating 2 other vendors. Key differentiator for us is API flexibility.',
        isPinned: true,
      },
      {
        organizationId: org.id,
        userId: member.id,
        contactId: contactBob.id,
        content: 'Bob prefers quarterly billing. Needs approval from CFO for annual commitment.',
      },
      {
        organizationId: org.id,
        userId: admin.id,
        dealId: dealClosed.id,
        content: 'Deal closed at $25k. Good reference customer for the energy vertical.',
        isPinned: true,
      },
    ],
  });

  console.log(`  Created ${3} notes`);

  // ── Tag assignments ──────────────────────────────────────────────────────
  const [vip, hotLead, enterprise, followUp, partner] = tags;
  await prisma.tagAssignment.createMany({
    data: [
      { tagId: vip.id, contactId: contactAlice.id },
      { tagId: enterprise.id, companyId: techCorp.id },
      { tagId: enterprise.id, companyId: globalRetail.id },
      { tagId: hotLead.id, dealId: dealTech.id },
      { tagId: followUp.id, contactId: contactBob.id },
      { tagId: partner.id, contactId: contactDan.id },
    ],
  });

  console.log(`  Created ${6} tag assignments`);

  console.log('\n✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
