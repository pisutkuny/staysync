import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    try {
        // Fetch bills for the specified month/year
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const bills = await prisma.billing.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                room: {
                    include: {
                        residents: {
                            where: { status: 'Active' },
                            take: 1
                        }
                    }
                }
            },
            orderBy: {
                room: {
                    number: 'asc'
                }
            }
        });

        // Create Workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`Billing ${month}-${year}`);

        // Define Columns
        worksheet.columns = [
            { header: 'Room', key: 'room', width: 10 },
            { header: 'Resident', key: 'resident', width: 25 },
            { header: 'Rent', key: 'rent', width: 15, style: { numFmt: '#,##0.00' } },
            { header: 'Water (Unit)', key: 'waterUnit', width: 15 },
            { header: 'Water (Total)', key: 'waterTotal', width: 15, style: { numFmt: '#,##0.00' } },
            { header: 'Elec (Unit)', key: 'elecUnit', width: 15 },
            { header: 'Elec (Total)', key: 'elecTotal', width: 15, style: { numFmt: '#,##0.00' } },
            { header: 'Internet', key: 'internet', width: 15, style: { numFmt: '#,##0.00' } },
            { header: 'Trash', key: 'trash', width: 15, style: { numFmt: '#,##0.00' } },
            { header: 'Other', key: 'other', width: 15, style: { numFmt: '#,##0.00' } },
            { header: 'Total', key: 'total', width: 15, style: { font: { bold: true }, numFmt: '#,##0.00' } },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Date', key: 'date', width: 15 },
        ];

        // Style Header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        // Add Data
        bills.forEach(bill => {
            const residentName = bill.room.residents[0]?.fullName || '-';

            const waterUnits = bill.waterMeterCurrent - bill.waterMeterLast;
            const waterAmount = waterUnits * bill.waterRate;

            const electricUnits = bill.electricMeterCurrent - bill.electricMeterLast;
            const electricAmount = electricUnits * bill.electricRate;

            worksheet.addRow({
                room: bill.room.number,
                resident: residentName,
                rent: bill.room.price,
                waterUnit: waterUnits,
                waterTotal: waterAmount,
                elecUnit: electricUnits,
                elecTotal: electricAmount,
                internet: bill.internetFee,
                trash: bill.trashFee,
                other: bill.otherFees,
                total: bill.totalAmount,
                status: bill.paymentStatus,
                date: bill.createdAt.toISOString().split('T')[0]
            });
        });

        // Add Summary Row
        const totalRow = worksheet.addRow({
            room: 'TOTAL',
            rent: { formula: `SUM(C2:C${bills.length + 1})` },
            waterTotal: { formula: `SUM(E2:E${bills.length + 1})` },
            elecTotal: { formula: `SUM(G2:G${bills.length + 1})` },
            internet: { formula: `SUM(H2:H${bills.length + 1})` },
            trash: { formula: `SUM(I2:I${bills.length + 1})` },
            other: { formula: `SUM(J2:J${bills.length + 1})` },
            total: { formula: `SUM(K2:K${bills.length + 1})` }
        });
        totalRow.font = { bold: true };

        // Buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Response
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="billing_report_${year}_${month}.xlsx"`
            }
        });

    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
    }
}
