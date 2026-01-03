import { redirect } from "next/navigation";
import { getOrCreateDefaultGroupAction } from "./actions/groups";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  // Varsayılan grubu getir veya oluştur, sonra yönlendir
  try {
    const result = await getOrCreateDefaultGroupAction();
    if (result.success && result.group) {
      redirect(`/grup/${result.group.id}`);
    }
  } catch (error) {
    console.error("Varsayılan grup oluşturulamadı:", error);
  }
  
  // Fallback: default-group'a yönlendir
  redirect("/grup/default-group");
}


