"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const groupSchema = z.object({
  name: z.string().min(1, "Grup adı gereklidir").max(100, "Grup adı çok uzun"),
});

/**
 * Benzersiz paylaşım kodu oluşturur
 */
function generateShareCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // I, O, 0, 1 harfleri yok
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Yeni grup oluşturur
 */
export async function createGroupAction(name: string) {
  try {
    const validated = groupSchema.parse({ name });
    
    // Paylaşım kodu oluştur (benzersiz olana kadar dene)
    let shareCode = generateShareCode();
    let attempts = 0;
    while (await db.group.findFirst({ where: { shareCode } }) && attempts < 10) {
      shareCode = generateShareCode();
      attempts++;
    }
    
    if (attempts >= 10) {
      return { success: false, error: "Paylaşım kodu oluşturulamadı, lütfen tekrar deneyin" };
    }
    
    const group = await db.group.create({
      data: {
        name: validated.name.trim(),
        shareCode,
        isDefault: false,
        kuraCekildi: false,
      },
    });
    
    revalidatePath("/");
    return { success: true, group };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    
    console.error("Grup oluşturma hatası:", error);
    return { success: false, error: "Grup oluşturulurken bir hata oluştu" };
  }
}

/**
 * Paylaşım kodu ile grubu bulur
 */
export async function getGroupByShareCodeAction(shareCode: string) {
  try {
    const group = await db.group.findFirst({
      where: { shareCode: shareCode.toUpperCase() },
      include: {
        members: {
          orderBy: { createdAt: "asc" },
        },
        trackings: {
          orderBy: [{ year: "asc" }, { month: "asc" }],
        },
      },
    });
    
    if (!group) {
      return { success: false, error: "Grup bulunamadı", group: null };
    }
    
    return { success: true, group };
  } catch (error) {
    console.error("Grup getirme hatası:", error);
    return { success: false, error: "Grup getirilirken bir hata oluştu", group: null };
  }
}

/**
 * Grup ID ile grubu getirir
 */
export async function getGroupByIdAction(groupId: string) {
  try {
    const group = await db.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          orderBy: { createdAt: "asc" },
        },
        trackings: {
          orderBy: [{ year: "asc" }, { month: "asc" }],
        },
      },
    });
    
    if (!group) {
      return { success: false, error: "Grup bulunamadı", group: null };
    }
    
    return { success: true, group };
  } catch (error) {
    console.error("Grup getirme hatası:", error);
    return { success: false, error: "Grup getirilirken bir hata oluştu", group: null };
  }
}

/**
 * Tüm grupları listeler
 */
export async function getAllGroupsAction() {
  try {
    const groups = await db.group.findMany({
      orderBy: [
        { isDefault: "desc" }, // Varsayılan grup önce
        { createdAt: "asc" },
      ],
      select: {
        id: true,
        name: true,
        shareCode: true,
        isDefault: true,
        kuraCekildi: true,
        createdAt: true,
        _count: {
          select: {
            members: true,
            trackings: true,
          },
        },
      },
    });
    
    return { success: true, groups };
  } catch (error) {
    console.error("Grupları getirme hatası:", error);
    return { success: false, error: "Gruplar getirilirken bir hata oluştu", groups: [] };
  }
}

/**
 * Varsayılan grubu getirir veya oluşturur
 */
export async function getOrCreateDefaultGroupAction() {
  try {
    // Önce ID ile kontrol et
    let group = await db.group.findUnique({
      where: { id: "default-group" },
    });
    
    // Eğer ID ile bulunamazsa, isDefault ile kontrol et
    if (!group) {
      group = await db.group.findFirst({
        where: { isDefault: true },
      });
    }
    
    // Eğer hala yoksa, oluştur
    if (!group) {
      try {
        group = await db.group.create({
          data: {
            id: "default-group",
            name: "Altın Günü Grubu",
            isDefault: true,
            kuraCekildi: false,
          },
        });
      } catch (createError: any) {
        // Eğer ID zaten varsa, onu getir
        if (createError.code === 'P2002') {
          group = await db.group.findUnique({
            where: { id: "default-group" },
          });
        } else {
          throw createError;
        }
      }
    }
    
    return { success: true, group };
  } catch (error) {
    console.error("Varsayılan grup getirme hatası:", error);
    return { success: false, error: "Varsayılan grup getirilirken bir hata oluştu", group: null };
  }
}

