"use client";

import { useState } from "react";
import { z } from "zod";
import { useGoldDayStore } from "@/store/gold-day-store";
import { addMemberAction, removeMemberAction, updateMemberAction, getMembersAction } from "@/app/actions/members";
import { getTrackingAction } from "@/app/actions/tracking";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Edit2 } from "lucide-react";

const memberSchema = z.object({
  name: z
    .string()
    .min(2, "İsim en az 2 karakter olmalıdır")
    .max(50, "İsim en fazla 50 karakter olabilir")
    .trim()
});

export function MemberManagement() {
  const { members, addMember, removeMember, updateMember, setMembers, setTracking } = useGoldDayStore();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<{ id: string; name: string } | null>(null);
  const [editMemberName, setEditMemberName] = useState("");

  const handleAddMember = async () => {
    setError(null);
    
    try {
      const validated = memberSchema.parse({ name: newMemberName });
      
      // Server action ile üye ekle
      const result = await addMemberAction(validated.name);
      
      if (!result.success) {
        setError(result.error || "Üye eklenirken bir hata oluştu");
        return;
      }
      
      // Server'dan güncel üyeleri ve tracking'leri çek ve store'u güncelle
      const [membersResult, trackingResult] = await Promise.all([
        getMembersAction(),
        getTrackingAction()
      ]);
      
      if (membersResult.success) {
        setMembers(membersResult.members);
      } else {
        // Fallback: Store'a manuel ekle
        if (result.member) {
          addMember(validated.name);
        }
      }
      
      if (trackingResult.success) {
        setTracking(trackingResult.trackings);
      }
      
      setNewMemberName("");
      setIsAddDialogOpen(false);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0]?.message ?? "Geçersiz giriş");
      } else {
        setError("Bir hata oluştu");
      }
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    // Son üye de silinebilir - kısıtlama kaldırıldı
    
    // Server action ile üye sil
    const result = await removeMemberAction(memberId);
    
    if (!result.success) {
      setError(result.error || "Üye silinirken bir hata oluştu");
      return;
    }
    
    // Server'dan güncel üyeleri ve tracking'leri çek ve store'u güncelle
    const [membersResult, trackingResult] = await Promise.all([
      getMembersAction(),
      getTrackingAction()
    ]);
    
    if (membersResult.success) {
      setMembers(membersResult.members);
    } else {
      // Fallback: Store'dan manuel sil
      removeMember(memberId);
    }
    
    if (trackingResult.success) {
      setTracking(trackingResult.trackings);
    }
    
    setDeleteConfirm(null);
  };

  const handleEditMember = async () => {
    if (!editingMember) return;
    
    setError(null);
    
    try {
      const validated = memberSchema.parse({ name: editMemberName });
      
      // Server action ile üye güncelle
      const result = await updateMemberAction(editingMember.id, validated.name);
      
      if (!result.success) {
        setError(result.error || "Üye güncellenirken bir hata oluştu");
        return;
      }
      
      // Server'dan güncel üyeleri çek ve store'u güncelle
      const membersResult = await getMembersAction();
      if (membersResult.success) {
        setMembers(membersResult.members);
      } else {
        // Fallback: Store'u manuel güncelle
        updateMember(editingMember.id, validated.name);
      }
      
      setEditingMember(null);
      setEditMemberName("");
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0]?.message ?? "Geçersiz giriş");
      } else {
        setError("Bir hata oluştu");
      }
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Grup Üyeleri</CardTitle>
            <CardDescription>Altın gününe katılan kişiler</CardDescription>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Üye Ekle
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {members.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-4">
              Henüz üye eklenmemiş. İlk üyeyi eklemek için yukarıdaki butona tıklayın.
            </p>
          ) : (
            members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-md border border-border/70 bg-navy-soft px-3 py-2 text-xs sm:text-sm"
              >
                <span>{member.name}</span>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[11px] text-gold-soft">
                    Üye
                  </span>
                  <button
                    onClick={() => {
                      setEditingMember({ id: member.id, name: member.name });
                      setEditMemberName(member.name);
                      setError(null);
                    }}
                    className="rounded-sm p-1 text-muted-foreground hover:text-gold-soft transition-colors"
                    title="Üye adını düzenle"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(member.id)}
                    className="rounded-sm p-1 text-muted-foreground hover:text-destructive transition-colors"
                    title="Üyeyi sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Üye Ekleme Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Üye Ekle</DialogTitle>
            <DialogDescription>
              Altın günü grubuna yeni bir üye ekleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="member-name" className="text-sm font-medium">
                Üye İsmi
              </label>
              <Input
                id="member-name"
                placeholder="Örn: Ayşe"
                value={newMemberName}
                onChange={(e) => {
                  setNewMemberName(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddMember();
                  }
                }}
                autoFocus
              />
              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setNewMemberName("");
                setError(null);
              }}
            >
              İptal
            </Button>
            <Button onClick={handleAddMember}>Ekle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Düzenleme Dialog */}
      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Üye Adını Düzenle</DialogTitle>
            <DialogDescription>
              Üye adını değiştirin. Bu değişiklik tüm kayıtlarda güncellenecektir.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="edit-member-name" className="text-sm font-medium">
                Üye İsmi
              </label>
              <Input
                id="edit-member-name"
                placeholder="Örn: Ayşe"
                value={editMemberName}
                onChange={(e) => {
                  setEditMemberName(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleEditMember();
                  }
                }}
                autoFocus
              />
              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingMember(null);
                setEditMemberName("");
                setError(null);
              }}
            >
              İptal
            </Button>
            <Button onClick={handleEditMember}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Silme Onay Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Üyeyi Sil</DialogTitle>
            <DialogDescription>
              Bu üyeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve üye tüm aylardan kaldırılacaktır.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
            >
              İptal
            </Button>
            <Button
              variant="default"
              onClick={() => deleteConfirm && handleDeleteMember(deleteConfirm)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

