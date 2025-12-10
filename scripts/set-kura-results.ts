/**
 * Manuel kura sonuçlarını veritabanına kaydeder
 * 
 * Kullanım:
 * npx tsx scripts/set-kura-results.ts
 * 
 * veya
 * 
 * npm run set-kura
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_GROUP_ID = "default-group";

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

async function setKuraResults() {
  try {
    console.log("🔄 Kura sonuçları kaydediliyor...");

    // Group'u bul veya oluştur
    let group = await prisma.group.findFirst();
    
    if (!group) {
      group = await prisma.group.create({
        data: {
          id: DEFAULT_GROUP_ID,
          name: "Altın Günü Grubu",
          kuraCekildi: false,
        },
      });
      console.log("✅ Group oluşturuldu");
    }

    // Üyeleri al
    const members = await prisma.member.findMany({
      where: { groupId: group.id },
    });

    if (members.length === 0) {
      console.error("❌ Üye bulunamadı! Önce üyeleri ekleyin.");
      return;
    }

    console.log(`📋 ${members.length} üye bulundu`);

    // 2026 yılından başlayarak kaydet
    const startYear = 2026;

    for (const assignment of kuraSonuclari) {
      const member = members.find(
        (m) => m.name.toLowerCase().trim() === assignment.memberName.toLowerCase().trim()
      );

      if (!member) {
        console.warn(`⚠️  Üye bulunamadı: ${assignment.memberName}`);
        continue;
      }

      const month = assignment.month;
      const year = startYear;

      const monthNames = [
        "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
        "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
      ];

      let tracking = await prisma.monthTracking.findFirst({
        where: {
          groupId: group.id,
          month,
          year,
        },
        include: { payments: true },
      });

      if (tracking) {
        tracking = await prisma.monthTracking.update({
          where: { id: tracking.id },
          data: { hostMemberId: member.id },
          include: { payments: true },
        });
        console.log(`✅ ${monthNames[month - 1]} ${year} güncellendi: ${member.name}`);
      } else {
        tracking = await prisma.monthTracking.create({
          data: {
            groupId: group.id,
            month,
            year,
            hostMemberId: member.id,
          },
          include: { payments: true },
        });

        // Tüm üyeler için ödeme kayıtları oluştur
        for (const m of members) {
          await prisma.payment.create({
            data: {
              memberId: m.id,
              monthTrackingId: tracking.id,
              paid: false,
            },
          });
        }

        console.log(`✅ ${monthNames[month - 1]} ${year} oluşturuldu: ${member.name}`);
      }
    }

    // 2025 yılındaki tüm tracking'leri sil (sadece 2026'dan başlamalı)
    const trackingsToDelete = await prisma.monthTracking.findMany({
      where: {
        groupId: group.id,
        year: { lt: 2026 }, // 2026'dan küçük tüm yıllar
      },
    });
    
    for (const toDelete of trackingsToDelete) {
      await prisma.monthTracking.delete({
        where: { id: toDelete.id },
      });
      console.log(`🗑️  Silindi: ${toDelete.year} yılı ${toDelete.month}. ay`);
    }
    
    // Oluşturulan tracking'lerin dışındaki 2026 yılı tracking'lerini de sil
    const all2026Trackings = await prisma.monthTracking.findMany({
      where: {
        groupId: group.id,
        year: 2026,
      },
    });
    
    const createdTrackingIds = all2026Trackings
      .filter((t) => kuraSonuclari.some((k) => k.month === t.month))
      .map((t) => t.id);
    
    const extra2026Trackings = all2026Trackings.filter(
      (t) => !createdTrackingIds.includes(t.id)
    );
    
    for (const toDelete of extra2026Trackings) {
      await prisma.monthTracking.delete({
        where: { id: toDelete.id },
      });
      console.log(`🗑️  Silindi: 2026 yılı ${toDelete.month}. ay (ekstra)`);
    }

    // Kura çekildi olarak işaretle
    await prisma.group.update({
      where: { id: group.id },
      data: { kuraCekildi: true },
    });

    console.log("✅ Kura sonuçları başarıyla kaydedildi!");
    console.log("✅ Kura çekildi olarak işaretlendi!");
  } catch (error) {
    console.error("❌ Hata:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setKuraResults()
  .then(() => {
    console.log("🎉 İşlem tamamlandı!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Kritik hata:", error);
    process.exit(1);
  });

