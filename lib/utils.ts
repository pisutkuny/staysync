import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// ขนาดมิเตอร์: น้ำ 4 หลัก (0–9999), ไฟฟ้า 5 หลัก (0–99999)
export const WATER_METER_MAX = 10000;
export const ELECTRIC_METER_MAX = 100000;

/**
 * คำนวณปริมาณการใช้มิเตอร์ รองรับกรณีมิเตอร์หมุนเกิน (rollover)
 * - น้ำ 4 หลัก: maxReading = 10000
 * - ไฟฟ้า 5 หลัก: maxReading = 100000
 *
 * @param last        ค่ามิเตอร์เดือนก่อนหน้า
 * @param current     ค่ามิเตอร์เดือนนี้
 * @param maxReading  ค่าสูงสุดก่อน rollover (เช่น 10000 หรือ 100000)
 */
export function calcMeterUsage(last: number, current: number, maxReading: number): number {
    if (current >= last) {
        return current - last;             // ปกติ
    }
    return (maxReading - last) + current;  // มิเตอร์หมุนเกิน rollover
}
