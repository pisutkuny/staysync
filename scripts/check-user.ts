// Quick script to check and fix user login
import prisma from '../lib/prisma';

async function checkUser() {
    console.log('🔍 Checking user in database...\n');

    const users = await prisma.user.findMany();

    console.log(`Found ${users.length} user(s):\n`);

    users.forEach(user => {
        console.log(`Email: ${user.email}`);
        console.log(`Password: ${user.password}`);
        console.log(`Role: ${user.role}`);
        console.log('---');
    });

    // If no owner user, create one
    if (!users.find(u => u.role === 'OWNER')) {
        console.log('\n❌ No "OWNER" user found! Creating default user...\n');

        // Need organization first
        const org = await prisma.organization.findFirst({ where: { slug: 'my-dorm' } });

        if (org) {
            const newUser = await prisma.user.create({
                data: {
                    email: 'owner@staysync.com',
                    fullName: 'Owner User',
                    password: 'owner123',
                    role: 'OWNER',
                    organizationId: org.id
                }
            });

            console.log('✅ Created new user:');
            console.log(`Email: ${newUser.email}`);
            console.log(`Password: ${newUser.password}`);
            console.log(`Role: ${newUser.role}`);
        } else {
            console.error('❌ Cannot create user: Default organization not found.');
        }
    } else {
        const owner = users.find(u => u.role === 'OWNER');
        console.log('\n✅ Owner user exists!');
        console.log(`Email: ${owner?.email}`);
    }

    await prisma.$disconnect();
}

checkUser().catch(console.error);
