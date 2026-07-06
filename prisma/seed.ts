
// Fix: Use import * as process to properly resolve typing issues with process.exit in this environment.
import * as process from 'process';
// Fix: Use namespace import and type assertion for PrismaClient to resolve 'no exported member' error in this environment.
import * as Prisma from '@prisma/client';

const prisma = new (Prisma as any).PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Test User
  const user = await (prisma as any).user.upsert({
    where: { email: 'alex@indieleads.ai' },
    update: {},
    create: {
      email: 'alex@indieleads.ai',
      passwordHash: 'argon2_hashed_password',
      firstName: 'Alex',
      lastName: 'Reed',
    },
  });

  // Create Workspace
  const workspace = await (prisma as any).workspace.upsert({
    where: { slug: 'alpha-growth' },
    update: {},
    create: {
      name: 'Alpha Growth',
      slug: 'alpha-growth',
      members: {
        create: {
          userId: user.id,
          role: 'admin',
        },
      },
    },
  });

  // Create Domain
  const domain = await (prisma as any).domain.create({
    data: {
      workspaceId: workspace.id,
      domainName: 'indieleads.ai',
      isVerified: true,
      spfValid: true,
      dkimValid: true,
      dmarcValid: true,
    },
  });

  // Create Inbox
  const inbox = await (prisma as any).inbox.create({
    data: {
      workspaceId: workspace.id,
      domainId: domain.id,
      email: 'alex@indieleads.ai',
      provider: 'google',
      credentials: { accessToken: 'stub', refreshToken: 'stub' },
      dailyLimit: 50,
      status: 'active',
      warmupEnabled: true,
      warmupAccount: {
        create: {
          dailyLimit: 50,
          rampUpPerDay: 5,
        },
      },
    },
  });

  // Create Campaign
  const campaign = await (prisma as any).campaign.create({
    data: {
      workspaceId: workspace.id,
      name: 'Q4 Enterprise Outreach',
      status: 'active',
      sequences: {
        create: [
          {
            order: 1,
            subject: 'Quick question about {{company}}',
            body: 'Hey {{firstName}}, would love to chat about IndieLeads.',
            delayDays: 0,
          },
          {
            order: 2,
            subject: 'Re: Quick question about {{company}}',
            body: 'Just following up on my previous email.',
            delayDays: 3,
          },
        ],
      },
    },
  });

  console.log('✅ Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    // Fix: Access exit with type assertion to resolve Property 'exit' does not exist error on process.
    (process as any).exit(1);
  })
  .finally(async () => {
    await (prisma as any).$disconnect();
  });
