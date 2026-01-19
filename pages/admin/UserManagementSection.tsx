import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import Swal from 'sweetalert2';
import { UserPlus, ShieldAlert, Users, Trash2 } from 'lucide-react';

const UserManagementSection: React.FC = () => {
  const { addAdminUser, getAdminUsers, deleteAdminUser } = useData();
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    masterPassword: ''
  });

  const loadUsers = async () => {
      const data = await getAdminUsers();
      setUsers(data);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.password || !formData.masterPassword) {
        Swal.fire('Peringatan', 'Semua kolom wajib diisi!', 'warning');
        return;
    }

    if (formData.password !== formData.confirmPassword) {
        Swal.fire('Peringatan', 'Konfirmasi password tidak cocok!', 'warning');
        return;
    }

    // Call Context Function
    const success = await addAdminUser(formData.username, formData.password, formData.masterPassword);
    
    // REVISI 1: Hapus isi konten form baik berhasil maupun gagal
    setFormData({ username: '', password: '', confirmPassword: '', masterPassword: '' });

    if (success) {
        Swal.fire({
            title: 'Berhasil',
            text: `Admin user baru berhasil ditambahkan.`,
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
        loadUsers(); // Reload list
    }
  };

  const handleDelete = async (id: string, username: string) => {
      const { value: masterPass } = await Swal.fire({
          title: 'Hapus Admin?',
          text: `Hapus user: ${username}`,
          input: 'password',
          inputPlaceholder: 'Masukkan Kode ID Server',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          confirmButtonText: 'Hapus',
          cancelButtonText: 'Batal',
          customClass: {
            title: 'text-lg',
            input: 'text-sm'
          }
      });

      if (masterPass) {
          const success = await deleteAdminUser(id, masterPass);
          if (success) {
              Swal.fire({
                  title: 'Terhapus',
                  text: 'User dihapus.',
                  icon: 'success',
                  timer: 1000,
                  showConfirmButton: false
              });
              loadUsers();
          }
      }
  };

  const inputClass = "w-full bg-white border rounded-lg px-2 py-1.5 md:px-3 md:py-2 text-[10px] md:text-sm focus:ring-1 focus:ring-primary outline-none shadow-sm placeholder:text-gray-300";
  const labelClass = "block text-[9px] md:text-xs font-bold text-gray-600 mb-0.5 md:mb-1";

  return (
    <div className="space-y-3 md:space-y-6">
      {/* Header Kecil */}
      <div className="border-b pb-2 md:pb-4">
        <h2 className="text-sm md:text-2xl font-bold text-gray-800 flex items-center gap-1.5 md:gap-2">
            <UserPlus className="text-primary w-4 h-4 md:w-6 md:h-6" /> 
            <span>Kelola Admin</span>
        </h2>
        <p className="text-[9px] md:text-sm text-gray-500 mt-0.5 leading-tight">
            Tambahkan akun pengurus untuk akses dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-8">
          
          {/* FORM INPUT COMPACT */}
          <div className="bg-gray-50 p-3 md:p-6 rounded-lg border border-gray-200 shadow-sm h-fit">
              <h3 className="font-bold text-xs md:text-lg mb-2 md:mb-3 text-gray-700 border-b border-gray-200 pb-1.5 md:pb-2">Tambah Admin Baru</h3>
              <form onSubmit={handleSubmit} className="space-y-2 md:space-y-4">
                  <div>
                      <label className={labelClass}>Username</label>
                      <input 
                        type="text" 
                        value={formData.username}
                        onChange={e => setFormData({...formData, username: e.target.value})}
                        className={inputClass}
                        placeholder="Contoh: bendahara2"
                      />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <div>
                        <label className={labelClass}>Password</label>
                        <input 
                            type="text" 
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                            className={inputClass}
                            placeholder="******"
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Ulangi Password</label>
                        <input 
                            type="text" 
                            value={formData.confirmPassword}
                            onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                            className={inputClass}
                            placeholder="******"
                        />
                    </div>
                  </div>

                  <hr className="border-gray-200 my-1 md:my-2" />

                  <div className="bg-red-50 p-2 md:p-3 rounded border border-red-100">
                      <label className="block text-[9px] md:text-xs font-bold text-red-700 mb-1 flex items-center gap-1">
                          <ShieldAlert size={10} className="md:w-3.5 md:h-3.5" /> Masukkan Kode ID Server
                      </label>
                      <input 
                        type="password" 
                        value={formData.masterPassword}
                        onChange={e => setFormData({...formData, masterPassword: e.target.value})}
                        className={`${inputClass} border-red-200 focus:ring-red-500`}
                        placeholder="Kode ID Server..."
                      />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-primary hover:bg-emerald-800 text-white font-bold py-1.5 md:py-2.5 rounded-lg shadow-sm text-[10px] md:text-sm transition active:scale-95 flex justify-center items-center gap-2 mt-2"
                  >
                      <UserPlus size={12} className="md:w-[18px] md:h-[18px]" /> TAMBAH ADMIN
                  </button>
              </form>
          </div>

          {/* LIST ADMIN COMPACT */}
          <div>
              <h3 className="font-bold text-xs md:text-lg mb-2 md:mb-4 text-gray-700 flex items-center gap-1.5 md:gap-2">
                  <Users size={14} className="md:w-5 md:h-5" /> Daftar Admin
              </h3>
              <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                  {users.length === 0 ? (
                      <div className="p-4 text-center text-gray-400 text-[10px] md:text-xs">Belum ada user tambahan.</div>
                  ) : (
                      <ul className="divide-y divide-gray-100">
                          {users.map((user, idx) => (
                              <li key={user.id} className="p-2 md:p-4 flex justify-between items-center hover:bg-gray-50 transition">
                                  <div className="flex items-center gap-2 md:gap-3">
                                      <div className="bg-gray-100 w-5 h-5 md:w-8 md:h-8 flex items-center justify-center rounded-full text-gray-600 font-bold text-[9px] md:text-xs">
                                          {idx + 1}
                                      </div>
                                      <div>
                                          <p className="font-bold text-gray-800 text-[10px] md:text-sm leading-tight">{user.username}</p>
                                          <p className="text-[8px] md:text-[10px] text-gray-400 leading-tight mt-0.5">
                                            {new Date(user.created_at).toLocaleDateString('id-ID')}
                                          </p>
                                      </div>
                                  </div>
                                  <button 
                                    onClick={() => handleDelete(user.id, user.username)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 md:p-2 rounded transition"
                                    title="Hapus"
                                  >
                                      <Trash2 size={12} className="md:w-4 md:h-4" />
                                  </button>
                              </li>
                          ))}
                      </ul>
                  )}
              </div>
          </div>

      </div>
    </div>
  );
};

export default UserManagementSection;