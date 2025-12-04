"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const memberSchema = z.object({
  name: z.string().min(1, "İsim gereklidir").max(50, "İsim çok uzun"),
});

/**
 * Varsayılan grup ID'si (şimdilik tek grup)
 * İleride çoklu grup desteği eklenebilir
 */
const DEFAULT_GROUP_ID = "default-group";

/**
 * Varsayılan grubu oluştur veya getir
 * Eğer table yoksa otomatik olarak oluşturur
 */
async function getOrCreateDefaultGroup() {
  try {
    let group = await db.group.findFirst();
    
    if (!group) {
      group = await db.group.create({
        data: {
          id: DEFAULT_GROUP_ID,
          name: "Altın Günü Grubu",
        },
      });
    }
    
    return group;
  } catch (error: any) {
    // Eğer table yoksa (P2021 hatası), schema'yı push et
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      console.log('📦 Database schema bulunamadı, oluşturuluyor...');
      try {
        const { execSync } = require('child_process');
        execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
        console.log('✅ Database schema oluşturuldu');
        
        // Tekrar dene
        let group = await db.group.findFirst();
        if (!group) {
          group = await db.group.create({
            data: {
              id: DEFAULT_GROUP_ID,
              name: "Altın Günü Grubu",
            },
          });
        }
        return group;
      } catch (pushError) {
        console.error('❌ Database schema oluşturulamadı:', pushError);
        throw new Error('Database schema oluşturulamadı. Lütfen manuel olarak "npx prisma db push" çalıştırın.');
      }
    }
    throw error;
  }
}

/**
 * Üye ekle
 */
export async function addMemberAction(name: string) {
  try {
    // Validation
    const validated = memberSchema.parse({ name });
    
    // Varsayılan grubu al
    const group = await getOrCreateDefaultGroup();
    
    // Üye ekle
    const member = await db.member.create({
      data: {
        name: validated.name.trim(),
        groupId: group.id,
      },
    });
    
    // Tüm mevcut aylık takipler için ödeme kaydı oluştur
    // NOT: Yeni tracking oluşturulmaz, sadece mevcut tracking'lere payment eklenir
    // Kura çek butonuna basıldığında tracking'ler güncellenir
    const trackings = await db.monthTracking.findMany({
      where: { groupId: group.id },
      orderBy: [{ year: "asc" }, { month: "asc" }],
    });
    
    for (const tracking of trackings) {
      await db.payment.create({
        data: {
          memberId: member.id,
          monthTrackingId: tracking.id,
          paid: false,
        },
      });
    }
    
    // revalidatePath kaldırıldı - client state güncellemesi yeterli
    // revalidatePath("/");
    
    return { success: true, member };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    
    // Prisma unique constraint hatası
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { success: false, error: "Bu isimde bir üye zaten var" };
    }
    
    console.error("Üye ekleme hatası:", error);
    return { success: false, error: "Üye eklenirken bir hata oluştu" };
  }
}

/**
 * Üye sil
 */
export async function removeMemberAction(memberId: string) {
  try {
    const member = await db.member.findUnique({
      where: { id: memberId },
      include: {
        payments: true,
        group: true,
      },
    });
    
    if (!member) {
      return { success: false, error: "Üye bulunamadı" };
    }
    
    // NOT: Tracking'ler silinmez, sadece üye ve payment'ları silinir
    // Kura çek butonuna basıldığında tracking'ler güncellenir
    // Üyeyi sil (cascade ile ödemeler de silinir)
    await db.member.delete({
      where: { id: memberId },
    });
    
    // revalidatePath kaldırıldı - client state güncellemesi yeterli
    // revalidatePath("/");
    
    return { success: true };
  } catch (error) {
    console.error("Üye silme hatası:", error);
    return { success: false, error: "Üye silinirken bir hata oluştu" };
  }
}

/**
 * Üye güncelle
 */
export async function updateMemberAction(memberId: string, newName: string) {
  try {
    // Validation
    const validated = memberSchema.parse({ name: newName });
    
    // Üyeyi bul
    const member = await db.member.findUnique({
      where: { id: memberId },
    });
    
    if (!member) {
      return { success: false, error: "Üye bulunamadı" };
    }
    
    // Üye adını güncelle
    const updatedMember = await db.member.update({
      where: { id: memberId },
      data: {
        name: validated.name.trim(),
      },
    });
    
    // Tüm payment kayıtlarındaki memberName'i güncelle (eğer gerekirse)
    // Not: Payment tablosunda memberName yok, sadece memberId var
    // Ama tracking'lerde memberName kullanılıyor, bu yüzden tracking'leri de güncellemek gerekebilir
    // Şimdilik sadece member adını güncelliyoruz, tracking'lerdeki memberName client-side güncellenecek
    
    return { success: true, member: updatedMember };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    
    // Prisma unique constraint hatası
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { success: false, error: "Bu isimde bir üye zaten var" };
    }
    
    console.error("Üye güncelleme hatası:", error);
    return { success: false, error: "Üye güncellenirken bir hata oluştu" };
  }
}

/**
 * Tüm üyeleri getir
 */
export async function getMembersAction() {
  try {
    const group = await getOrCreateDefaultGroup();
    
    const members = await db.member.findMany({
      where: { groupId: group.id },
      orderBy: { createdAt: "asc" },
    });
    
    return { success: true, members };
  } catch (error) {
    console.error("Üyeleri getirme hatası:", error);
    return { success: false, error: "Üyeler getirilirken bir hata oluştu", members: [] };
  }
}

