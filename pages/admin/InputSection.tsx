import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { formatDate, formatCurrency, calculateWeeklyCuts } from '../../utils/format';
import Swal from 'sweetalert2';
import { Trash2, Save, Pencil, XCircle, CheckCircle, Clock } from 'lucide-react';

const InputSection: React.FC = () => {
  const { 
    stagedData, 
    publishedData, 
    addPreviousFund, updatePreviousFund, deletePreviousFund, 
    addWeeklyData, updateWeeklyData, deleteWeeklyData, 
    addDonor, updateDonor, deleteDonor, 
    addExpense, updateExpense, deleteExpense,
    // New Context Methods for Direct DB Manipulation
    updatePublishedItem, deletePublishedItem
  } = useData();
  
  const [activeTab, setActiveTab] = useState<'previous' | 'weekly' | 'donor' | 'expense'>('previous');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSource, setEditingSource] = useState<'staged' | 'published'>('staged');

  // Form States
  const [prevForm, setPrevForm] = useState({ date: '', nominal: '' });
  const [weekForm, setWeekForm] = useState({ date: '', week: 'Pilih Minggu', rt: 'Pilih RT', gross: '' });
  const [donorForm, setDonorForm] = useState({ date: '', name: '', nominal: '' });
  const [expForm, setExpForm] = useState({ date: '', purpose: '', nominal: '' });

  // TEMPAT GANTI KODE ID Server
  const AUTH_CODE = "ALISHLAH2026";

  // --- MERGE LIST FOR DISPLAY (HYBRID: STAGED + PUBLISHED) ---
  const allPreviousFunds = [
      ...stagedData.previousFunds.map(i => ({ ...i, source: 'staged' as const })),
      ...publishedData.previousFunds.map(i => ({ ...i, source: 'published' as const }))
  ];

  const allWeeklyData = [
      ...stagedData.weeklyData.map(i => ({ ...i, source: 'staged' as const })),
      ...publishedData.weeklyData.map(i => ({ ...i, source: 'published' as const }))
  ];

  const allDonors = [
      ...stagedData.donors.map(i => ({ ...i, source: 'staged' as const })),
      ...publishedData.donors.map(i => ({ ...i, source: 'published' as const }))
  ];

  const allExpenses = [
      ...stagedData.expenses.map(i => ({ ...i, source: 'staged' as const })),
      ...publishedData.expenses.map(i => ({ ...i, source: 'published' as const }))
  ];

  // Helper: Format tampilan saat mengetik
  const formatNumberInput = (value: string | number) => {
    if (!value) return '';
    const valString = value.toString();
    const rawValue = valString.replace(/\D/g, ''); 
    return new Intl.NumberFormat('id-ID').format(Number(rawValue));
  };

  const parseNumberInput = (value: string) => {
    if (!value) return 0;
    return Number(value.replace(/\./g, ''));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingSource('staged');
    setPrevForm({ date: '', nominal: '' });
    setWeekForm({ date: '', week: 'Minggu ke-1', rt: 'RT 01', gross: '' });
    setDonorForm({ date: '', name: '', nominal: '' });
    setExpForm({ date: '', purpose: '', nominal: '' });
  };

  const confirmAction = (title: string, text: string, callback: () => void) => {
    Swal.fire({
      title: title,
      text: text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#047857',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, Lanjutkan',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        callback();
      }
    });
  };

  // REVISI: confirmDelete dengan Input Password & Alert Terpisah (Sukses/Gagal)
  const confirmDelete = (id: string, source: 'staged' | 'published', type: 'previous' | 'weekly' | 'donor' | 'expense') => {
    Swal.fire({
      title: source === 'published' ? 'Hapus dari Database?' : 'Hapus Draft?',
      html: `
        <p class="mb-3 text-sm text-gray-600">${source === 'published' ? 'Data ini sudah dipublikasikan. Menghapusnya akan langsung hilang dari website publik.' : 'Data ini belum dipublikasikan.'}</p>
        <div class="text-left bg-red-50 p-2 rounded border border-red-100 text-red-800 text-xs font-bold mb-2 flex items-center gap-2">
             🔐 Masukkan Kode ID Server
        </div>
      `,
      icon: 'warning',
      input: 'password', // Input password untuk kode
      inputPlaceholder: 'Kode ID Server...',
      inputAttributes: {
        autocapitalize: 'off',
        autocorrect: 'off'
      },
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus Data',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
          // 1. Cek Kode ID Server
          if (result.value === AUTH_CODE) {
             // JIKA KODE BENAR -> EKSEKUSI HAPUS
             if (source === 'staged') {
                 // Local Deletion
                 if (type === 'previous') deletePreviousFund(id);
                 if (type === 'weekly') deleteWeeklyData(id);
                 if (type === 'donor') deleteDonor(id);
                 if (type === 'expense') deleteExpense(id);
                 Swal.fire('Terhapus!', 'Data draft berhasil dihapus.', 'success');
             } else {
                 // Direct DB Deletion
                 let table = '';
                 if (type === 'previous') table = 'DanaSebelumnya_data';
                 if (type === 'weekly') table = 'Mingguan_data'; 
                 if (type === 'donor') table = 'Donatur_data';
                 if (type === 'expense') table = 'Pengeluaran_data';
                 
                 if (table) {
                    const success = await deletePublishedItem(table, id);
                    if (success) Swal.fire('Terhapus!', 'Data database berhasil dihapus.', 'success');
                 }
             }
             if (editingId === id) cancelEdit(); 

          } else {
             // JIKA KODE SALAH
             Swal.fire({
                title: 'Kode ID Server Gagal!',
                text: 'Kode ID Server SALAH. Data tidak dihapus.',
                icon: 'error',
                confirmButtonColor: '#d33'
             });
          }
      }
    });
  };

  // --- HANDLERS ---

  // 1. PREVIOUS FUNDS (PANITIA)
  const handleSavePrev = () => {
    if (!prevForm.date || !prevForm.nominal) return;
    const nominal = parseNumberInput(prevForm.nominal);

    if (editingId) {
       confirmAction('Update Data?', editingSource === 'published' ? 'Update Database Langsung?' : 'Update Draft?', async () => {
         if (editingSource === 'published') {
             const success = await updatePublishedItem('DanaSebelumnya_data', editingId, { date: prevForm.date, nominal: nominal });
             if (success) { Swal.fire('Sukses', 'Database updated', 'success'); cancelEdit(); }
         } else {
             updatePreviousFund(editingId, { date: prevForm.date, nominal: nominal });
             cancelEdit();
             Swal.fire('Sukses', 'Draft updated', 'success');
         }
       });
    } else {
       confirmAction('Simpan Data?', 'Simpan ke Draft?', () => {
         addPreviousFund({ date: prevForm.date, nominal: nominal });
         setEditingId(null); 
         Swal.fire('Berhasil!', 'Data disimpan ke draft.', 'success');
       });
    }
  };

  const handleEditPrev = (data: any) => {
    setEditingId(data.id);
    setEditingSource(data.source || 'staged');
    setPrevForm({ date: data.date, nominal: formatNumberInput(data.nominal) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 2. WEEKLY DATA
  const handleSaveWeek = () => {
    if (!weekForm.date || !weekForm.gross) return;
    
    // Check Duplicate (Only for new entries or if editing draft to avoid double entry logic complexity)
    if (!editingId || (editingId && editingSource === 'staged')) {
        const isDuplicateStaged = stagedData.weeklyData.some(i => i.week === weekForm.week && i.rt === weekForm.rt && i.id !== editingId);
        const isDuplicatePublished = publishedData.weeklyData.some(i => i.week === weekForm.week && i.rt === weekForm.rt);

        if (isDuplicateStaged || isDuplicatePublished) {
            Swal.fire({ icon: 'warning', title: 'Data Duplikat', text: `${weekForm.week} - ${weekForm.rt} sudah ada.` });
            return;
        }
    }

    const gross = parseNumberInput(weekForm.gross);
    const { consumption, commission, net } = calculateWeeklyCuts(gross);
    // Local Payload
    const payload = { date: weekForm.date, week: weekForm.week, rt: weekForm.rt, grossAmount: gross, consumptionCut: consumption, commissionCut: commission, netAmount: net };

    if (editingId) {
        confirmAction('Update Data?', editingSource === 'published' ? 'Update Database Langsung?' : 'Update Draft?', async () => {
            if (editingSource === 'published') {
                // DB Payload (snake_case columns for Supabase)
                const dbPayload = {
                    date: weekForm.date,
                    week: weekForm.week,
                    rt: weekForm.rt,
                    gross_amount: gross,
                    consumption_cut: consumption,
                    commission_cut: commission,
                    net_amount: net
                };
                const success = await updatePublishedItem('Mingguan_data', editingId, dbPayload);
                if (success) { Swal.fire('Sukses', 'Database updated', 'success'); cancelEdit(); }
            } else {
                updateWeeklyData(editingId, payload);
                cancelEdit();
                Swal.fire('Berhasil!', 'Data diupdate.', 'success');
            }
        });
    } else {
        confirmAction('Simpan Data?', 'Simpan ke Draft?', () => {
            addWeeklyData(payload);
            setWeekForm(prev => ({ ...prev, rt: '', gross: '' }));
            setEditingId(null);
            Swal.fire('Berhasil!', 'Data disimpan.', 'success');
        });
    }
  };

  const handleEditWeek = (data: any) => {
    setEditingId(data.id);
    setEditingSource(data.source || 'staged');
    setWeekForm({ date: data.date, week: data.week, rt: data.rt, gross: formatNumberInput(data.grossAmount) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 3. DONOR DATA (Full UI)
  const handleSaveDonor = () => {
    if(!donorForm.name || !donorForm.nominal) return;
    const nominal = parseNumberInput(donorForm.nominal);

    if (editingId) {
        confirmAction('Update Data?', editingSource === 'published' ? 'Update Database Langsung?' : 'Update Draft?', async () => {
            if (editingSource === 'published') {
                const success = await updatePublishedItem('Donatur_data', editingId, { date: donorForm.date, name: donorForm.name, nominal: nominal });
                if (success) { Swal.fire('Sukses', 'Database updated', 'success'); cancelEdit(); }
            } else {
                updateDonor(editingId, { date: donorForm.date, name: donorForm.name, nominal: nominal });
                cancelEdit();
                Swal.fire('Sukses', 'Draft updated', 'success');
            }
        });
    } else {
        confirmAction('Simpan Data?', 'Simpan ke Draft?', () => {
            addDonor({ date: donorForm.date, name: donorForm.name, nominal: nominal });
            // Partial Reset: Keep Date, clear Name & Nominal
            setDonorForm(prev => ({ ...prev, name: '', nominal: '' }));
            setEditingId(null);
            Swal.fire('Berhasil', 'Data tersimpan', 'success');
        });
    }
  };

  const handleEditDonor = (data: any) => {
    setEditingId(data.id);
    setEditingSource(data.source || 'staged');
    setDonorForm({ date: data.date, name: data.name, nominal: formatNumberInput(data.nominal) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 4. EXPENSE DATA (Full UI)
  const handleSaveExp = () => {
    if(!expForm.purpose || !expForm.nominal) return;
    const nominal = parseNumberInput(expForm.nominal);

    if (editingId) {
        confirmAction('Update Data?', editingSource === 'published' ? 'Update Database Langsung?' : 'Update Draft?', async () => {
            if (editingSource === 'published') {
                const success = await updatePublishedItem('Pengeluaran_data', editingId, { date: expForm.date, purpose: expForm.purpose, nominal: nominal });
                if (success) { Swal.fire('Sukses', 'Database updated', 'success'); cancelEdit(); }
            } else {
                updateExpense(editingId, { date: expForm.date, purpose: expForm.purpose, nominal: nominal });
                cancelEdit();
                Swal.fire('Sukses', 'Draft updated', 'success');
            }
        });
    } else {
        confirmAction('Simpan Data?', 'Simpan ke Draft?', () => {
            addExpense({ date: expForm.date, purpose: expForm.purpose, nominal: nominal });
            // Partial Reset: Keep Date, clear Purpose & Nominal
            setExpForm(prev => ({ ...prev, purpose: '', nominal: '' }));
            setEditingId(null);
            Swal.fire('Berhasil', 'Data tersimpan', 'success');
        });
    }
  };

  const handleEditExp = (data: any) => {
    setEditingId(data.id);
    setEditingSource(data.source || 'staged');
    setExpForm({ date: data.date, purpose: data.purpose, nominal: formatNumberInput(data.nominal) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // UI HELPERS (OPTIMIZED FOR MOBILE)
  const tabClass = (tab: string) => 
    `flex-1 text-center md:flex-none px-1 py-1.5 md:px-4 md:py-3 rounded-t-lg font-bold text-[9px] md:text-sm transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-primary text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`;
  
  // GENERAL INPUT (Text/Select)
  const inputClass = "w-full bg-white border border-gray-300 text-gray-900 text-[10px] md:text-sm rounded-lg px-2 py-1.5 md:px-3 md:py-2 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-sm";
  
  // DATE INPUT (KHUSUS: Lebih Compact di Mobile)
  const dateClass = "w-full bg-white border border-gray-300 text-gray-900 text-[10px] md:text-sm rounded-lg px-2 py-0 md:px-3 md:py-2 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-sm h-[28px] md:h-auto leading-none appearance-none";

  const inputRpClass = "w-full bg-white border border-gray-300 text-gray-900 text-[10px] md:text-sm rounded-lg pl-6 md:pl-10 pr-2 py-1.5 md:px-3 md:py-2 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-sm font-mono tracking-wide";

  const renderStatusBadge = (source: string) => (
      source === 'published' ? 
      <span className="flex items-center gap-1 text-green-600 text-[9px] md:text-[10px] font-bold bg-green-50 px-1.5 py-0.5 rounded-full w-fit"><CheckCircle size={10}/> Publish</span> : 
      <span className="flex items-center gap-1 text-orange-600 text-[9px] md:text-[10px] font-bold bg-orange-50 px-1.5 py-0.5 rounded-full w-fit"><Clock size={10}/> Draft</span>
  );

  return (
    <div className="space-y-3 md:space-y-6">
      <h2 className="text-xs md:text-xl font-bold text-gray-800 border-b pb-1 md:pb-2">
          {editingId ? `Edit Data ${editingSource === 'published' ? '(Database)' : '(Draft)'}` : 'Input Data Keuangan'}
      </h2>
      
      {/* Tabs (Grid Layout on Mobile to prevent scroll) */}
      <div className={`flex w-full gap-0.5 md:gap-1 ${editingId ? 'opacity-50 pointer-events-none' : ''}`}>
        <button onClick={() => setActiveTab('previous')} className={tabClass('previous')}>Saldo Awal</button>
        <button onClick={() => setActiveTab('weekly')} className={tabClass('weekly')}>Mingguan</button>
        <button onClick={() => setActiveTab('donor')} className={tabClass('donor')}>Donatur</button>
        <button onClick={() => setActiveTab('expense')} className={tabClass('expense')}>Pengeluaran</button>
      </div>

      <div className="bg-white p-2 md:p-6 rounded-b-lg shadow-md border border-gray-200">
        
        {/* === 1. PREVIOUS FUNDS === */}
        {activeTab === 'previous' && (
          <div className="space-y-2 md:space-y-6">
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 bg-gray-50 p-2 md:p-3 rounded-lg border ${editingId ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
                <div className="w-full">
                    <label className="block text-[9px] md:text-[10px] text-gray-500 mb-0.5 md:mb-1 font-semibold">Tanggal</label>
                    <input type="date" value={prevForm.date} onChange={e => setPrevForm({...prevForm, date: e.target.value})} className={dateClass} style={{colorScheme: 'light'}} />
                </div>
                <div className="w-full">
                    <label className="block text-[9px] md:text-[10px] text-gray-500 mb-0.5 md:mb-1 font-semibold">Nominal</label>
                    <div className="relative">
                        <span className="absolute left-1.5 md:left-2 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold text-[10px] md:text-xs pointer-events-none">Rp.</span>
                        <input type="text" inputMode="numeric" placeholder="0" value={prevForm.nominal} onChange={e => setPrevForm({...prevForm, nominal: formatNumberInput(e.target.value)})} className={inputRpClass} />
                    </div>
                </div>
                <div className="flex items-end w-full">
                     <div className="flex gap-2 w-full">
                        {editingId && (
                            <button onClick={cancelEdit} className="w-1/3 bg-red-500 text-white py-1.5 md:py-2 rounded-lg font-bold text-[10px] md:text-xs flex items-center justify-center gap-1"><XCircle size={12} className="md:w-3.5 md:h-3.5"/> Batal</button>
                        )}
                        <button onClick={handleSavePrev} className="flex-1 bg-primary hover:bg-emerald-800 text-white py-1.5 md:py-2 rounded-lg font-bold text-[10px] md:text-xs flex items-center justify-center gap-2">
                            {editingId ? <Pencil size={12} className="md:w-3.5 md:h-3.5"/> : <Save size={12} className="md:w-3.5 md:h-3.5"/>} {editingId ? (editingSource === 'published' ? 'SIMPAN' : 'UPDATE DRAFT') : 'SIMPAN'}
                        </button>
                     </div>
                </div>
            </div>
            
            {/* Table Hybrid */}
            <div className="hidden md:block">
              <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 uppercase text-gray-700"><tr><th className="p-3">Status</th><th className="p-3">Tgl</th><th className="p-3">Nominal</th><th className="p-3">Aksi</th></tr></thead>
                  <tbody>
                      {allPreviousFunds.map((d: any) => (
                          <tr key={d.id} className={`border-b ${editingId === d.id ? 'bg-blue-50' : ''}`}>
                              <td className="p-3">{renderStatusBadge(d.source)}</td>
                              <td className="p-3">{formatDate(d.date)}</td>
                              <td className="p-3 font-bold">{formatCurrency(d.nominal)}</td>
                              <td className="p-3 flex gap-2">
                                  <button onClick={() => handleEditPrev(d)} className="text-blue-600 bg-blue-50 p-2 rounded-full"><Pencil size={14}/></button>
                                  <button onClick={() => confirmDelete(d.id, d.source, 'previous')} className="text-red-600 bg-red-50 p-2 rounded-full"><Trash2 size={14}/></button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
            </div>

             {/* Mobile Cards (Compact) */}
             <div className="md:hidden space-y-1.5">
               {allPreviousFunds.map((d: any) => (
                 <div key={d.id} className={`border p-1.5 rounded-lg shadow-sm flex justify-between items-center ${d.source === 'published' ? 'border-green-200 bg-white' : 'border-orange-200 bg-orange-50/30'}`}>
                    <div>
                        <div className="flex gap-2 items-center mb-0.5">{renderStatusBadge(d.source)}<span className="text-[9px] text-gray-500">{formatDate(d.date)}</span></div>
                        <p className="font-bold text-gray-800 text-xs">{formatCurrency(d.nominal)}</p>
                    </div>
                    <div className="flex gap-1.5">
                        <button onClick={() => handleEditPrev(d)} className="bg-blue-50 text-blue-600 p-1 rounded-lg"><Pencil size={12}/></button>
                        <button onClick={() => confirmDelete(d.id, d.source, 'previous')} className="bg-red-50 text-red-600 p-1 rounded-lg"><Trash2 size={12}/></button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* === 2. WEEKLY FORM (FULL UI & HYBRID) === */}
        {activeTab === 'weekly' && (
          <div className="space-y-2 md:space-y-6">
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 md:gap-3 bg-gray-50 p-2 md:p-3 rounded-lg border ${editingId ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
                <div className="col-span-1">
                    <label className="block text-[9px] md:text-[10px] text-gray-500 mb-0.5 md:mb-1 font-semibold">Tanggal</label>
                    <input type="date" value={weekForm.date} onChange={e => setWeekForm({...weekForm, date: e.target.value})} className={dateClass} style={{colorScheme: 'light'}} />
                </div>
                <div className="col-span-1">
                    <label className="block text-[9px] md:text-[10px] text-gray-500 mb-0.5 md:mb-1 font-semibold">Minggu Ke</label>
                    <select value={weekForm.week} onChange={e => setWeekForm({...weekForm, week: e.target.value})} className={inputClass}>
                      <option value="">Pilih Minggu</option>
                        {[...Array(30)].map((_, i) => <option key={i} value={`Minggu ke-${i+1}`}>Minggu ke-{i+1}</option>)}
                    </select>
                </div>
                <div className="col-span-1">
                    <label className="block text-[9px] md:text-[10px] text-gray-500 mb-0.5 md:mb-1 font-semibold">RT</label>
                    <select value={weekForm.rt} onChange={e => setWeekForm({...weekForm, rt: e.target.value})} className={inputClass}>
                        <option value="">Pilih RT</option>
                        {[...Array(6)].map((_, i) => <option key={i} value={`RT 0${i+1}`}>RT 0{i+1}</option>)}
                    </select>
                </div>
                <div className="col-span-1">
                    <label className="block text-[9px] md:text-[10px] text-gray-500 mb-0.5 md:mb-1 font-semibold">Pemasukan Kotor</label>
                    <div className="relative">
                        <span className="absolute left-1.5 md:left-2 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold text-[10px] md:text-xs pointer-events-none">Rp.</span>
                        <input type="text" inputMode="numeric" placeholder="0" value={weekForm.gross} onChange={e => setWeekForm({...weekForm, gross: formatNumberInput(e.target.value)})} className={inputRpClass} />
                    </div>
                </div>
                <div className="col-span-1 md:col-span-2 lg:col-span-1 flex items-end">
                    <div className="flex gap-2 w-full">
                        {editingId && (
                            <button onClick={cancelEdit} className="w-1/3 bg-red-500 text-white py-1.5 md:py-2 rounded-lg font-bold text-[10px] md:text-xs flex items-center justify-center gap-1"><XCircle size={12} className="md:w-3.5 md:h-3.5"/> Batal</button>
                        )}
                        <button onClick={handleSaveWeek} className="flex-1 bg-primary hover:bg-emerald-800 text-white py-1.5 md:py-2 rounded-lg font-bold text-[10px] md:text-xs flex items-center justify-center gap-2">
                            {editingId ? <Pencil size={12} className="md:w-3.5 md:h-3.5"/> : <Save size={12} className="md:w-3.5 md:h-3.5"/>} {editingId ? (editingSource === 'published' ? 'SIMPAN' : 'UPDATE DRAFT') : 'SIMPAN'}
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Desktop Hybrid Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 uppercase text-gray-700">
                        <tr><th className="p-3">Status</th><th className="p-3">Minggu/RT</th><th className="p-3">Pemasukan Kotor</th><th className="p-3 text-red-500">5%</th><th className="p-3 text-red-500">10%</th><th className="p-3 text-green-700">Pendapatan Bersih</th><th className="p-3">Aksi</th></tr>
                    </thead>
                    <tbody>
                        {allWeeklyData.map(d => (
                            <tr key={d.id} className={`border-b hover:bg-gray-50 ${editingId === d.id ? 'bg-blue-50' : ''}`}>
                                <td className="p-3">{renderStatusBadge(d.source)}</td>
                                <td className="p-3 font-medium">
                                    <div className="font-bold text-gray-800">{d.week}</div>
                                    <div className="text-xs text-gray-500">{d.rt}</div>
                                </td>
                                <td className="p-3">{formatCurrency(d.grossAmount)}</td>
                                <td className="p-3 text-red-500">-{formatCurrency(d.consumptionCut)}</td>
                                <td className="p-3 text-red-500">-{formatCurrency(d.commissionCut)}</td>
                                <td className="p-3 font-bold text-green-700">{formatCurrency(d.netAmount)}</td>
                                <td className="p-3 flex gap-2">
                                    <button onClick={() => handleEditWeek(d)} className="text-blue-600 bg-blue-50 p-2 rounded-full"><Pencil size={14}/></button>
                                    <button onClick={() => confirmDelete(d.id, d.source, 'weekly')} className="text-red-600 bg-red-50 p-2 rounded-full"><Trash2 size={14}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards Hybrid */}
            <div className="md:hidden space-y-1.5">
               {allWeeklyData.map(d => (
                 <div key={d.id} className={`border p-1.5 rounded-lg shadow-sm ${d.source === 'published' ? 'border-green-200 bg-white' : 'border-orange-200 bg-orange-50/30'}`}>
                    <div className="flex justify-between items-center mb-1 pb-1 border-b border-gray-100">
                        <div className="flex items-center gap-1.5">
                             {renderStatusBadge(d.source)}
                             <span className="font-bold text-gray-800 text-[9px]">{d.week}</span>
                             <span className="bg-emerald-50 text-emerald-700 text-[8px] px-1 py-0.5 rounded border border-emerald-100">{d.rt}</span>
                        </div>
                        <div className="flex gap-1.5">
                            <button onClick={() => handleEditWeek(d)} className="text-blue-600 bg-blue-50 p-1 rounded"><Pencil size={12}/></button>
                            <button onClick={() => confirmDelete(d.id, d.source, 'weekly')} className="text-red-600 bg-red-50 p-1 rounded"><Trash2 size={12}/></button>
                        </div>
                    </div>
                    <div className="text-[9px] space-y-0.5">
                        <div className="flex justify-between text-gray-600"><span>Pemasukan Kotor:</span><span className="font-medium">{formatCurrency(d.grossAmount)}</span></div>
                        
                        {/* Detail Potongan Di Kartu */}
                        <div className="flex justify-between text-red-500"><span>Potongan 5%:</span><span>-{formatCurrency(d.consumptionCut)}</span></div>
                        <div className="flex justify-between text-red-500"><span>Potongan 10%:</span><span>-{formatCurrency(d.commissionCut)}</span></div>

                        <div className="flex justify-between font-bold text-primary border-t pt-0.5 mt-0.5"><span>Bersih:</span><span className="text-[10px]">{formatCurrency(d.netAmount)}</span></div>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* === 3. DONOR FORM (FULL UI REVISED) === */}
        {activeTab === 'donor' && (
             <div className="space-y-2 md:space-y-6">
             <div className={`grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-3 bg-gray-50 p-2 md:p-3 rounded-lg border ${editingId ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
                 <div className="col-span-1">
                    <label className="block text-[9px] md:text-[10px] text-gray-500 mb-0.5 md:mb-1 font-semibold">Tanggal</label>
                    <input type="date" value={donorForm.date} onChange={e => setDonorForm({...donorForm, date: e.target.value})} className={dateClass} style={{colorScheme: 'light'}} />
                 </div>
                 <div className="col-span-1 md:col-span-2">
                    <label className="block text-[9px] md:text-[10px] text-gray-500 mb-0.5 md:mb-1 font-semibold">Sumber Dana</label>
                    <input type="text" placeholder="Nama Donatur / Sumber" value={donorForm.name} onChange={e => setDonorForm({...donorForm, name: e.target.value})} className={inputClass} />
                 </div>
                 <div className="col-span-1">
                    <label className="block text-[9px] md:text-[10px] text-gray-500 mb-0.5 md:mb-1 font-semibold">Nominal</label>
                    <div className="relative">
                        <span className="absolute left-1.5 md:left-2 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold text-[10px] md:text-xs pointer-events-none">Rp.</span>
                        <input type="text" inputMode="numeric" placeholder="0" value={donorForm.nominal} onChange={e => setDonorForm({...donorForm, nominal: formatNumberInput(e.target.value)})} className={inputRpClass} />
                    </div>
                 </div>

                 <div className="col-span-1 md:col-span-4 flex items-end">
                    <div className="flex gap-2 w-full">
                        {editingId && (
                            <button onClick={cancelEdit} className="w-1/3 bg-red-500 text-white py-1.5 md:py-2 rounded-lg font-bold text-[10px] md:text-xs flex items-center justify-center gap-1"><XCircle size={12} className="md:w-3.5 md:h-3.5"/> Batal</button>
                        )}
                        <button onClick={handleSaveDonor} className="flex-1 bg-primary hover:bg-emerald-800 text-white py-1.5 md:py-2 rounded-lg font-bold text-[10px] md:text-xs flex items-center justify-center gap-2">
                            {editingId ? <Pencil size={12} className="md:w-3.5 md:h-3.5"/> : <Save size={12} className="md:w-3.5 md:h-3.5"/>} {editingId ? (editingSource === 'published' ? 'SIMPAN' : 'UPDATE DRAFT') : 'SIMPAN'}
                        </button>
                     </div>
                 </div>
             </div>
 
             {/* Desktop Table Hybrid */}
             <div className="hidden md:block">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 uppercase text-gray-700"><tr><th className="p-3">Status</th><th className="p-3">Tgl</th><th className="p-3">Sumber Dana</th><th className="p-3">Nominal</th><th className="p-3">Aksi</th></tr></thead>
                    <tbody>
                        {allDonors.map((d: any) => (
                            <tr key={d.id} className={`border-b ${editingId === d.id ? 'bg-blue-50' : ''}`}>
                                <td className="p-3">{renderStatusBadge(d.source)}</td>
                                <td className="p-3">{formatDate(d.date)}</td>
                                <td className="p-3 font-semibold">{d.name}</td>
                                <td className="p-3 font-bold text-blue-700">{formatCurrency(d.nominal)}</td>
                                <td className="p-3 flex gap-2">
                                    <button onClick={() => handleEditDonor(d)} className="text-blue-600 bg-blue-50 p-2 rounded-full"><Pencil size={14}/></button>
                                    <button onClick={() => confirmDelete(d.id, d.source, 'donor')} className="text-red-600 bg-red-50 p-2 rounded-full"><Trash2 size={14}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>

             {/* Mobile Cards Hybrid (COMPACT & SMALLER FONT) */}
             <div className="md:hidden space-y-1.5">
               {allDonors.map((d: any) => (
                 <div key={d.id} className={`border p-1.5 rounded-lg shadow-sm ${d.source === 'published' ? 'border-green-200 bg-white' : 'border-orange-200 bg-orange-50/30'}`}>
                    <div className="flex justify-between items-start mb-0.5">
                        <div>
                             <div className="flex gap-2 items-center mb-0.5">{renderStatusBadge(d.source)}</div>
                             <h4 className="font-bold text-gray-800 text-[10px] leading-tight">{d.name}</h4>
                             <p className="text-[9px] text-gray-500">{formatDate(d.date)}</p>
                        </div>
                        <div className="flex gap-1.5">
                            <button onClick={() => handleEditDonor(d)} className="text-blue-600 bg-blue-50 p-1 rounded-lg"><Pencil size={12}/></button>
                            <button onClick={() => confirmDelete(d.id, d.source, 'donor')} className="text-red-600 bg-red-50 p-1 rounded-lg"><Trash2 size={12}/></button>
                        </div>
                    </div>
                    <div className="flex justify-end items-center mt-0.5 pt-0.5 border-t border-gray-100">
                         <span className="font-bold text-blue-600 text-[10px]">{formatCurrency(d.nominal)}</span>
                    </div>
                 </div>
               ))}
            </div>
           </div>
        )}

        {/* === 4. EXPENSE FORM (FULL UI REVISED) === */}
        {activeTab === 'expense' && (
             <div className="space-y-2 md:space-y-6">
             <div className={`grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-3 bg-gray-50 p-2 md:p-3 rounded-lg border ${editingId ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
                 <div className="col-span-1">
                    <label className="block text-[9px] md:text-[10px] text-gray-500 mb-0.5 md:mb-1 font-semibold">Tanggal</label>
                    <input type="date" value={expForm.date} onChange={e => setExpForm({...expForm, date: e.target.value})} className={dateClass} style={{colorScheme: 'light'}} />
                 </div>
                 <div className="col-span-1 md:col-span-2">
                    <label className="block text-[9px] md:text-[10px] text-gray-500 mb-0.5 md:mb-1 font-semibold">Keperluan</label>
                    <input type="text" placeholder="Keperluan Pengeluaran" value={expForm.purpose} onChange={e => setExpForm({...expForm, purpose: e.target.value})} className={inputClass} />
                 </div>
                 
                 <div className="col-span-1">
                    <label className="block text-[9px] md:text-[10px] text-gray-500 mb-0.5 md:mb-1 font-semibold">Nominal</label>
                    <div className="relative">
                        <span className="absolute left-1.5 md:left-2 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold text-[10px] md:text-xs pointer-events-none">Rp.</span>
                        <input type="text" inputMode="numeric" placeholder="0" value={expForm.nominal} onChange={e => setExpForm({...expForm, nominal: formatNumberInput(e.target.value)})} className={inputRpClass} />
                    </div>
                 </div>

                 <div className="col-span-1 md:col-span-4 flex items-end">
                    <div className="flex gap-2 w-full">
                        {editingId && (
                            <button onClick={cancelEdit} className="w-1/3 bg-red-500 text-white py-1.5 md:py-2 rounded-lg font-bold text-[10px] md:text-xs flex items-center justify-center gap-1"><XCircle size={12} className="md:w-3.5 md:h-3.5"/> Batal</button>
                        )}
                        <button onClick={handleSaveExp} className="flex-1 bg-primary hover:bg-emerald-800 text-white py-1.5 md:py-2 rounded-lg font-bold text-[10px] md:text-xs flex items-center justify-center gap-2">
                            {editingId ? <Pencil size={12} className="md:w-3.5 md:h-3.5"/> : <Save size={12} className="md:w-3.5 md:h-3.5"/>} {editingId ? (editingSource === 'published' ? 'SIMPAN' : 'UPDATE DRAFT') : 'SIMPAN'}
                        </button>
                     </div>
                 </div>
             </div>
 
             {/* Desktop Table Hybrid */}
             <div className="hidden md:block">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 uppercase text-gray-700"><tr><th className="p-3">Status</th><th className="p-3">Tgl</th><th className="p-3">Keperluan</th><th className="p-3">Nominal</th><th className="p-3">Aksi</th></tr></thead>
                    <tbody>
                        {allExpenses.map((d: any) => (
                            <tr key={d.id} className={`border-b ${editingId === d.id ? 'bg-blue-50' : ''}`}>
                                <td className="p-3">{renderStatusBadge(d.source)}</td>
                                <td className="p-3">{formatDate(d.date)}</td>
                                <td className="p-3">{d.purpose}</td>
                                <td className="p-3 font-bold text-red-600">{formatCurrency(d.nominal)}</td>
                                <td className="p-3 flex gap-2">
                                    <button onClick={() => handleEditExp(d)} className="text-blue-600 bg-blue-50 p-2 rounded-full"><Pencil size={14}/></button>
                                    <button onClick={() => confirmDelete(d.id, d.source, 'expense')} className="text-red-600 bg-red-50 p-2 rounded-full"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>

             {/* Mobile Cards Hybrid (COMPACT & SMALLER FONT) */}
             <div className="md:hidden space-y-1.5">
               {allExpenses.map((d: any) => (
                 <div key={d.id} className={`border border-gray-200 p-1.5 rounded-lg shadow-sm border-l-4 border-l-red-500 ${d.source === 'published' ? 'bg-white' : 'bg-orange-50/30'}`}>
                    <div className="flex justify-between items-start">
                        <div>
                             <div className="flex gap-2 items-center mb-0.5">{renderStatusBadge(d.source)}</div>
                             <h4 className="font-bold text-gray-800 text-[10px] leading-tight">{d.purpose}</h4>
                             <p className="text-[9px] text-gray-500 mt-0.5">{formatDate(d.date)}</p>
                        </div>
                        <div className="flex gap-1.5">
                            <button onClick={() => handleEditExp(d)} className="text-blue-600 bg-blue-50 p-1 rounded-lg ml-2"><Pencil size={12}/></button>
                            <button onClick={() => confirmDelete(d.id, d.source, 'expense')} className="text-red-600 bg-red-50 p-1 rounded-lg flex-shrink-0 ml-1"><Trash2 size={12}/></button>
                        </div>
                    </div>
                    <div className="text-right mt-0.5 font-bold text-red-600 text-[10px]">
                        {formatCurrency(d.nominal)}
                    </div>
                 </div>
               ))}
            </div>
           </div>
        )}

      </div>
    </div>
  );
};

export default InputSection;