
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'matt@digisoll.agency';
    console.log(`Checking for inbox with email: ${email}`);

    const inboxes = await prisma.inbox.findMany({
        where: { email }
    });

    console.log('Results:', JSON.stringify(inboxes, null, 2));

    if (inboxes.length === 0) {
        console.log('No record found with this email.');
    } else {
        console.log(`Found ${inboxes.length} record(s).`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
