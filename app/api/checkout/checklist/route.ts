import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

// Default checklist items to seed for new organizations
const DEFAULT_CHECKLIST_ITEMS = [
    // 1. ระบบไฟฟ้าและเครื่องใช้ไฟฟ้า
    { category: "⚡ 1. ระบบไฟฟ้าและเครื่องใช้ไฟฟ้า", label: "เครื่องปรับอากาศ (ความเย็น, รีโมท, แผ่นกรอง, ไม่มีน้ำหยด)", suggestedRepairCost: 500, order: 1, isDefault: true },
    { category: "⚡ 1. ระบบไฟฟ้าและเครื่องใช้ไฟฟ้า", label: "เครื่องทำน้ำอุ่น (ความร้อน, ฝักบัวไม่รั่ว, ปุ่มทดสอบ ELCB ปกติ)", suggestedRepairCost: 300, order: 2, isDefault: true },
    { category: "⚡ 1. ระบบไฟฟ้าและเครื่องใช้ไฟฟ้า", label: "หลอดไฟและสวิตช์ (สว่างครบทุกดวง, สวิตช์ไม่หลวม/ไม่มีรอยไหม้)", suggestedRepairCost: 100, order: 3, isDefault: true },
    { category: "⚡ 1. ระบบไฟฟ้าและเครื่องใช้ไฟฟ้า", label: "เต้ารับปลั๊กไฟ (ไม่หลวม, ไม่มีรอยไหม้, ฝาครอบไม่แตกหัก)", suggestedRepairCost: 100, order: 4, isDefault: true },
    { category: "⚡ 1. ระบบไฟฟ้าและเครื่องใช้ไฟฟ้า", label: "ตู้คอนซูมเมอร์ยูนิต / เบรกเกอร์ (สภาพปกติ, ไม่มีกลิ่นไหม้)", suggestedRepairCost: 300, order: 5, isDefault: true },

    // 2. หมวดเฟอร์นิเจอร์และพื้นที่ทั่วไป
    { category: "🪑 2. หมวดเฟอร์นิเจอร์และพื้นที่ทั่วไป", label: "ประตูและลูกบิด / คีย์การ์ด (เปิด-ปิดสนิท, ล็อกปกติ)", suggestedRepairCost: 300, order: 6, isDefault: true },
    { category: "🪑 2. หมวดเฟอร์นิเจอร์และพื้นที่ทั่วไป", label: "กุญแจ / คีย์การ์ด (ได้รับคืนครบถ้วน)", suggestedRepairCost: 150, order: 7, isDefault: true },
    { category: "🪑 2. หมวดเฟอร์นิเจอร์และพื้นที่ทั่วไป", label: "ผนังและเพดาน (ไม่มีรอยเจาะ/ขีดข่วน/คราบฝังลึก/น้ำซึม)", suggestedRepairCost: 100, order: 8, isDefault: true },
    { category: "🪑 2. หมวดเฟอร์นิเจอร์และพื้นที่ทั่วไป", label: "พื้นห้อง / บัวเชิงผนัง (กระเบื้อง/ลามิเนต ไม่บวม/ไม่แตก)", suggestedRepairCost: 200, order: 9, isDefault: true },
    { category: "🪑 2. หมวดเฟอร์นิเจอร์และพื้นที่ทั่วไป", label: "เตียงและฟูกที่นอน (โครงแข็งแรง, ฟูกไม่มีคราบ/รอยไหม้)", suggestedRepairCost: 500, order: 10, isDefault: true },
    { category: "🪑 2. หมวดเฟอร์นิเจอร์และพื้นที่ทั่วไป", label: "ตู้เสื้อผ้า (บานพับปกติ, ราวไม่หัก, ลิ้นชักเลื่อนได้)", suggestedRepairCost: 300, order: 11, isDefault: true },
    { category: "🪑 2. หมวดเฟอร์นิเจอร์และพื้นที่ทั่วไป", label: "โต๊ะและเก้าอี้ (ขาแข็งแรง, ผิวไม่บวมน้ำ)", suggestedRepairCost: 200, order: 12, isDefault: true },
    { category: "🪑 2. หมวดเฟอร์นิเจอร์และพื้นที่ทั่วไป", label: "หน้าต่างและมุ้งลวด (กระจกไม่แตก, ล็อกได้, มุ้งลวดไม่ขาด)", suggestedRepairCost: 300, order: 13, isDefault: true },
    { category: "🪑 2. หมวดเฟอร์นิเจอร์และพื้นที่ทั่วไป", label: "ผ้าม่านและราวม่าน (แข็งแรง, ผ้าไม่ขาด/ไม่มีคราบฝังลึก)", suggestedRepairCost: 200, order: 14, isDefault: true },

    // 3. หมวดห้องน้ำ
    { category: "🚿 3. หมวดห้องน้ำ", label: "ประตูห้องน้ำ (เปิด-ปิดปกติ, บานพับไม่ผุ, ลูกบิดล็อกได้)", suggestedRepairCost: 250, order: 15, isDefault: true },
    { category: "🚿 3. หมวดห้องน้ำ", label: "อ่างล้างหน้าและกระจก (กระจกไม่ร้าว, อ่างไม่บิ่น, ก๊อกไม่รั่ว)", suggestedRepairCost: 200, order: 16, isDefault: true },
    { category: "🚿 3. หมวดห้องน้ำ", label: "ชักโครกและสายชำระ (กดน้ำลงปกติ, สายชำระไม่แตก/ไม่รั่ว)", suggestedRepairCost: 250, order: 17, isDefault: true },
    { category: "🚿 3. หมวดห้องน้ำ", label: "ท่อระบายน้ำที่พื้น (น้ำระบายได้เร็ว ไม่ตันทิ้งคราบ)", suggestedRepairCost: 200, order: 18, isDefault: true },

    // 4. หมวดระเบียง & ความสะอาด
    { category: "🏞️ 4. หมวดระเบียง & ความสะอาด", label: "ประตูระเบียง (เลื่อนลื่นไหล, ล็อกได้)", suggestedRepairCost: 250, order: 19, isDefault: true },
    { category: "🏞️ 4. หมวดระเบียง & ความสะอาด", label: "ราวตากผ้า / พื้นที่ซักล้าง (ก๊อกน้ำใช้งานได้, ไม่มีขยะอุดตัน)", suggestedRepairCost: 200, order: 20, isDefault: true },
    { category: "🏞️ 4. หมวดระเบียง & ความสะอาด", label: "ค่าทำความสะอาดทั่วไป (ห้องไม่สะอาด)", suggestedRepairCost: 250, order: 21, isDefault: true },
    { category: "🏞️ 4. หมวดระเบียง & ความสะอาด", label: "เคลียร์ขยะและของส่วนตัวออกหมดแล้ว", suggestedRepairCost: 0, order: 22, isDefault: true },
];

// GET /api/checkout/checklist — Get all checklist templates for org
export async function GET() {
    try {
        const session = await getCurrentSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        let items = await prisma.checkoutChecklistTemplate.findMany({
            where: { organizationId: session.organizationId, isActive: true },
            orderBy: { order: "asc" },
        });

        // Auto-seed defaults if empty
        if (items.length === 0) {
            await prisma.checkoutChecklistTemplate.createMany({
                data: DEFAULT_CHECKLIST_ITEMS.map(item => ({
                    ...item,
                    organizationId: session.organizationId,
                })),
            });
            items = await prisma.checkoutChecklistTemplate.findMany({
                where: { organizationId: session.organizationId, isActive: true },
                orderBy: { order: "asc" },
            });
        }

        return NextResponse.json(items);
    } catch (error: any) {
        // If table doesn't exist yet (migration pending), return empty array gracefully
        const isTableMissing = error?.code === "P2021" || error?.message?.includes("does not exist");
        if (isTableMissing) {
            console.warn("CheckoutChecklistTemplate table not found — migration pending");
            return NextResponse.json([]);
        }
        console.error("Get Checklist Error:", error);
        return NextResponse.json({ error: "Failed to fetch checklist" }, { status: 500 });
    }
}


// POST /api/checkout/checklist — Add new checklist item
export async function POST(req: Request) {
    try {
        const session = await getCurrentSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { category, label, suggestedRepairCost } = await req.json();
        if (!category || !label) {
            return NextResponse.json({ error: "Category and label are required" }, { status: 400 });
        }

        // Get max order for this org
        const maxOrder = await prisma.checkoutChecklistTemplate.aggregate({
            _max: { order: true },
            where: { organizationId: session.organizationId },
        });

        const item = await prisma.checkoutChecklistTemplate.create({
            data: {
                category,
                label,
                suggestedRepairCost: parseFloat(suggestedRepairCost) || 0,
                order: (maxOrder._max.order || 0) + 1,
                isDefault: false,
                isActive: true,
                organizationId: session.organizationId,
            },
        });

        return NextResponse.json(item);
    } catch (error) {
        console.error("Create Checklist Item Error:", error);
        return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
    }
}

// PUT /api/checkout/checklist — Seed default items in batch
export async function PUT(req: Request) {
    try {
        const session = await getCurrentSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Seed default items
        await prisma.checkoutChecklistTemplate.createMany({
            data: DEFAULT_CHECKLIST_ITEMS.map(item => ({
                ...item,
                organizationId: session.organizationId,
            })),
        });

        const items = await prisma.checkoutChecklistTemplate.findMany({
            where: { organizationId: session.organizationId, isActive: true },
            orderBy: { order: "asc" },
        });

        return NextResponse.json(items);
    } catch (error) {
        console.error("Seed Checklist Error:", error);
        return NextResponse.json({ error: "Failed to seed checklist" }, { status: 500 });
    }
}

// DELETE /api/checkout/checklist?id=X — Deactivate (soft delete)
export async function DELETE(req: Request) {
    try {
        const session = await getCurrentSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = parseInt(searchParams.get("id") || "0");

        const item = await prisma.checkoutChecklistTemplate.findFirst({
            where: { id, organizationId: session.organizationId },
        });

        if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

        await prisma.checkoutChecklistTemplate.update({
            where: { id },
            data: { isActive: false },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Checklist Item Error:", error);
        return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
    }
}
