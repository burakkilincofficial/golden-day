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
 */
async function getOrCreateDefaultGroup() {
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
    const trackings = await db.monthTracking.findMany({
      where: { groupId: group.id },
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
    
    revalidatePath("/");
    
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
    
    // Eğer bu üye bir ayın host'u ise, host'u null yap
    await db.monthTracking.updateMany({
      where: { hostMemberId: memberId },
      data: { hostMemberId: null },
    });
    
    // Üyeyi sil (cascade ile ödemeler de silinir)
    await db.member.delete({
      where: { id: memberId },
    });
    
    revalidatePath("/");
    
    return { success: true };
  } catch (error) {
    console.error("Üye silme hatası:", error);
    return { success: false, error: "Üye silinirken bir hata oluştu" };
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

