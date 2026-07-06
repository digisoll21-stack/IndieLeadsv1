const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Database Verification: Deliverability Lab ---');

    try {
        // 1. Check if model exists by trying a count
        const count = await prisma.deliverabilityTest.count();
        console.log(`Current Deliverability Tests in DB: ${count}`);

        // 2. Mock a test insert
        const mockTest = await prisma.deliverabilityTest.create({
            data: {
                workspaceId: 'test-workspace-id',
                inboxId: 'test-inbox-id',
                score: 95,
                status: 'completed',
                placement: { gmail: 'primary', outlook: 'primary' },
                dnsHealth: { spf: true, dkim: true, dmarc: true },
                recommendations: ['Keep up the good work'],
                subject: 'Verification Test',
                body: 'This is a test body for verification.'
            }
        });
        console.log(`Successfully created verification record: ${mockTest.id}`);

        // 3. Retrieve it
        const fetched = await prisma.deliverabilityTest.findUnique({
            where: { id: mockTest.id }
        });
        console.log(`Fetched record score: ${fetched.score}`);

        // 4. Cleanup
        await prisma.deliverabilityTest.delete({ where: { id: mockTest.id } });
        console.log('Cleanup successful.');

    } catch (err) {
        console.error('Database verification failed:', err);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
