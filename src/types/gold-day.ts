export type MemberId = string;

export interface Member {
  id: MemberId;
  name: string;
}

export interface MonthlyAssignment {
  monthIndex: number; // 0-11
  hostId: MemberId;
}

export interface PaymentStatus {
  memberId: MemberId;
  memberName: string;
  paid: boolean; // hasPaid yerine paid kullanıyoruz (database ile uyumlu)
}

export interface MonthTracking {
  id: string;
  month: number; // 1-12 (Ocak-Aralık)
  year: number;
  hostMemberId: MemberId;
  hostMemberName: string;
  preferredDeliveryDate?: string | null; // Ev sahibinin tercih ettiği teslimat tarihi (YYYY-MM-DD formatında)
  payments: PaymentStatus[];
}

export interface GoldPriceSnapshot {
  gram: number; // gram altın
  quarter: number; // çeyrek altın
  half: number; // yarım altın
  full: number; // tam altın
  updatedAt: string;
}


