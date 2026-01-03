"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const memberSchema = z.object({
  name: z.string().min(1, "İsim gereklidir").max(50, "İsim çok uzun"),
});

async function getOrCreateGroup(groupId: string) {
  try {
    let group = await db.group.findUnique({
      where: { id: groupId },
    });
    
    if (!group) {
      // Eğer default-group ise varsayılan grup oluştur
      if (groupId === "default-group") {
        group = await db.group.create({
          data: {
            id: "default-group",
            name: "Altın Günü Grubu",
            isDefault: true,
            kuraCekildi: false,
          },
        });
      } else {
        throw new Error("Grup bulunamadı");
      }
    }
    
    return group;
  } catch (error: any) {
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      console.log('📦 Database schema bulunamadı, oluşturuluyor...');
      try {
        const { execSync } = require('child_process');
        execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
        console.log('✅ Database schema oluşturuldu');
        
        let group = await db.group.findUnique({
          where: { id: groupId },
        });
        if (!group && groupId === "default-group") {
          group = await db.group.create({
            data: {
              id: "default-group",
              name: "Altın Günü Grubu",
              isDefault: true,
              kuraCekildi: false,
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

export async function addMemberAction(name: string, groupId: string = "default-group") {
  try {
    const validated = memberSchema.parse({ name });
    
    const group = await getOrCreateGroup(groupId);
    
    const member = await db.member.create({
      data: {
        name: validated.name.trim(),
        groupId: group.id,
      },
    });
    
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

export async function removeMemberAction(memberId: string, groupId?: string) {
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

    // Eğer groupId verilmişse, member'ın o gruba ait olduğunu kontrol et
    if (groupId) {
      const group = await getOrCreateGroup(groupId);
      if (member.groupId !== group.id) {
        return { success: false, error: "Bu işlem için yetkiniz yok" };
      }
    }
    
    await db.member.delete({
      where: { id: memberId },
    });
    
    return { success: true };
  } catch (error) {
    console.error("Üye silme hatası:", error);
    return { success: false, error: "Üye silinirken bir hata oluştu" };
  }
}

export async function updateMemberAction(memberId: string, newName: string, groupId?: string) {
  try {
    const validated = memberSchema.parse({ name: newName });
    
    const member = await db.member.findUnique({
      where: { id: memberId },
      select: { groupId: true },
    });
    
    if (!member) {
      return { success: false, error: "Üye bulunamadı" };
    }

    // Eğer groupId verilmişse, member'ın o gruba ait olduğunu kontrol et
    if (groupId) {
      const group = await getOrCreateGroup(groupId);
      if (member.groupId !== group.id) {
        return { success: false, error: "Bu işlem için yetkiniz yok" };
      }
    }
    
    const updatedMember = await db.member.update({
      where: { id: memberId },
      data: {
        name: validated.name.trim(),
      },
    });
    
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

export async function getMembersAction(groupId: string = "default-group") {
  try {
    const group = await getOrCreateGroup(groupId);
    
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

