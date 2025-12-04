import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Database schema'yı otomatik oluştur
 * İlk kullanımda veya table yoksa çağrılır
 */
export async function POST() {
  try {
    // Önce table'ların var olup olmadığını kontrol et
    await db.group.findFirst();
    
    return NextResponse.json({ 
      success: true, 
      message: "Database schema zaten mevcut" 
    });
  } catch (error: any) {
    // Eğer table yoksa (P2021 hatası), schema'yı push et
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      try {
        const { execSync } = require('child_process');
        execSync('npx prisma db push --accept-data-loss', { 
          stdio: 'pipe',
          env: process.env
        });
        
        return NextResponse.json({ 
          success: true, 
          message: "Database schema başarıyla oluşturuldu" 
        });
      } catch (pushError: any) {
        console.error('Database schema oluşturma hatası:', pushError);
        return NextResponse.json(
          { 
            success: false, 
            error: "Database schema oluşturulamadı",
            details: pushError.message 
          },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Beklenmeyen hata",
        details: error.message 
      },
      { status: 500 }
    );
  }
}

