import { create } from "zustand";
import type { Member, MemberId, MonthTracking } from "@/types/gold-day";
import { createNewDraw } from "@/lib/mock-data";

interface GoldDayState {
  members: Member[];
  tracking: MonthTracking[];
  togglePayment: (monthIndex: number, memberId: MemberId) => void;
  resetPayments: () => void;
  addMember: (name: string) => void;
  removeMember: (memberId: MemberId) => void;
  setMembers: (members: Member[]) => void;
  setTracking: (tracking: MonthTracking[]) => void;
  redrawLots: () => void;
}

export const useGoldDayStore = create<GoldDayState>((set) => ({
  members: [],
  tracking: [],
  togglePayment: (monthIndex, memberId) =>
    set((state) => ({
      tracking: state.tracking.map((month) => {
        if (month.monthIndex !== monthIndex) return month;
        return {
          ...month,
          payments: month.payments.map((p) =>
            p.memberId === memberId
              ? { ...p, hasPaid: !p.hasPaid }
              : p
          )
        };
      })
    })),
  resetPayments: () =>
    set((state) => ({
      tracking: state.tracking.map((month) => ({
        ...month,
        payments: month.payments.map((p) => ({
          ...p,
          hasPaid: false
        }))
      }))
    })),
  addMember: (name) =>
    set((state) => {
      const newMember: Member = {
        id: `m${Date.now()}`,
        name: name.trim()
      };
      const updatedMembers = [...state.members, newMember];
      
      // Yeni üyeyi tüm ayların payment listesine ekle
      const updatedTracking = state.tracking.map((month) => ({
        ...month,
        payments: [
          ...month.payments,
          { memberId: newMember.id, hasPaid: false }
        ]
      }));

      return {
        members: updatedMembers,
        tracking: updatedTracking
      };
    }),
  removeMember: (memberId) =>
    set((state) => {
      const updatedMembers = state.members.filter((m) => m.id !== memberId);
      
      // Üyeyi tüm ayların payment listesinden çıkar
      const updatedTracking = state.tracking.map((month) => ({
        ...month,
        payments: month.payments.filter((p) => p.memberId !== memberId),
        // Eğer silinen üye ev sahibi ise, ilk üyeyi ev sahibi yap
        hostId: month.hostId === memberId 
          ? (updatedMembers[0]?.id ?? month.hostId)
          : month.hostId
      }));

      return {
        members: updatedMembers,
        tracking: updatedTracking
      };
    }),
  setMembers: (members) => set({ members }),
  setTracking: (tracking) => set({ tracking }),
  redrawLots: () =>
    set((state) => {
      if (!state.members.length) {
        return {};
      }

      // Mevcut ödeme durumlarını koruyarak yeni kura çek
      const newTracking = createNewDraw(state.members, 12);
      
      // Mevcut ödeme durumlarını yeni tracking'e aktar
      const trackingWithPayments = newTracking.map((newMonth) => {
        const oldMonth = state.tracking.find(
          (m) => m.monthIndex === newMonth.monthIndex
        );
        
        if (oldMonth) {
          // Eski ödeme durumlarını koru, ancak yeni üyeleri ekle
          const existingPayments = oldMonth.payments.filter((p) =>
            state.members.some((m) => m.id === p.memberId)
          );
          const newMemberPayments = state.members
            .filter(
              (m) => !existingPayments.some((p) => p.memberId === m.id)
            )
            .map((m) => ({
              memberId: m.id,
              hasPaid: false
            }));

          return {
            ...newMonth,
            payments: [...existingPayments, ...newMemberPayments]
          };
        }

        return newMonth;
      });

      return {
        tracking: trackingWithPayments
      };
    })
}));


