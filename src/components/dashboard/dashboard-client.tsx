"use client";

import { useEffect, useState } from "react";
import type {
  GoldPriceSnapshot,
  Member,
  MonthTracking
} from "@/types/gold-day";
import { useGoldDayStore } from "@/store/gold-day-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { MemberManagement } from "@/components/members/member-management";
import { Loader, LoaderOverlay } from "@/components/ui/loader";
import { Shuffle, RefreshCw, Download, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { getGoldPriceAction } from "@/app/actions/gold-price";
import { redrawLotsAction, updatePaymentAction, getTrackingAction, updatePreferredDeliveryDateAction } from "@/app/actions/tracking";
import { exportToExcel } from "@/lib/export-excel";

interface DashboardClientProps {
  members: Member[];
  initialTracking: MonthTracking[];
  goldPrice: GoldPriceSnapshot;
  kuraCekildi: boolean;
  groupId?: string;
  groupName?: string;
  shareCode?: string | null;
}

const monthLabels = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık"
];

export function DashboardClient({
  members,
  initialTracking,
  goldPrice,
  kuraCekildi,
  groupId = "default-group",
  groupName,
  shareCode
}: DashboardClientProps) {
  const { 
    members: storeMembers, 
    tracking, 
    currentGroupId,
    togglePayment, 
    resetPayments,
    setMembers,
    setTracking,
    setCurrentGroupId,
    redrawLots
  } = useGoldDayStore();
  const [isDrawDialogOpen, setIsDrawDialogOpen] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentGoldPrice, setCurrentGoldPrice] = useState<GoldPriceSnapshot>(goldPrice);
  const [isRefreshingPrice, setIsRefreshingPrice] = useState(false);

  // Sadece grup değiştiğinde veya ilk yüklemede store'u güncelle
  useEffect(() => {
    // Eğer grup değiştiyse, store'u yeni grubun verileriyle güncelle
    if (currentGroupId !== groupId) {
      setCurrentGroupId(groupId);
      setMembers(members);
      setTracking(initialTracking);
    } else if (currentGroupId === null) {
      // İlk yükleme - store'u doldur
      setCurrentGroupId(groupId);
      setMembers(members);
      setTracking(initialTracking);
    }
    // Aynı grup içinde store güncellemesi yapıldıysa (üye eklendi/silindi),
    // props'tan gelen members'ı override etme - store'daki güncel veriyi koru
  }, [groupId, currentGroupId]); // Sadece groupId değiştiğinde çalış


  const currentMembers = storeMembers;

  const currentDate = new Date();
  const activeMonthIndex = currentDate.getMonth() + 1;
  const activeYear = currentDate.getFullYear();
  const activeMonth =
    tracking.find((m) => m.month === activeMonthIndex && m.year === activeYear) ?? tracking[0];
  const activeHost = currentMembers.find((m) => m.id === activeMonth?.hostMemberId);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Güncel Altın Fiyatı</CardTitle>
              <CardDescription>
                Gerçek zamanlı altın fiyatları (TL)
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setIsRefreshingPrice(true);
                try {
                  // İzin verilen saatler dışında bile zorla güncelle
                  const response = await fetch("/api/force-update-gold-price");
                  const result = await response.json();
                  
                  if (result.success && result.data) {
                    setCurrentGoldPrice(result.data);
                  } else {
                    // Fallback: Normal action'ı dene
                    const newPrice = await getGoldPriceAction();
                    setCurrentGoldPrice(newPrice);
                  }
                } catch (error: any) {
                  console.error("Fiyat güncellenemedi:", error);
                  // Fallback: Normal action'ı dene
                  try {
                    const newPrice = await getGoldPriceAction();
                    setCurrentGoldPrice(newPrice);
                  } catch (fallbackError: any) {
                    if (fallbackError?.message?.includes("İstek yapılamaz")) {
                      alert(fallbackError.message);
                    }
                  }
                } finally {
                  setIsRefreshingPrice(false);
                }
              }}
              disabled={isRefreshingPrice}
              title="Altın fiyatlarını güncelle (İzin verilen saatler dışında bile çalışır)"
            >
              {isRefreshingPrice ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Güncelleniyor...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Yenile
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 sm:gap-3">
              <div className="flex flex-col gap-0.5">
                <p className="text-[10px] text-muted-foreground sm:text-xs">Gram</p>
                <p className="text-sm font-semibold text-gold sm:text-base">
                  {currentGoldPrice.gram.toLocaleString("tr-TR")} TL
                </p>
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-[10px] text-muted-foreground sm:text-xs">Çeyrek</p>
                <p className="text-sm font-semibold sm:text-base">
                  {currentGoldPrice.quarter.toLocaleString("tr-TR")} TL
                </p>
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-[10px] text-muted-foreground sm:text-xs">Yarım</p>
                <p className="text-sm font-semibold sm:text-base">
                  {currentGoldPrice.half.toLocaleString("tr-TR")} TL
                </p>
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-[10px] text-muted-foreground sm:text-xs">Tam</p>
                <p className="text-sm font-semibold sm:text-base">
                  {currentGoldPrice.full.toLocaleString("tr-TR")} TL
                </p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/50">
              Güncelleme: {currentGoldPrice.updatedAt}
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Bu Ayın Ev Sahibi</CardTitle>
            <CardDescription>
              Bugünkü tarihe göre otomatik belirlenir.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4 text-sm">
            {currentMembers.length === 0 ? (
              <p className="text-xs text-muted-foreground w-full text-center py-2">
                Henüz üye eklenmemiş. Üye ekleyip kura çekin.
              </p>
            ) : activeMonth && activeHost ? (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {monthLabels[activeMonth.month - 1]} ayı ev sahibi
                  </p>
                  <p className="text-xl font-semibold text-gold-soft">
                    {activeHost?.name ?? activeMonth?.hostMemberName ?? "-"}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  <p>Toplam üye: {currentMembers.length}</p>
                  <p>Takip edilen ay sayısı: {tracking.length}</p>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Henüz takip verisi oluşturulmadı.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-1">
          <MemberManagement groupId={groupId} />
        </div>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>
                {currentMembers.length > 0 
                  ? `${currentMembers.length} Aylık Kura / Sıra`
                  : "12 Aylık Kura / Sıra"}
              </CardTitle>
              <CardDescription>
                Mevcut aydan başlayarak sırayla atanmış zaman çizelgesi
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {!kuraCekildi && (
                <Button
                  variant="default"
                  size="sm"
                  type="button"
                  onClick={() => setIsDrawDialogOpen(true)}
                  disabled={currentMembers.length === 0 || isDrawing}
                >
                  {isDrawing ? (
                    <>
                      <Loader size="sm" className="mr-2" />
                      Çekiliyor...
                    </>
                  ) : (
                    <>
                      <Shuffle className="mr-2 h-4 w-4" />
                      Kura Çek
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => {
                  if (tracking.length > 0 && currentMembers.length > 0) {
                    exportToExcel(currentMembers, tracking);
                  }
                }}
                disabled={tracking.length === 0 || currentMembers.length === 0}
                title="Kura çekimi sonuçlarını Excel olarak indir"
              >
                <Download className="mr-2 h-4 w-4" />
                Excel İndir
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={resetPayments}
                disabled={isDrawing}
              >
                Ödemeleri Sıfırla
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <LoaderOverlay isLoading={isDrawing}>
            <div className="relative flex gap-4 overflow-x-auto pb-2 text-xs sm:text-sm">
              <div className="absolute left-4 top-4 bottom-4 w-px bg-border" />
              <ul className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {tracking.map((month) => {
                  const host = currentMembers.find((m) => m.id === month.hostMemberId);
                  const isCurrent = month.month === activeMonthIndex && month.year === activeYear;
                  const paidCount = month.payments.filter(
                    (p) => p.paid
                  ).length;

                  return (
                    <li
                      key={month.id}
                      className={cn(
                        "relative flex flex-col gap-1 rounded-md border border-border bg-navy-soft px-3 py-2",
                        isCurrent && "border-gold-soft shadow-soft-gold"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-gold-soft" />
                          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            {monthLabels[month.month - 1]}
                            {month.year !== activeYear && (
                              <span className="ml-1 text-[10px] normal-case">({month.year})</span>
                            )}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {paidCount}/{month.payments.length} ödendi
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gold">
                        {month.hostMemberName || "-"}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
            </LoaderOverlay>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Ödeme Takip Tablosu</CardTitle>
              <CardDescription>
                Bu ay ve diğer aylar için ödeme durumları
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {currentMembers.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-8">
                Henüz üye eklenmemiş. Üye ekleyip kura çekin.
              </p>
            ) : tracking.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-8">
                Henüz takip verisi oluşturulmadı. Kura çekin.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ay</TableHead>
                    <TableHead>Ev Sahibi</TableHead>
                    {currentMembers.map((member) => (
                      <TableHead key={member.id}>{member.name}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tracking.map((month) => {
                    const host = currentMembers.find((m) => m.id === month.hostMemberId);

                    return (
                      <TableRow key={month.id}>
                        <TableCell className="text-xs sm:text-sm">
                          {monthLabels[month.month - 1]}
                          {month.year !== activeYear && (
                            <span className="ml-1 text-[10px] text-muted-foreground">({month.year})</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <div className="flex flex-col gap-1.5">
                            <span className="font-medium">{month.hostMemberName || "-"}</span>
                            {month.hostMemberId && (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                  <Input
                                    type="date"
                                    value={month.preferredDeliveryDate || ""}
                                    onChange={async (e) => {
                                      const newDate = e.target.value || null;
                                      const result = await updatePreferredDeliveryDateAction(month.id, newDate, groupId);
                                      
                                      if (result.success) {
                                        // Store'u güncelle
                                        const updatedTracking = tracking.map((t) =>
                                          t.id === month.id
                                            ? { ...t, preferredDeliveryDate: newDate }
                                            : t
                                        );
                                        setTracking(updatedTracking);
                                        
                                        // Sayfayı yenile (veritabanından güncel veriyi almak için)
                                        window.location.reload();
                                      }
                                    }}
                                    className="h-7 text-[11px] px-2 py-0 w-full max-w-[140px]"
                                    min={`${month.year}-${String(month.month).padStart(2, '0')}-01`}
                                    max={`${month.year}-${String(month.month).padStart(2, '0')}-31`}
                                    title="Altınları hangi gün getirmek istediğinizi seçin"
                                    placeholder="Tarih seçin"
                                  />
                                </div>
                                {month.preferredDeliveryDate && (
                                  <span className="text-[10px] text-gold-soft ml-4">
                                    📅 {new Date(month.preferredDeliveryDate).toLocaleDateString("tr-TR", {
                                      day: "numeric",
                                      month: "long"
                                    })}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        {currentMembers.map((member) => {
                          const payment = month.payments.find(
                            (p) => p.memberId === member.id
                          );
                          const isHost = member.id === month.hostMemberId;

                          if (!payment) {
                            return (
                              <TableCell key={member.id} className="text-center">
                                -
                              </TableCell>
                            );
                          }

                          return (
                            <TableCell
                              key={member.id}
                              className="text-center"
                            >
                              {isHost ? (
                                <span className="text-[11px] text-muted-foreground">
                                  Ev sahibi
                                </span>
                              ) : (
                                <Checkbox
                                  checked={payment?.paid || false}
                                  onChange={async () => {
                                    const newPaidStatus = !(payment?.paid || false);
                                    await updatePaymentAction(month.id, member.id, newPaidStatus, groupId);
                                    togglePayment(month.month, member.id);
                                  }}
                                />
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      <Dialog open={isDrawDialogOpen} onOpenChange={setIsDrawDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Kura Çek</DialogTitle>
            <DialogDescription>
              Bu işlem 12 aylık ev sahibi sıralamasını yeniden belirleyecektir. 
              Mevcut ödeme durumları korunacak, ancak ev sahipleri değişecektir.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Devam etmek istediğinizden emin misiniz?
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDrawDialogOpen(false)}
            >
              İptal
            </Button>
            <Button
              variant="default"
              onClick={async () => {
                setIsDrawDialogOpen(false);
                setIsDrawing(true);
                
                await new Promise((resolve) => setTimeout(resolve, 1500));
                
                const result = await redrawLotsAction(groupId);
                
                if (result.success && result.trackings) {
                  setTracking(result.trackings);
                  window.location.reload();
                }
                
                setIsDrawing(false);
              }}
              disabled={isDrawing}
            >
              {isDrawing ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Çekiliyor...
                </>
              ) : (
                "Evet, Kura Çek"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

