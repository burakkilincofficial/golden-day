import * as XLSX from "xlsx";
import type { Member, MonthTracking } from "@/types/gold-day";

const monthLabels = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık"
];

/**
 * Kura çekimi sonuçlarını Excel formatında export et
 */
export function exportToExcel(
  members: Member[],
  tracking: MonthTracking[],
  filename?: string
): void {
  // Ana veri sayfası: Kura Sırası
  const drawData: any[] = [
    ["Ay", "Yıl", "Ev Sahibi", "Ödeme Sayısı", "Toplam Üye"]
  ];

  tracking.forEach((month) => {
    const paidCount = month.payments.filter((p) => p.paid).length;
    const monthName = monthLabels[month.month - 1];
    const yearLabel = month.year !== new Date().getFullYear() 
      ? `${month.year}` 
      : "";
    
    drawData.push([
      monthName,
      month.year,
      month.hostMemberName || "-",
      `${paidCount}/${month.payments.length}`,
      month.payments.length
    ]);
  });

  // Ödeme takip sayfası
  const paymentData: any[] = [];
  
  // Başlık satırı
  const headerRow = ["Ay", "Yıl", "Ev Sahibi", ...members.map((m) => m.name)];
  paymentData.push(headerRow);

  // Her ay için satır
  tracking.forEach((month) => {
    const monthName = monthLabels[month.month - 1];
    const row: any[] = [
      monthName,
      month.year,
      month.hostMemberName || "-"
    ];

    // Her üye için ödeme durumu
    members.forEach((member) => {
      const payment = month.payments.find((p) => p.memberId === member.id);
      const isHost = member.id === month.hostMemberId;
      
      if (isHost) {
        row.push("Ev Sahibi");
      } else if (payment) {
        row.push(payment.paid ? "Ödendi ✓" : "Ödenmedi");
      } else {
        row.push("-");
      }
    });

    paymentData.push(row);
  });

  // Excel workbook oluştur
  const workbook = XLSX.utils.book_new();

  // Kura Sırası sayfası
  const drawSheet = XLSX.utils.aoa_to_sheet(drawData);
  XLSX.utils.book_append_sheet(workbook, drawSheet, "Kura Sırası");

  // Ödeme Takibi sayfası
  const paymentSheet = XLSX.utils.aoa_to_sheet(paymentData);
  XLSX.utils.book_append_sheet(workbook, paymentSheet, "Ödeme Takibi");

  // Kolon genişliklerini ayarla
  drawSheet["!cols"] = [
    { wch: 12 }, // Ay
    { wch: 6 },  // Yıl
    { wch: 20 }, // Ev Sahibi
    { wch: 15 }, // Ödeme Sayısı
    { wch: 12 }  // Toplam Üye
  ];

  paymentSheet["!cols"] = [
    { wch: 12 }, // Ay
    { wch: 6 },  // Yıl
    { wch: 20 }, // Ev Sahibi
    ...members.map(() => ({ wch: 15 })) // Her üye için kolon
  ];

  // Dosyayı indir
  const defaultFilename = `altin-gunu-kura-${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(workbook, filename || defaultFilename);
}

