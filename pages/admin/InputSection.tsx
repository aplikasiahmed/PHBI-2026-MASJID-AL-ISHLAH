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

  // Helper Sort Date Ascending (Terlama ke Terbaru)
  const sortByDateAsc = (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime();

  // --- MERGE LIST FOR DISPLAY (HYBRID: STAGED + PUBLISHED) & SORTING ---
  const allPreviousFunds = [
      ...stagedData.previousFunds.map(i => ({ ...i, source: 'staged' as const })),
      ...publishedData.previousFunds.map(i => ({ ...i, source: 'published' as const }))
  ].sort(sortByDateAsc);

  const allWeeklyData = [
      ...stagedData.weeklyData.map(i => ({ ...i, source: 'staged' as const })),
      ...publishedData.weeklyData.map(i => ({ ...i, source: 'published' as const }))
  ].sort(sortByDateAsc);

  const allDonors = [
      ...stagedData.donors.map(i => ({ ...i, source: 'staged' as const })),
      ...publishedData.donors.map(i => ({ ...i, source: 'published' as const }))
  ].sort(sortByDateAsc);

  const allExpenses = [
      ...stagedData.expenses.map(i => ({ ...i, source: 'staged' as const })),
      ...publishedData.expenses.map(i => ({ ...i, source: 'published' as const }))
  ].sort(sortByDateAsc);

  // Helper: Format tampilan saat mengetik
  const formatNumberInput = (value: string | number) => {
    if (!value) return '';
    const valString = value.toString();
    const rawValue = valString.replace(/\D/g, ''); 
    return new Intl.NumberFormat('id-ID').format(Number(rawValue));
  };
  
  // Helper: Format Tanggal Pendek (00/00/0000)
  const formatDateShort = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const parseNumberInput = (value: string) => {
    if (!value) return 0;
    return Number(value.replace(/\./g, ''));
  };

  // --- CALCULATE REALTIME CUTS FOR FORM DISPLAY (READONLY FEATURE) ---
  const currentGross = parseNumberInput(weekForm.gross);
  const { consumption: calcCons, commission: calcComm, net: calcNet } = calculateWeeklyCuts(currentGross);

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
      cancelButtonColor: '#ff0000',
      confirmButtonText: 'Ya, Lanjutkan',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        callback();
      }
    });
  };

  // REVISI: confirmDelete dengan Logika Otoritasi
  const confirmDelete = (id: string, source: 'staged' | 'published', type: 'previous' | 'weekly' | 'donor' | 'expense') => {
    if (source === 'staged') {
        Swal.fire({
            title: 'Hapus Draft?',
            text: 'Data draft ini akan dihapus permanen. Lanjutkan?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6', 
            cancelButtonColor: '#ff0000',
            confirmButtonText: 'Ya, Hapus Draft',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                if (type === 'previous') deletePreviousFund(id);
                if (type === 'weekly') deleteWeeklyData(id);
                if (type === 'donor') deleteDonor(id);
                if (type === 'expense') deleteExpense(id);
                
                Swal.fire({
                    icon: 'success', 
                    title: 'Terhapus!', 
                    text: 'Data draft berhasil dihapus.', 
                    timer: 1500,
                    showConfirmButton: false
                });
                if (editingId === id) cancelEdit();
            }
        });
    } else {
        Swal.fire({
            title: 'Hapus dari Database?',
            html: `
                <p class="mb-3 text-sm text-gray-600">Data ini sudah dipublikasikan. Menghapusnya akan langsung hilang dari website publik.</p>
                <div class="text-left bg-red-50 p-2 rounded border border-red-100 text-red-800 text-xs font-bold mb-2 flex items-center gap-2">
                     🔐 Masukkan Kode ID Server
                </div>
            `,
            icon: 'warning',
            input: 'password',
            inputPlaceholder: 'Kode ID Server...',
            inputAttributes: { autocapitalize: 'off', autocorrect: 'off' },
            showCancelButton: true,
            confirmButtonColor: '#3085d6', 
            cancelButtonColor: '#ff0000',
            confirmButtonText: 'Ya, Hapus Data',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                if (result.value === AUTH_CODE) {
                    let table = '';
                    if (type === 'previous') table = 'DanaSebelumnya_data';
                    if (type === 'weekly') table = 'Mingguan_data'; 
                    if (type === 'donor') table = 'Donatur_data';
                    if (type === 'expense') table = 'Pengeluaran_data';
                    
                    if (table) {
                        const success = await deletePublishedItem(table, id);
                        if (success) Swal.fire('Terhapus!', 'Data berhasil dihapus dari database.', 'success');
                    }
                    if (editingId === id) cancelEdit(); 
                } else {
                    Swal.fire({
                        title: 'Kode ID Server Gagal!',
                        text: 'Kode ID Server SALAH. Data gagal dihapus.',
                        icon: 'error',
                        confirmButtonColor: '#d33'
                    });
                }
            }
        });
    }
  };

  const confirmUpdatePublished = (callback: () => Promise<void>) => {
      Swal.fire({
          title: 'Update Database?',
          html: `
            <p class="mb-3 text-sm text-gray-600">Yakin data akan di rubah ? Perubahan akan langsung terlihat publik.</p>
            <div class="text-left bg-orange-50 p-2 rounded border border-orange-100 text-orange-800 text-xs font-bold mb-2 flex items-center gap-2">
                 🔐 Masukkan Kode ID Server
            </div>
          `,
          icon: 'warning',
          input: 'password',
          inputPlaceholder: 'Kode ID Server...',
          showCancelButton: true,
          confirmButtonColor: '#047857',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Ya, Update Data',
          cancelButtonText: 'Batal'
      }).then((result) => {
          if (result.isConfirmed) {
              if (result.value === AUTH_CODE) {
                  callback();
              } else {
                  Swal.fire('Gagal', 'Kode ID Server SALAH.', 'error');
              }
          }
      });
  };

  // --- HANDLERS ---
  const handleSavePrev = () => {
    if (!prevForm.date || !prevForm.nominal) { Swal.fire({ icon: 'warning', title: 'Opss...', text: 'Mohon isi kolom yang kosong !.', confirmButtonColor: '#ff0000' }); return; }
    const nominal = parseNumberInput(prevForm.nominal);
    if (editingId) {
       if (editingSource === 'published') {
           confirmUpdatePublished(async () => { const success = await updatePublishedItem('DanaSebelumnya_data', editingId, { date: prevForm.date, nominal: nominal }); if (success) { Swal.fire('Sukses', 'Data di database berhasil diupdate', 'success'); cancelEdit(); } });
       } else {
           confirmAction('Simpan Perubahan Draft?', 'Data draft akan diperbarui.', () => { updatePreviousFund(editingId, { date: prevForm.date, nominal: nominal }); cancelEdit(); Swal.fire('Sukses', 'Draft diupdate', 'success'); });
       }
    } else {
       confirmAction('Simpan Data?', 'Simpan ke Draft?', () => { addPreviousFund({ date: prevForm.date, nominal: nominal }); setEditingId(null); Swal.fire('Berhasil!', 'Data disimpan ke draft.', 'success'); });
    }
  };

  const handleEditPrev = (data: any) => {
    setEditingId(data.id); setEditingSource(data.source || 'staged'); setPrevForm({ date: data.date, nominal: formatNumberInput(data.nominal) }); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveWeek = () => {
    if (!weekForm.date || !weekForm.gross || weekForm.week === 'Pilih Minggu' || weekForm.rt === 'Pilih RT') { Swal.fire({ icon: 'warning', title: 'Opss...', text: 'Mohon isi kolom yang kosong ! ', confirmButtonColor: '#ff0000' }); return; }
    if (!editingId || (editingId && editingSource === 'staged')) {
        const isDuplicateStaged = stagedData.weeklyData.some(i => i.week === weekForm.week && i.rt === weekForm.rt && i.id !== editingId);
        const isDuplicatePublished = publishedData.weeklyData.some(i => i.week === weekForm.week && i.rt === weekForm.rt);
        if (isDuplicateStaged || isDuplicatePublished) { Swal.fire({ icon: 'warning', title: 'Data Duplikat', text: `${weekForm.week} - ${weekForm.rt} sudah di Input.` }); return; }
    }
    const gross = parseNumberInput(weekForm.gross); const { consumption, commission, net } = calculateWeeklyCuts(gross);
    if (editingId) {
        if (editingSource === 'published') {
            confirmUpdatePublished(async () => { const dbPayload = { date: weekForm.date, week: weekForm.week, rt: weekForm.rt, gross_amount: gross, consumption_cut: consumption, commission_cut: commission, net_amount: net }; const success = await updatePublishedItem('Mingguan_data', editingId, dbPayload); if (success) { Swal.fire('Sukses', 'Data di database berhasil diupdate', 'success'); cancelEdit(); } });
        } else {
            confirmAction('Simpan Perubahan Draft?', 'Data draft akan diperbarui.', () => { const payload = { date: weekForm.date, week: weekForm.week, rt: weekForm.rt, grossAmount: gross, consumptionCut: consumption, commissionCut: commission, netAmount: net }; updateWeeklyData(editingId, payload); cancelEdit(); Swal.fire('Berhasil!', 'Draft diupdate.', 'success'); });
        }
    } else {
        confirmAction('Simpan Data?', 'Simpan ke Draft?', () => { const payload = { date: weekForm.date, week: weekForm.week, rt: weekForm.rt, grossAmount: gross, consumptionCut: consumption, commissionCut: commission, netAmount: net }; addWeeklyData(payload); setWeekForm(prev => ({ ...prev, rt: '', gross: '' })); setEditingId(null); Swal.fire('Berhasil!', 'Data disimpan.', 'success'); });
    }
  };

  const handleEditWeek = (data: any) => {
    setEditingId(data.id); setEditingSource(data.source || 'staged'); setWeekForm({ date: data.date, week: data.week, rt: data.rt, gross: formatNumberInput(data.grossAmount) }); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveDonor = () => {
    if(!donorForm.date || !donorForm.name || !donorForm.nominal) { Swal.fire({ icon: 'warning', title: 'Opss...', text: 'Mohon lengkapi kolom yang kosong', confirmButtonColor: '#d4af37' }); return; }
    const nominal = parseNumberInput(donorForm.nominal);
    if (editingId) {
        if (editingSource === 'published') {
            confirmUpdatePublished(async () => { const success = await updatePublishedItem('Donatur_data', editingId, { date: donorForm.date, name: donorForm.name, nominal: nominal }); if (success) { Swal.fire('Sukses', 'Data di database berhasil diupdate', 'success'); cancelEdit(); } });
        } else {
            confirmAction('Simpan Perubahan Draft?', 'Data draft akan diperbarui.', () => { updateDonor(editingId, { date: donorForm.date, name: donorForm.name, nominal: nominal }); cancelEdit(); Swal.fire('Sukses', 'Draft diupdate', 'success'); });
        }
    } else {
        confirmAction('Simpan Data?', 'Simpan ke Draft?', () => { addDonor({ date: donorForm.date, name: donorForm.name, nominal: nominal }); setDonorForm(prev => ({ ...prev, name: '', nominal: '' })); setEditingId(null); Swal.fire('Berhasil', 'Data tersimpan', 'success'); });
    }
  };

  const handleEditDonor = (data: any) => {
    setEditingId(data.id); setEditingSource(data.source || 'staged'); setDonorForm({ date: data.date, name: data.name, nominal: formatNumberInput(data.nominal) }); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveExp = () => {
    if(!expForm.date || !expForm.purpose || !expForm.nominal) { Swal.fire({ icon: 'warning', title: 'Opss...', text: 'Mohon lengkapi data yang kosong !.', confirmButtonColor: '#ff0000' }); return; }
    const nominal = parseNumberInput(expForm.nominal);
    if (editingId) {
        if (editingSource === 'published') {
            confirmUpdatePublished(async () => { const success = await updatePublishedItem('Pengeluaran_data', editingId, { date: expForm.date, purpose: expForm.purpose, nominal: nominal }); if (success) { Swal.fire('Sukses', 'Data di database berhasil diupdate', 'success'); cancelEdit(); } });
        } else {
            confirmAction('Simpan Perubahan Draft?', 'Data draft akan diperbarui.', () => { updateExpense(editingId, { date: expForm.date, purpose: expForm.purpose, nominal: nominal }); cancelEdit(); Swal.fire('Sukses', 'Draft diupdate', 'success'); });
        }
    } else {
        confirmAction('Simpan Data?', 'Simpan ke Draft?', () => { addExpense({ date: expForm.date, purpose: expForm.purpose, nominal: nominal }); setExpForm(prev => ({ ...prev, purpose: '', nominal: '' })); setEditingId(null); Swal.fire('Berhasil', 'Data tersimpan', 'success'); });
    }
  };

  const handleEditExp = (data: any) => {
    setEditingId(data.id); setEditingSource(data.source || 'staged'); setExpForm({ date: data.date, purpose: data.purpose, nominal: formatNumberInput(data.nominal) }); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tabClass = (tab: string) => 
    `flex-1 text-center md:flex-none px-1 py-1.5 md:px-4 md:py-3 rounded-t-lg font-bold text-[9px] md:text-sm transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-primary text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`;
  
  const inputClass = "w-full bg-white border border-gray-300 text-gray-900 text-[10px] md:text-sm rounded-lg px-2 py-1.5 md:px-3 md:py-2 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-sm";
  const dateClass = "w-full bg-white border border-gray-300 text-gray-900 text-[10px] md:text-sm rounded-lg px-2 py-0 md:px-3 md:py-2 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-sm h-[28px] md:h-auto leading-none appearance-none";
  const inputRpClass = "w-full bg-white border border-gray-300 text-gray-900 text-[10px] md:text-sm rounded-lg pl-6 md:pl-10 pr-2 py-1.5 md:px-3 md:py-2 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-sm font-mono tracking-wide";
  
  // New Class for Readonly Inputs
  const inputReadonlyClass = "w-full border border-gray-200 text-gray-700 text-[10px] md:text-sm rounded-lg px-2 py-1.5 md:px-3 md:py-2 font-mono tracking-wide cursor-not-allowed focus:outline-none shadow-sm";

  const renderStatusBadge = (source: string) => (
      source === 'published' ? 
      <span className="flex items-center gap-1 text-green-600 text-[8px] md:text-[10px] font-bold bg-green-50 px-1.5 py-0.5 rounded-full w-fit"><CheckCircle size={10}/> Publish</span> : 
      <span className="flex items-center gap-1 text-orange-600 text-[8px] md:text-[10px] font-bold bg-orange-50 px-1.5 py-0.5 rounded-full w-fit"><Clock size={10}/> Draft</span>
  );

  // --- REVISED: SIMPLE BUTTONS WITHOUT ANIMATION OR FANCY TOOLTIPS ---
  // layout: 'row' (horizontal) | 'col' (vertical)
  const getActionButtons = (item: any, type: any, layout: 'row' | 'col' = 'col') => (
      <div className={`flex ${layout === 'col' ? 'flex-col gap-0.5 md:gap-1' : 'flex-row gap-2'} justify-center items-center w-full`}>
          {/* EDIT BUTTON */}
          <button 
            onClick={() => type === 'previous' ? handleEditPrev(item) : type === 'weekly' ? handleEditWeek(item) : type === 'donor' ? handleEditDonor(item) : handleEditExp(item)}
            className="flex items-center justify-center text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white p-1 md:p-1.5 rounded-full transition-all duration-200 border border-blue-100 hover:border-blue-600"
            title="Edit"
          >
            <Pencil size={12} className="md:w-3.5 md:h-3.5" />
          </button>

          {/* DELETE BUTTON */}
          <button 
            onClick={() => confirmDelete(item.id, item.source, type)} 
            className="flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-600 hover:text-white p-1 md:p-1.5 rounded-full transition-all duration-200 border border-red-100 hover:border-red-600"
            title="Hapus"
          >
            <Trash2 size={12} className="md:w-3.5 md:h-3.5" />
          </button>
      </div>
  );

  return (
    <div className="space-y-3 md:space-y-6">
      <h2 className="text-xs md:text-xl font-bold text-gray-800 border-b pb-1 md:pb-2">
          {editingId ? `Edit Data ${editingSource === 'published' ? '(Database)' : '(Draft)'}` : 'Input Data Keuangan'}
      </h2>
      
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
                            {editingId ? <Pencil size={12} className="md:w-3.5 md:h-3.5"/> : <Save size={12} className="md:w-3.5 md:h-3.5"/>} {editingId ? (editingSource === 'published' ? 'SIMPAN PERUBAHAN' : 'SIMPAN PERUBAHAN') : 'SIMPAN'}
                        </button>
                     </div>
                </div>
            </div>
            
            {/* Table Hybrid - Desktop */}
            <div className="hidden md:block">
              <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 uppercase text-gray-700"><tr><th className="p-3">Status</th><th className="p-3">Tgl</th><th className="p-3">Nominal</th><th className="p-3">Aksi</th></tr></thead>
                  <tbody>
                      {allPreviousFunds.map((d: any) => (
                          <tr key={d.id} className={`border-b ${editingId === d.id ? 'bg-blue-50' : ''}`}>
                              <td className="p-3">{renderStatusBadge(d.source)}</td>
                              {/* Apply Text Color: Red if Draft, Gray if Published */}
                              <td className={`p-3 ${d.source === 'staged' ? 'text-red-600 font-medium' : 'text-gray-700'}`}>{formatDate(d.date)}</td>
                              <td className={`p-3 font-bold ${d.source === 'staged' ? 'text-red-600' : 'text-gray-900'}`}>{formatCurrency(d.nominal)}</td>
                              <td className="p-1 text-center align-middle w-16"> 
                                  {/* Desktop: Vertical */}
                                  {getActionButtons(d, 'previous', 'col')}
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
            </div>

             {/* Mobile TABLE (Fixed Scroll) with 7px Font */}
             <div className="md:hidden border rounded-lg overflow-hidden border-gray-200">
               <div className="overflow-y-auto max-h-[300px] overflow-x-hidden relative [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                   <table className="w-full text-[7px] table-fixed relative border-collapse">
                        <thead className="sticky top-0 z-10 bg-gray-100 shadow-sm text-gray-700 uppercase font-bold">
                            <tr>
                                <th className="w-[10%] py-2 text-center border-b border-r border-gray-200">No</th>
                                <th className="w-[25%] py-2 text-center border-b border-r border-gray-200">Tgl</th>
                                <th className="w-[35%] py-2 text-right px-2 border-b border-r border-gray-200">Nominal</th>
                                <th className="w-[30%] py-2 text-center border-b border-gray-200">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allPreviousFunds.map((d, idx) => (
                                <tr key={d.id} className={`border-b border-gray-50 ${d.source === 'staged' ? 'bg-white' : 'bg-white'}`}>
                                    <td className="py-2 text-center text-gray-500 border-r border-gray-100 align-top">{idx+1}</td>
                                    <td className="py-2 text-center align-top border-r border-gray-100">
                                        {/* Added Status Badge in Mobile View */}
                                        <div className="flex justify-center mb-1">{renderStatusBadge(d.source)}</div>
                                        <div className={`leading-tight ${d.source === 'staged' ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                                            {formatDateShort(d.date)}
                                        </div>
                                    </td>
                                    <td className={`py-2 px-2 text-right font-bold truncate border-r border-gray-100 align-top ${d.source === 'staged' ? 'text-red-600' : 'text-gray-800'}`}>
                                        {formatCurrency(d.nominal)}
                                    </td>
                                    <td className="py-2 flex justify-center items-center align-top">
                                        {/* Mobile: Horizontal (Row) */}
                                        {getActionButtons(d, 'previous', 'row')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="sticky bottom-0 z-10 bg-gray-50 border-t shadow-[0_-2px_4px_rgba(0,0,0,0.05)] font-bold">
                            <tr>
                                <td colSpan={2} className="py-2 px-2 text-right text-gray-600 uppercase">Total</td>
                                <td className="py-2 px-2 text-right text-emerald-800 border-r border-gray-100">
                                    {formatCurrency(allPreviousFunds.reduce((a,b) => a + b.nominal, 0))}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                   </table>
               </div>
            </div>
          </div>
        )}

        {/* === 2. WEEKLY FORM === */}
        {activeTab === 'weekly' && (
          <div className="space-y-2 md:space-y-6">
             {/* ... Form Inputs with Readonly Fields ... */}
            <div className={`grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-3 bg-gray-50 p-2 md:p-3 rounded-lg border ${editingId ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
                {/* ... Inputs (Unchanged) ... */}
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

                {/* READONLY FIELDS */}
                <div className="col-span-1">
                    <label className="block text-[9px] md:text-[10px] text-red-500 mb-0.5 md:mb-1 font-semibold">Potongan 5%</label>
                    <input type="text" readOnly value={formatCurrency(calcCons)} className={`${inputReadonlyClass} bg-red-50 text-red-700`} />
                </div>
                <div className="col-span-1">
                    <label className="block text-[9px] md:text-[10px] text-red-500 mb-0.5 md:mb-1 font-semibold">Potongan 10%</label>
                    <input type="text" readOnly value={formatCurrency(calcComm)} className={`${inputReadonlyClass} bg-red-50 text-red-700`} />
                </div>
                 <div className="col-span-1">
                    <label className="block text-[9px] md:text-[10px] text-emerald-700 mb-0.5 md:mb-1 font-bold">Hasil Bersih</label>
                    <input type="text" readOnly value={formatCurrency(calcNet)} className={`${inputReadonlyClass} bg-emerald-50 text-emerald-800 font-bold border-emerald-200`} />
                </div>

                <div className="col-span-1 flex items-end">
                    <div className="flex gap-2 w-full">
                        {editingId && (
                            <button onClick={cancelEdit} className="w-1/3 bg-red-500 text-white py-1.5 md:py-2 rounded-lg font-bold text-[10px] md:text-xs flex items-center justify-center gap-1"><XCircle size={12} className="md:w-3.5 md:h-3.5"/> Batal</button>
                        )}
                        <button onClick={handleSaveWeek} className="flex-1 bg-primary hover:bg-emerald-800 text-white py-1.5 md:py-2 rounded-lg font-bold text-[10px] md:text-xs flex items-center justify-center gap-2">
                            {editingId ? <Pencil size={12} className="md:w-3.5 md:h-3.5"/> : <Save size={12} className="md:w-3.5 md:h-3.5"/>} {editingId ? (editingSource === 'published' ? 'SIMPAN PERUBAHAN' : 'SIMPAN PERUBAHAN') : 'SIMPAN'}
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs text-left">
                    <thead className="bg-gray-100 uppercase text-gray-700">
                        <tr>
                            <th className="p-2">Status</th>
                            <th className="p-2">Tgl</th> 
                            <th className="p-2">Minggu/RT</th>
                            <th className="p-2">Pemasukan Kotor</th>
                            <th className="p-2 text-red-500">5%</th>
                            <th className="p-2 text-red-500">10%</th>
                            <th className="p-2 text-green-700">Pendapatan Bersih</th>
                            <th className="p-2">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allWeeklyData.map(d => (
                            <tr key={d.id} className={`border-b hover:bg-gray-50 ${editingId === d.id ? 'bg-blue-50' : ''}`}>
                                <td className="p-2">{renderStatusBadge(d.source)}</td>
                                <td className={`p-2 whitespace-nowrap ${d.source === 'staged' ? 'text-red-600 font-medium' : 'text-gray-700'}`}>{formatDateShort(d.date)}</td> 
                                <td className="p-2 font-medium">
                                    <div className={`${d.source === 'staged' ? 'text-red-600' : 'text-gray-800'}`}>{d.week}</div>
                                    <div className={`text-[10px] font-bold ${d.source === 'staged' ? 'text-red-600' : 'text-emerald-600'}`}>{d.rt}</div>
                                </td>
                                <td className="p-2">{formatCurrency(d.grossAmount)}</td>
                                <td className="p-2 text-red-500">-{formatCurrency(d.consumptionCut)}</td>
                                <td className="p-2 text-red-500">-{formatCurrency(d.commissionCut)}</td>
                                <td className={`p-2 font-bold ${d.source === 'staged' ? 'text-red-600' : 'text-green-700'}`}>{formatCurrency(d.netAmount)}</td>
                                <td className="p-1 text-center align-middle w-16">
                                    {/* Desktop: Vertical */}
                                    {getActionButtons(d, 'weekly', 'col')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile TABLE (Fixed Scroll) */}
            <div className="md:hidden border rounded-lg overflow-hidden border-gray-200">
               <div className="overflow-y-auto max-h-[350px] overflow-x-hidden relative [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                   <table className="w-full text-[7px] table-fixed relative border-collapse">
                        <thead className="sticky top-0 z-10 bg-gray-100 shadow-sm text-gray-700 uppercase font-bold">
                            <tr>
                                <th className="w-[8%] py-2 text-center border-b border-r border-gray-200">No</th>
                                <th className="w-[22%] py-2 text-center border-b border-r border-gray-200">Info</th>
                                <th className="w-[50%] py-2 text-center px-1 border-b border-r border-gray-200">Pemasukan</th>
                                <th className="w-[20%] py-2 text-center border-b border-gray-200">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {allWeeklyData.map((d, idx) => (
                                <tr key={d.id} className={`${d.source === 'staged' ? 'bg-white' : 'bg-white'}`}>
                                    <td className="py-2 text-center text-gray-500 align-middle border-r border-gray-100">{idx+1}</td>
                                    
                                    <td className="py-1 px-1 text-center align-middle border-r border-gray-100">
                                        <div className="flex justify-center mb-1">{renderStatusBadge(d.source)}</div>
                                        <div className={`${d.source === 'staged' ? 'text-red-600 font-bold' : 'text-blue-600 font-semibold'} mb-0.5`}>{formatDateShort(d.date)}</div>
                                        <div className={`${d.source === 'staged' ? 'text-red-600' : 'text-gray-800'} leading-tight mb-0.5`}>{d.week}</div>
                                        <div className="inline-block bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded text-[9px] font-bold border border-emerald-200">{d.rt}</div>
                                    </td>
                                    
                                    <td className="py-2 px-2 align-middle border-r border-gray-100">
                                        <div className="space-y-1 text-[8px]">
                                            <div className="flex justify-between items-center text-gray-600">
                                                <span>Kotor</span>
                                                <span className="font-medium">: {formatCurrency(d.grossAmount)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-red-500">
                                                <span>Konsumsi 5%</span>
                                                <span>: -{formatCurrency(d.consumptionCut)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-red-500">
                                                <span>Komisi 10%</span>
                                                <span>: -{formatCurrency(d.commissionCut)}</span>
                                            </div>
                                            <div className={`flex justify-between items-center font-bold px-1 rounded-sm py-0.5 border border-emerald-100 text-[8px] ${d.source === 'staged' ? 'text-red-600 bg-red-50' : 'text-emerald-700 bg-emerald-50'}`}>
                                                <span>BERSIH</span>
                                                <span>: {formatCurrency(d.netAmount)}</span>
                                            </div>
                                        </div>
                                    </td>
                                    
                                    <td className="py-1 align-middle text-center"> 
                                        {/* Mobile Weekly: Vertical looks better on side because row is tall */}
                                        {getActionButtons(d, 'weekly', 'col')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="sticky bottom-0 z-10 bg-gray-50 border-t shadow-[0_-2px_4px_rgba(0,0,0,0.05)] font-bold">
                            <tr>
                                <td colSpan={2} className="py-2 px-2 text-right text-gray-600 uppercase border-r border-gray-200">Total Bersih</td>
                                <td className="py-2 px-2 text-right text-emerald-800 border-r border-gray-200 text-[10px]">
                                    {formatCurrency(allWeeklyData.reduce((a,b) => a + b.netAmount, 0))}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                   </table>
               </div>
            </div>
          </div>
        )}

        {/* === 3. DONOR FORM === */}
        {activeTab === 'donor' && (
             <div className="space-y-2 md:space-y-6">
             {/* ... Form Inputs (Unchanged) ... */}
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
                            {editingId ? <Pencil size={12} className="md:w-3.5 md:h-3.5"/> : <Save size={12} className="md:w-3.5 md:h-3.5"/>} {editingId ? (editingSource === 'published' ? 'SIMPAN PERUBAHAN' : 'SIMPAN PERUBAHAN') : 'SIMPAN'}
                        </button>
                     </div>
                 </div>
             </div>
 
             {/* Desktop Table */}
             <div className="hidden md:block">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 uppercase text-gray-700"><tr><th className="p-3">Status</th><th className="p-3">Tgl</th><th className="p-3">Sumber Dana</th><th className="p-3">Nominal</th><th className="p-3">Aksi</th></tr></thead>
                    <tbody>
                        {allDonors.map((d: any) => (
                            <tr key={d.id} className={`border-b ${editingId === d.id ? 'bg-blue-50' : ''}`}>
                                <td className="p-3">{renderStatusBadge(d.source)}</td>
                                <td className={`p-3 ${d.source === 'staged' ? 'text-red-600 font-medium' : 'text-gray-700'}`}>{formatDate(d.date)}</td>
                                <td className={`p-3 font-semibold ${d.source === 'staged' ? 'text-red-600' : 'text-gray-800'}`}>{d.name}</td>
                                <td className={`p-3 font-bold ${d.source === 'staged' ? 'text-red-600' : 'text-blue-700'}`}>{formatCurrency(d.nominal)}</td>
                                <td className="p-1 text-center align-middle w-16">
                                    {/* Desktop: Vertical */}
                                    {getActionButtons(d, 'donor', 'col')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>

             {/* Mobile TABLE (Fixed Scroll) 7px Font */}
             <div className="md:hidden border rounded-lg overflow-hidden border-gray-200">
               <div className="overflow-y-auto max-h-[300px] overflow-x-hidden relative [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                   <table className="w-full text-[7px] table-fixed relative border-collapse">
                        <thead className="sticky top-0 z-10 bg-gray-100 shadow-sm text-gray-700 uppercase font-bold">
                            <tr>
                                <th className="w-[10%] py-2 text-center border-b border-r border-gray-200">No</th>
                                <th className="w-[20%] py-2 text-center border-b border-r border-gray-200">Tgl</th>
                                <th className="w-[35%] py-2 text-left px-1 border-b border-r border-gray-200">Nama</th>
                                <th className="w-[20%] py-2 text-right px-1 border-b border-r border-gray-200">Nominal</th>
                                <th className="w-[15%] py-2 text-center border-b border-gray-200">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allDonors.map((d, idx) => (
                                <tr key={d.id} className={`border-b border-gray-50 ${d.source === 'staged' ? 'bg-white' : 'bg-white'}`}>
                                    <td className="py-2 text-center text-gray-500 align-top border-r border-gray-100">{idx+1}</td>
                                    
                                    <td className="py-2 text-center align-top border-r border-gray-100">
                                        {/* Added Status Badge in Mobile View */}
                                        <div className="flex justify-center mb-1">{renderStatusBadge(d.source)}</div>
                                        <div className={`leading-tight ${d.source === 'staged' ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                                            {formatDateShort(d.date)}
                                        </div>
                                    </td>

                                    <td className={`py-2 px-1 leading-tight align-top truncate border-r border-gray-100 ${d.source === 'staged' ? 'text-red-600' : 'text-gray-800'}`}>{d.name}</td>
                                    <td className={`py-2 px-1 text-right font-bold align-top border-r border-gray-100 ${d.source === 'staged' ? 'text-red-600' : 'text-blue-700'}`}>{formatCurrency(d.nominal)}</td>
                                    <td className="py-1 flex justify-center items-center align-top">
                                        {/* Mobile: Horizontal (Row) requested */}
                                        {getActionButtons(d, 'donor', 'row')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="sticky bottom-0 z-10 bg-gray-50 border-t shadow-[0_-2px_4px_rgba(0,0,0,0.05)] font-bold">
                            <tr>
                                <td colSpan={3} className="py-2 px-2 text-right text-gray-600 uppercase border-r border-gray-200">Total</td>
                                <td className="py-2 px-2 text-right text-blue-800 border-r border-gray-200">
                                    {formatCurrency(allDonors.reduce((a,b) => a + b.nominal, 0))}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                   </table>
               </div>
            </div>
           </div>
        )}

        {/* === 4. EXPENSE FORM === */}
        {activeTab === 'expense' && (
             <div className="space-y-2 md:space-y-6">
             {/* ... Form Inputs (Unchanged) ... */}
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
                            {editingId ? <Pencil size={12} className="md:w-3.5 md:h-3.5"/> : <Save size={12} className="md:w-3.5 md:h-3.5"/>} {editingId ? (editingSource === 'published' ? 'SIMPAN PERUBAHAN' : 'SIMPAN PERUBAHAN') : 'SIMPAN'}
                        </button>
                     </div>
                 </div>
             </div>
 
             {/* Desktop Table */}
             <div className="hidden md:block">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 uppercase text-gray-700"><tr><th className="p-3">Status</th><th className="p-3">Tgl</th><th className="p-3">Keperluan</th><th className="p-3">Nominal</th><th className="p-3">Aksi</th></tr></thead>
                    <tbody>
                        {allExpenses.map((d: any) => (
                            <tr key={d.id} className={`border-b ${editingId === d.id ? 'bg-blue-50' : ''}`}>
                                <td className="p-3">{renderStatusBadge(d.source)}</td>
                                <td className={`p-3 ${d.source === 'staged' ? 'text-red-600 font-medium' : 'text-gray-700'}`}>{formatDate(d.date)}</td>
                                <td className={`p-3 ${d.source === 'staged' ? 'text-red-600' : 'text-gray-800'}`}>{d.purpose}</td>
                                <td className={`p-3 font-bold ${d.source === 'staged' ? 'text-red-600' : 'text-red-600'}`}>{formatCurrency(d.nominal)}</td>
                                <td className="p-1 text-center align-middle w-16"> 
                                    {/* Desktop: Vertical */}
                                    {getActionButtons(d, 'expense', 'col')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>

             {/* Mobile TABLE (Fixed Scroll) 7px Font */}
             <div className="md:hidden border rounded-lg overflow-hidden border-gray-200">
               <div className="overflow-y-auto max-h-[300px] overflow-x-hidden relative [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                   <table className="w-full text-[7px] table-fixed relative border-collapse">
                        <thead className="sticky top-0 z-10 bg-gray-100 shadow-sm text-gray-700 uppercase font-bold">
                            <tr>
                                <th className="w-[10%] py-2 text-center border-b border-r border-gray-200">No</th>
                                <th className="w-[20%] py-2 text-center border-b border-r border-gray-200">Tgl</th>
                                <th className="w-[30%] py-2 text-left px-1 border-b border-r border-gray-200">Keperluan</th>
                                <th className="w-[25%] py-2 text-right px-1 border-b border-r border-gray-200">Nominal</th>
                                <th className="w-[15%] py-2 text-center border-b border-gray-200">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allExpenses.map((d, idx) => (
                                <tr key={d.id} className={`border-b border-gray-50 ${d.source === 'staged' ? 'bg-white' : 'bg-white'}`}>
                                    <td className="py-2 text-center text-gray-500 align-top border-r border-gray-100">{idx+1}</td>
                                    <td className="py-2 text-center align-top border-r border-gray-100">
                                        {/* Added Status Badge in Mobile View */}
                                        <div className="flex justify-center mb-1">{renderStatusBadge(d.source)}</div>
                                        <div className={`leading-tight ${d.source === 'staged' ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                                            {formatDateShort(d.date)}
                                        </div>
                                    </td>
                                    <td className={`py-2 px-1 text-gray-800 leading-tight align-top truncate border-r border-gray-100 ${d.source === 'staged' ? 'text-red-600' : 'text-gray-800'}`}>{d.purpose}</td>
                                    <td className={`py-2 px-1 text-right font-bold align-top border-r border-gray-100 ${d.source === 'staged' ? 'text-red-600' : 'text-red-600'}`}>{formatCurrency(d.nominal)}</td>
                                    <td className="py-1 flex justify-center items-center align-top"> 
                                        {/* Mobile: Horizontal (Row) requested */}
                                        {getActionButtons(d, 'expense', 'row')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="sticky bottom-0 z-10 bg-gray-50 border-t shadow-[0_-2px_4px_rgba(0,0,0,0.05)] font-bold">
                            <tr>
                                <td colSpan={3} className="py-2 px-2 text-right text-gray-600 uppercase border-r border-gray-200">Total</td>
                                <td className="py-2 px-2 text-right text-red-800 border-r border-gray-200">
                                    {formatCurrency(allExpenses.reduce((a,b) => a + b.nominal, 0))}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                   </table>
               </div>
            </div>
           </div>
        )}

      </div>
    </div>
  );
};

export default InputSection;