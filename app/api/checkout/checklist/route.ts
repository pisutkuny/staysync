import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

// Default checklist items to seed for new organizations
const DEFAULT_CHECKLIST_ITEMS = [
    // 🔑 กุญแจ
    { category: "🔑 กุญแจ", label: "กุญแจห้อง (สูญหาย/เปลี่ยนชุด)", suggestedRepairCost: 300, order: 1, isDefault: true },
    { category: "🔑 กุญแจ", label: "คีย์การ์ดเข้าออก (สูญหาย)", suggestedRepairCost: 150, order: 2, isDefault: true },

    // ❄️ เครื่องใช้ไฟฟ้า
    { category: "❄️ เครื่องใช้ไฟฟ้า", label: "แอร์ (ชำรุด/เสียหาย)", suggestedRepairCost: 500, order: 3, isDefault: true },
    { category: "❄️ เครื่องใช้ไฟฟ้า", label: "รีโมทแอร์ (สูญหาย/ชำรุด)", suggestedRepairCost: 250, order: 4, isDefault: true },
    { category: "❄️ เครื่องใช้ไฟฟ้า", label: "พัดลม (ชำรุด/เสียหาย)", suggestedRepairCost: 300, order: 5, isDefault: true },
    { category: "❄️ เครื่องใช้ไฟฟ้า", label: "ตู้เย็น (ถ้ามี — ชำรุด)", suggestedRepairCost: 500, order: 6, isDefault: true },

    // 🪑 เฟอร์นิเจอร์
    { category: "🪑 เฟอร์นิเจอร์", label: "เตียงนอน / ที่นอน (ชำรุด)", suggestedRepairCost: 500, order: 7, isDefault: true },
    { category: "🪑 เฟอร์นิเจอร์", label: "ตู้เสื้อผ้า (ชำรุด)", suggestedRepairCost: 300, order: 8, isDefault: true },
    { category: "🪑 เฟอร์นิเจอร์", label: "โต๊ะ / เก้าอี้ (ชำรุด)", suggestedRepairCost: 200, order: 9, isDefault: true },

    // 🚿 ห้องน้ำ
    { category: "🚿 ห้องน้ำ", label: "สุขภัณฑ์ / โถส้วม (ชำรุด)", suggestedRepairCost: 300, order: 10, isDefault: true },
    { category: "🚿 ห้องน้ำ", label: "ท่อระบายน้ำ / ชักโครก (อุดตัน)", suggestedRepairCost: 250, order: 11, isDefault: true },
    { category: "🚿 ห้องน้ำ", label: "ฝักบัว / ก๊อกน้ำ (ชำรุด)", suggestedRepairCost: 200, order: 12, isDefault: true },
    { category: "🚿 ห้องน้ำ", label: "กระจก (แตก/ชำรุด)", suggestedRepairCost: 200, order: 13, isDefault: true },

    // 🏠 ห้องโดยรวม
    { category: "🏠 ห้องโดยรวม", label: "ผนัง/พื้น (รอยเจาะ, ตอกตะปู, ขีดข่วน)", suggestedRepairCost: 100, order: 14, isDefault: true },
    { category: "🏠 ห้องโดยรวม", label: "หน้าต่าง / มู่ลี่ (ชำรุด)", suggestedRepairCost: 300, order: 15, isDefault: true },

    // 🗑️ ความสะอาด
    { category: "🗑️ ความสะอาด", label: "ค่าทำความสะอาดทั่วไป (ห้องไม่สะอาด)", suggestedRepairCost: 250, order: 16, isDefault: true },
    { category: "🗑️ ความสะอาด", label: "ขนย้ายขยะชิ้นใหญ่ (จ้างขนทิ้ง)", suggestedRepairCost: 400, order: 17, isDefault: true },
    { category: "🗑️ ความสะอาด", label: "เคลียร์ขยะและของส่วนตัวออกหมดแล้ว", suggestedRepairCost: 0, order: 18, isDefault: true },
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
