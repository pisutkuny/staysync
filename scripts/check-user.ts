// Quick script to check and fix user login
import prisma from '../lib/prisma';

async function checkUser() {
    console.log('🔍 Checking user in database...\n');

    const users = await prisma.user.findMany();

    console.log(`Found ${users.length} user(s):\n`);

    users.forEach(user => {
        console.log(`Username: ${user.username}`);
        console.log(`Password: ${user.password}`);
        console.log(`Role: ${user.role}`);
        console.log('---');
    });

    // If no owner user, create one
    if (!users.find(u => u.username === 'owner')) {
        console.log('\n❌ No "owner" user found! Creating default user...\n');

        const newUser = await prisma.user.create({
            data: {
                username: 'owner',
                password: 'owner123',
                role: 'ADMIN'
            }
        });

        console.log('✅ Created new user:');
        console.log(`Username: ${newUser.username}`);
        console.log(`Password: ${newUser.password}`);
        console.log(`Role: ${newUser.role}`);
    } else {
        const owner = users.find(u => u.username === 'owner');
        console.log('\n✅ Owner user exists!');
        console.log(`Current password: ${owner!.password}`);
    }

    await prisma.$disconnect();
}

checkUser().catch(console.error);
