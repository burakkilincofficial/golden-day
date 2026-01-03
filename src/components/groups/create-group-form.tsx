"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createGroupAction } from "@/app/actions/groups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { Plus, Users } from "lucide-react";

interface CreateGroupFormProps {
  defaultGroupId?: string;
}

export function CreateGroupForm({ defaultGroupId }: CreateGroupFormProps) {
  const router = useRouter();
  const [groupName, setGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!groupName.trim()) {
      setError("Grup adı gereklidir");
      return;
    }

    setIsCreating(true);
    try {
      const result = await createGroupAction(groupName.trim());
      
      if (result.success && result.group) {
        // Yeni gruba yönlendir
        router.push(`/grup/${result.group.id}`);
      } else {
        setError(result.error || "Grup oluşturulamadı");
      }
    } catch (error: any) {
      setError(error.message || "Grup oluşturulurken bir hata oluştu");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gold" />
          <CardTitle>Yeni Grup Oluştur</CardTitle>
        </div>
        <CardDescription>
          Grup adınızı girin, otomatik olarak bir paylaşım kodu oluşturulacak
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="groupName" className="text-sm font-medium">
              Grup Adı
            </label>
            <Input
              id="groupName"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Örn: İş Arkadaşları Altın Günü"
              disabled={isCreating}
              className="w-full"
              maxLength={100}
            />
          </div>
          
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isCreating || !groupName.trim()}
              className="flex-1"
            >
              {isCreating ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Grup Oluştur
                </>
              )}
            </Button>
            {defaultGroupId && (
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/grup/${defaultGroupId}`)}
                disabled={isCreating}
              >
                İptal
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

