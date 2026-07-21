import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

// Default checklist items to seed for new organizations
const DEFAULT_CHECKLIST_ITEMS = [
    { category: "🔑 กุญแจ", label: "กุญแจห้อง / การ์ดเข้าออก", order: 1, isDefault: true },
    { category: "❄️ เครื่องใช้ไฟฟ้า", label: "แอร์", order: 2, isDefault: true },
    { category: "❄️ เครื่องใช้ไฟฟ้า", label: "พัดลม", order: 3, isDefault: true },
    { category: "❄️ เครื่องใช้ไฟฟ้า", label: "ตู้เย็น (ถ้ามี)", order: 4, isDefault: true },
    { category: "🪑 เฟอร์นิเจอร์", label: "เตียงนอน / ที่นอน", order: 5, isDefault: true },
    { category: "🪑 เฟอร์นิเจอร์", label: "ตู้เสื้อผ้า", order: 6, isDefault: true },
    { category: "🪑 เฟอร์นิเจอร์", label: "โต๊ะ / เก้าอี้", order: 7, isDefault: true },
    { category: "🚿 ห้องน้ำ", label: "สุขภัณฑ์ / โถส้วม", order: 8, isDefault: true },
    { category: "🚿 ห้องน้ำ", label: "ฝักบัว / ก๊อกน้ำ", order: 9, isDefault: true },
    { category: "🚿 ห้องน้ำ", label: "กระจก", order: 10, isDefault: true },
    { category: "🏠 ห้องโดยรวม", label: "ผนังและพื้นห้อง", order: 11, isDefault: true },
    { category: "🏠 ห้องโดยรวม", label: "หน้าต่าง / มู่ลี่", order: 12, isDefault: true },
    { category: "🗑️ ความสะอาด", label: "เคลียร์ขยะและของส่วนตัวออกหมดแล้ว", order: 13, isDefault: true },
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
    } catch (error) {
        console.error("Get Checklist Error:", error);
        return NextResponse.json({ error: "Failed to fetch checklist" }, { status: 500 });
    }
}

// POST /api/checkout/checklist — Add new checklist item
export async function POST(req: Request) {
    try {
        const session = await getCurrentSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { category, label } = await req.json();
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
