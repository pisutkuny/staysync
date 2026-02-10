import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // 1. Create default organization
    console.log('Creating default organization...');
    const org = await prisma.organization.upsert({
        where: { slug: 'my-dorm' },
        update: {},
        create: {
            name: 'My Dormitory',
            slug: 'my-dorm',
            email: null,
            phone: null,
            status: 'Active',
        },
    });
    console.log(`✅ Organization created: ${org.name} (ID: ${org.id})`);

    // 2. Create admin user
    console.log('Creating admin user...');
    const adminPassword = await bcrypt.hash('Admin@1234', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@staysync.com' },
        update: {},
        create: {
            email: 'admin@staysync.com',
            password: adminPassword,
            fullName: 'Administrator',
            role: 'OWNER',
            emailVerified: true, // Pre-verified for ease of first login
            organizationId: org.id,
            status: 'Active',
        },
    });
    console.log(`✅ Admin user created: ${admin.email}`);

    // 3. Create system config for organization
    console.log('Creating system config...');
    await prisma.systemConfig.upsert({
        where: { organizationId: org.id },
        update: {},
        create: {
            organizationId: org.id,
            dormName: 'My Dormitory',
            dormAddress: '123 Street, City',
            waterRate: 18,
            electricRate: 7,
            totalAmount: 0,
            otherFees: 0,
            trashFee: 0,
            internetFee: 0,
        },
    });
    console.log(`✅ System config created`);

    console.log('\n🎉 Seeding completed!');
    console.log('\n📝 Login credentials:');
    console.log('   Email: admin@staysync.com');
    console.log('   Password: Admin@1234');
    console.log('\n⚠️  Change password after first login!');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
