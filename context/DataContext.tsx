import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppData, PreviousFund, WeeklyData, DonorData, ExpenseData } from '../types';
import Swal from 'sweetalert2';
import { supabase } from '../lib/supabaseClient';

interface DataContextType {
  publishedData: AppData;
  stagedData: AppData; // Admin working copy
  isLoggedIn: boolean;
  currentUser: string | null;
  login: (username: string) => void;
  logout: () => void;
  verifyUser: (username: string, password: string) => Promise<boolean>; 
  addAdminUser: (newUsername: string, newPassword: string, masterPass: string) => Promise<boolean>;
  getAdminUsers: () => Promise<any[]>;
  deleteAdminUser: (id: string, masterPass: string) => Promise<boolean>;
  
  // CRUD Actions (Effect Staged Data)
  addPreviousFund: (data: Omit<PreviousFund, 'id'>) => void;
  updatePreviousFund: (id: string, data: Partial<PreviousFund>) => void; 
  deletePreviousFund: (id: string) => void;
  
  addWeeklyData: (data: Omit<WeeklyData, 'id'>) => void;
  updateWeeklyData: (id: string, data: Partial<WeeklyData>) => void; 
  deleteWeeklyData: (id: string) => void;
  
  addDonor: (data: Omit<DonorData, 'id'>) => void;
  updateDonor: (id: string, data: Partial<DonorData>) => void; 
  deleteDonor: (id: string) => void;
  
  addExpense: (data: Omit<ExpenseData, 'id'>) => void;
  updateExpense: (id: string, data: Partial<ExpenseData>) => void; 
  deleteExpense: (id: string) => void;
  
  // DIRECT DB ACTIONS (Untuk Edit/Hapus data yang sudah terpublish)
  updatePublishedItem: (table: string, id: string, data: any) => Promise<boolean>;
  deletePublishedItem: (table: string, id: string) => Promise<boolean>;

  // System Actions
  publishData: (updateDate: string) => void;
  resetData: (type: 'all' | 'previous' | 'weekly' | 'donor' | 'expense') => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const initialData: AppData = {
  lastUpdated: new Date().toISOString(),
  previousFunds: [],
  weeklyData: [],
  donors: [],
  expenses: [],
};

// --- PASSWORD ADMIN PUSAT (KUNCI UTAMA) ---
const MASTER_ADMIN_PASSWORD = "ALISHLAH2026"; 
const SESSION_KEY = 'phbi_admin_session'; // Key untuk localStorage
const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 Menit Auto Logout

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [publishedData, setPublishedData] = useState<AppData>(initialData);
  const [stagedData, setStagedData] = useState<AppData>(initialData);
  
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const session = localStorage.getItem(SESSION_KEY);
    return !!session; 
  });

  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session).username : null;
  });

  const fetchSupabaseData = async (notifyError = false) => {
    if (!notifyError && !isLoggedIn) {
        Swal.fire({
            title: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ',
            text: 'Sedang proses ambil data base....',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
    }

    try {
      const { data: prevFunds, error: prevError } = await supabase.from('DanaSebelumnya_data').select('*');
      if (prevError) throw prevError;
      const mappedPrev = prevFunds?.map((item: any) => ({ ...item, createdBy: item.created_by, editedBy: item.edited_by })) || [];

      const { data: weekly, error: weeklyError } = await supabase.from('Mingguan_data').select('*');
      if (weeklyError) throw weeklyError;
      const mappedWeekly = weekly?.map((item: any) => ({
        id: item.id,
        date: item.date,
        week: item.week,
        rt: item.rt,
        grossAmount: item.gross_amount,
        consumptionCut: item.consumption_cut,
        commissionCut: item.commission_cut,
        netAmount: item.net_amount,
        createdBy: item.created_by,
        editedBy: item.edited_by
      })) || [];

      const { data: donors, error: donorError } = await supabase.from('Donatur_data').select('*');
      if (donorError) throw donorError;
      const mappedDonors = donors?.map((item: any) => ({ ...item, createdBy: item.created_by, editedBy: item.edited_by })) || [];

      const { data: expenses, error: expError } = await supabase.from('Pengeluaran_data').select('*');
      if (expError) throw expError;
      const mappedExpenses = expenses?.map((item: any) => ({ ...item, createdBy: item.created_by, editedBy: item.edited_by })) || [];

      const { data: meta } = await supabase.from('app_meta').select('*').limit(1).single();
      
      setPublishedData({
        lastUpdated: meta?.last_updated || new Date().toISOString(),
        previousFunds: mappedPrev,
        weeklyData: mappedWeekly,
        donors: mappedDonors,
        expenses: mappedExpenses
      });

      if (!notifyError) { Swal.close(); }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      if (notifyError || isLoggedIn) {
          Swal.fire({ icon: 'error', title: 'Gagal Mengambil Data', text: 'Terjadi kendala saat sinkronisasi data.' });
      } else { Swal.close(); }
    }
  };

  const login = (username: string) => {
    setIsLoggedIn(true);
    setCurrentUser(username);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ username }));
    setTimeout(() => fetchSupabaseData(true), 500);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  useEffect(() => {
    fetchSupabaseData(false);
    const storedStaged = localStorage.getItem('phbi_staged_data');
    if (storedStaged) setStagedData(JSON.parse(storedStaged));
  }, []);

  useEffect(() => {
    localStorage.setItem('phbi_staged_data', JSON.stringify(stagedData));
  }, [stagedData]);

  // LOGIKA AUTO-LOGOUT (IDLE TIMEOUT) YANG DIPERBAIKI
  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout>;

    const handleIdleLogout = () => {
      if (isLoggedIn) {
        logout();
        Swal.fire({ 
          icon: 'warning', 
          title: 'Sesi Berakhir', 
          text: 'Anda telah keluar otomatis', 
          timer: 2000, 
          timerProgressBar: true, 
          showConfirmButton: false, // Menghilangkan tombol konfirmasi
          allowOutsideClick: false 
        });
      }
    };

    const resetTimer = () => {
      if (!isLoggedIn) return;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(handleIdleLogout, IDLE_TIMEOUT_MS);
    };

    if (isLoggedIn) {
      // Mulai timer saat pertama kali login
      resetTimer();

      // Daftar event yang dianggap sebagai aktivitas
      const events = [
        'mousedown', 'mousemove', 'keypress', 
        'scroll', 'touchstart', 'click', 
        'keydown', 'wheel'
      ];

      // Tambahkan listener ke level document agar lebih menyeluruh
      events.forEach(event => {
        document.addEventListener(event, resetTimer, { passive: true });
      });

      // Bersihkan listener dan timer saat unmount atau logout
      return () => {
        if (idleTimer) clearTimeout(idleTimer);
        events.forEach(event => {
          document.removeEventListener(event, resetTimer);
        });
      };
    }
  }, [isLoggedIn]);

  const verifyUser = async (u: string, p: string): Promise<boolean> => {
    try {
        const { data, error } = await supabase.from('admin_users').select('id, username').eq('username', u).eq('password', p).limit(1);
        if (error) return false;
        return data && data.length > 0;
    } catch (err) { return false; }
  };

  const addAdminUser = async (newUsername: string, newPassword: string, masterPass: string): Promise<boolean> => {
      if (masterPass !== MASTER_ADMIN_PASSWORD) {
          Swal.fire('Kode ID Server Gagal', 'Kode ID Server tidak valid!', 'error');
          return false;
      }
      try {
          const { data: existing } = await supabase.from('admin_users').select('id').eq('username', newUsername).single();
          if (existing) { Swal.fire('Gagal', 'Username tersebut sudah digunakan.', 'warning'); return false; }
          const { error } = await supabase.from('admin_users').insert({ username: newUsername, password: newPassword });
          if (error) throw error;
          return true;
      } catch (error: any) { Swal.fire('Error', error.message, 'error'); return false; }
  };

  const getAdminUsers = async () => {
      const { data, error } = await supabase.from('admin_users').select('id, username, created_at').order('created_at', { ascending: false });
      if (error) return [];
      return data || [];
  };

  const deleteAdminUser = async (id: string, masterPass: string): Promise<boolean> => {
      if (masterPass !== MASTER_ADMIN_PASSWORD) {
          Swal.fire('Kode ID Server Gagal', 'Kode ID Server tidak valid!', 'error');
          return false;
      }
      const { error } = await supabase.from('admin_users').delete().eq('id', id);
      if (error) { Swal.fire('Error', error.message, 'error'); return false; }
      return true;
  };

  // --- REVISED CRUD: editedBy set to null on creation ---
  const addPreviousFund = (item: Omit<PreviousFund, 'id'>) => {
    const newItem = { 
        ...item, 
        id: crypto.randomUUID(),
        createdBy: currentUser || 'Admin', 
        editedBy: undefined // Kosong saat baru
    };
    setStagedData(prev => ({ ...prev, previousFunds: [...prev.previousFunds, newItem] }));
  };
  
  const updatePreviousFund = (id: string, data: Partial<PreviousFund>) => {
    setStagedData(prev => ({
        ...prev,
        previousFunds: prev.previousFunds.map(item => 
          item.id === id ? { ...item, ...data, editedBy: currentUser || 'Admin' } : item
        )
    }));
  };
  
  const deletePreviousFund = (id: string) => {
    setStagedData(prev => ({ ...prev, previousFunds: prev.previousFunds.filter(i => i.id !== id) }));
  };

  const addWeeklyData = (item: Omit<WeeklyData, 'id'>) => {
    const newItem = { 
        ...item, 
        id: crypto.randomUUID(),
        createdBy: currentUser || 'Admin',
        editedBy: undefined // Kosong saat baru
    };
    setStagedData(prev => ({ ...prev, weeklyData: [...prev.weeklyData, newItem] }));
  };
  
  const updateWeeklyData = (id: string, data: Partial<WeeklyData>) => {
    setStagedData(prev => ({
        ...prev,
        weeklyData: prev.weeklyData.map(item => 
          item.id === id ? { ...item, ...data, editedBy: currentUser || 'Admin' } : item
        )
    }));
  };
  
  const deleteWeeklyData = (id: string) => {
    setStagedData(prev => ({ ...prev, weeklyData: prev.weeklyData.filter(i => i.id !== id) }));
  };

  const addDonor = (item: Omit<DonorData, 'id'>) => {
    const newItem = { 
        ...item, 
        id: crypto.randomUUID(),
        createdBy: currentUser || 'Admin',
        editedBy: undefined // Kosong saat baru
    };
    setStagedData(prev => ({ ...prev, donors: [...prev.donors, newItem] }));
  };
  
  const updateDonor = (id: string, data: Partial<DonorData>) => {
    setStagedData(prev => ({
        ...prev,
        donors: prev.donors.map(item => 
          item.id === id ? { ...item, ...data, editedBy: currentUser || 'Admin' } : item
        )
    }));
  };
  
  const deleteDonor = (id: string) => {
    setStagedData(prev => ({ ...prev, donors: prev.donors.filter(i => i.id !== id) }));
  };

  const addExpense = (item: Omit<ExpenseData, 'id'>) => {
    const newItem = { 
        ...item, 
        id: crypto.randomUUID(),
        createdBy: currentUser || 'Admin',
        editedBy: undefined // Kosong saat baru
    };
    setStagedData(prev => ({ ...prev, expenses: [...prev.expenses, newItem] }));
  };
  
  const updateExpense = (id: string, data: Partial<ExpenseData>) => {
    setStagedData(prev => ({
        ...prev,
        expenses: prev.expenses.map(item => 
          item.id === id ? { ...item, ...data, editedBy: currentUser || 'Admin' } : item
        )
    }));
  };
  
  const deleteExpense = (id: string) => {
    setStagedData(prev => ({ ...prev, expenses: prev.expenses.filter(i => i.id !== id) }));
  };

  const updatePublishedItem = async (table: string, id: string, data: any): Promise<boolean> => {
      try {
          const payload = { ...data, edited_by: currentUser || 'Admin' };
          const { error } = await supabase.from(table).update(payload).eq('id', id);
          if(error) throw error;
          await fetchSupabaseData(false);
          return true;
      } catch (error: any) {
          Swal.fire('Gagal Update', error?.message || 'Terjadi kesalahan pada database', 'error');
          return false;
      }
  };

  const deletePublishedItem = async (table: string, id: string): Promise<boolean> => {
      try {
          const { error } = await supabase.from(table).delete().eq('id', id);
          if(error) throw error;
          await fetchSupabaseData(false);
          return true;
      } catch (error: any) {
          Swal.fire('Gagal Hapus', error?.message || 'Terjadi kesalahan saat menghapus', 'error');
          return false;
      }
  };

  const publishData = async (updateDate: string) => {
    Swal.fire({ title: 'Memproses Data...', text: 'Mohon tunggu sebentar', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
    try {
      // Logic: mapping createdBy to created_by and editedBy to edited_by
      if (stagedData.previousFunds.length > 0) {
        const payload = stagedData.previousFunds.map(({ id, createdBy, editedBy, ...rest }) => ({
            ...rest,
            created_by: createdBy,
            edited_by: editedBy || null // Send null if never edited
        }));
        const { error } = await supabase.from('DanaSebelumnya_data').insert(payload);
        if (error) throw error;
      }

      if (stagedData.weeklyData.length > 0) {
        const weeklyPayload = stagedData.weeklyData.map(item => ({
          date: item.date,
          week: item.week,
          rt: item.rt,
          gross_amount: item.grossAmount,
          // Fixed property names to match WeeklyData interface (consumptionCut and commissionCut)
          consumption_cut: item.consumptionCut,
          commission_cut: item.commissionCut,
          net_amount: item.netAmount,
          created_by: item.createdBy,
          edited_by: item.editedBy || null
        }));
        const { error = null } = await supabase.from('Mingguan_data').insert(weeklyPayload);
        if (error) throw error;
      }

      if (stagedData.donors.length > 0) {
        const payload = stagedData.donors.map(({ id, createdBy, editedBy, ...rest }) => ({
            ...rest,
            created_by: createdBy,
            edited_by: editedBy || null
        }));
        const { error } = await supabase.from('Donatur_data').insert(payload);
        if (error) throw error;
      }

      if (stagedData.expenses.length > 0) {
        const payload = stagedData.expenses.map(({ id, createdBy, editedBy, ...rest }) => ({
            ...rest,
            created_by: createdBy,
            edited_by: editedBy || null
        }));
        const { error } = await supabase.from('Pengeluaran_data').insert(payload);
        if (error) throw error;
      }

      const { error: metaError } = await supabase.from('app_meta').update({ last_updated: updateDate }).gt('id', 0); 
      if (metaError) { await supabase.from('app_meta').insert({ last_updated: updateDate }); }

      setStagedData(initialData);
      await fetchSupabaseData(true);
      Swal.fire({ icon: 'success', title: 'Publikasi Berhasil', text: 'Laporan Keuangan telah berhasil diperbarui.', confirmButtonColor: '#047857' });
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Gagal Memproses', text: error?.message || 'Terjadi kesalahan koneksi.' });
    }
  };

  const resetData = async (type: 'all' | 'previous' | 'weekly' | 'donor' | 'expense') => {
    if (type === 'all') { setStagedData(initialData); } else {
      const keyMap: Record<string, keyof AppData> = { 'previous': 'previousFunds', 'weekly': 'weeklyData', 'donor': 'donors', 'expense': 'expenses' };
      const key = keyMap[type];
      // @ts-ignore
      setStagedData(prev => ({ ...prev, [key]: [] }));
    }
    Swal.fire({ title: 'Proses Mereset Database', text:'Mohon Tunggu Sebentar....', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
    try {
        if (type === 'all') {
            await supabase.from('DanaSebelumnya_data').delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
            await supabase.from('Mingguan_data').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('Donatur_data').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('Pengeluaran_data').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        } else {
            const tableMap: Record<string, string> = { 'previous': 'DanaSebelumnya_data', 'weekly': 'Mingguan_data', 'donor': 'Donatur_data', 'expense': 'Pengeluaran_data' };
            const tableName = tableMap[type];
            if (tableName) {
                const { error } = await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
                if (error) throw error;
            }
        }
        await fetchSupabaseData(true); 
        Swal.fire('Berhasil', 'Database telah direset.', 'success');
    } catch (error: any) { Swal.fire('Error', 'Gagal mereset database: ' + (error?.message || 'Error'), 'error'); }
  };

  return (
    <DataContext.Provider value={{
      publishedData, stagedData, isLoggedIn, currentUser, login, logout, verifyUser, addAdminUser, getAdminUsers, deleteAdminUser,
      addPreviousFund, updatePreviousFund, deletePreviousFund, addWeeklyData, updateWeeklyData, deleteWeeklyData,
      addDonor, updateDonor, deleteDonor, addExpense, updateExpense, deleteExpense,
      updatePublishedItem, deletePublishedItem, publishData, resetData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) { throw new Error('useData must be used within a DataProvider'); }
  return context;
};
