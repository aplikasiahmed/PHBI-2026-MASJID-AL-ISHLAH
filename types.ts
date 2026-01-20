
export interface PreviousFund {
  id: string;
  date: string;
  nominal: number;
  createdBy?: string; // User yang membuat
  editedBy?: string;  // User yang terakhir mengedit
}

export interface WeeklyData {
  id: string;
  date: string;
  week: string;
  rt: string;
  grossAmount: number; // Pendapatan Kotor
  consumptionCut: number; // 5%
  commissionCut: number; // 10%
  netAmount: number; // Jumlah Bersih masuk kas
  createdBy?: string; // User yang membuat
  editedBy?: string;  // User yang terakhir mengedit
}

export interface DonorData {
  id: string;
  date: string;
  name: string;
  // source: string; // Dihapus
  nominal: number;
  createdBy?: string; // User yang membuat
  editedBy?: string;  // User yang terakhir mengedit
}

export interface ExpenseData {
  id: string;
  date: string;
  purpose: string; // Keperluan
  nominal: number;
  createdBy?: string; // User yang membuat
  editedBy?: string;  // User yang terakhir mengedit
}

export interface AppData {
  lastUpdated: string; // Tanggal update data real-time
  previousFunds: PreviousFund[];
  weeklyData: WeeklyData[];
  donors: DonorData[];
  expenses: ExpenseData[];
}

export type DataType = 'previous' | 'weekly' | 'donor' | 'expense';