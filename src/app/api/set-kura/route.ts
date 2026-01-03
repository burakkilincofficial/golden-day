import { NextResponse } from "next/server";
import { setManualKuraAction } from "@/app/actions/tracking";

// Verilen kura sonuçları
const kuraSonuclari = [
  { memberName: "Betül", month: 1 },   // Ocak
  { memberName: "Hüseyin", month: 2 },  // Şubat
  { memberName: "Selina", month: 3 },   // Mart
  { memberName: "Ayşe", month: 4 },     // Nisan
  { memberName: "Burak", month: 5 },    // Mayıs
  { memberName: "Atakan", month: 6 },  // Haziran
  { memberName: "Ayça", month: 7 },     // Temmuz
  { memberName: "Seda", month: 8 },     // Ağustos
  { memberName: "Neslihan", month: 9 }, // Eylül
  { memberName: "Ramazan", month: 10 }, // Ekim
  { memberName: "Nevra", month: 11 },   // Kasım
  { memberName: "Hicran", month: 12 },  // Aralık
];

export async function POST() {
  try {
    const result = await setManualKuraAction("default-group", kuraSonuclari);
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: "Kura sonuçları başarıyla kaydedildi!",
        trackings: result.trackings 
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Kura kaydetme hatası:", error);
    return NextResponse.json(
      { success: false, error: "Kura kaydedilirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

