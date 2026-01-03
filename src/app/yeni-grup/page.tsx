import { CreateGroupForm } from "@/components/groups/create-group-form";
import { getOrCreateDefaultGroupAction } from "@/app/actions/groups";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function NewGroupPage() {
  // Varsayılan grubu kontrol et
  const defaultGroup = await getOrCreateDefaultGroupAction();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Yeni Altın Günü Grubu Oluştur</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kendi altın günü grubunuzu oluşturun ve arkadaşlarınızla paylaşın
        </p>
      </div>
      
      <CreateGroupForm defaultGroupId={defaultGroup.group?.id} />
    </div>
  );
}

