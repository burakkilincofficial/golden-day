import { create } from "zustand";
import type { Member, MemberId, MonthTracking } from "@/types/gold-day";
import { createNewDraw } from "@/lib/mock-data";

interface GoldDayState {
  members: Member[];
  tracking: MonthTracking[];
  togglePayment: (month: number, memberId: MemberId) => void; // month: 1-12
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
  togglePayment: (month, memberId) =>
    set((state) => ({
      tracking: state.tracking.map((tracking) => {
        if (tracking.month !== month) return tracking;
        return {
          ...tracking,
          payments: tracking.payments.map((p) =>
            p.memberId === memberId
              ? { ...p, paid: !p.paid }
              : p
          )
        };
      })
    })),
  resetPayments: () =>
    set((state) => ({
      tracking: state.tracking.map((tracking) => ({
        ...tracking,
        payments: tracking.payments.map((p) => ({
          ...p,
          paid: false
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
      const updatedTracking = state.tracking.map((tracking) => ({
        ...tracking,
        payments: [
          ...tracking.payments,
          { memberId: newMember.id, memberName: newMember.name, paid: false }
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
      const updatedTracking = state.tracking.map((tracking) => ({
        ...tracking,
        payments: tracking.payments.filter((p) => p.memberId !== memberId),
        // Eğer silinen üye ev sahibi ise, ilk üyeyi ev sahibi yap
        hostMemberId: tracking.hostMemberId === memberId 
          ? (updatedMembers[0]?.id ?? tracking.hostMemberId)
          : tracking.hostMemberId,
        hostMemberName: tracking.hostMemberId === memberId
          ? (updatedMembers[0]?.name ?? tracking.hostMemberName)
          : tracking.hostMemberName
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
          (m) => m.month === newMonth.month && m.year === newMonth.year
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
              memberName: m.name,
              paid: false
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


