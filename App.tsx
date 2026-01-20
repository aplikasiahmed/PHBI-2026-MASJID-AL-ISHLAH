import React, { useState } from 'react';
import { DataProvider, useData } from './context/DataContext';
import Header from './components/Header';
import Footer from './components/Footer';
import PublicHome from './pages/PublicHome';
import AdminDashboard from './pages/admin/AdminDashboard';
import Modal from './components/ui/Modal';
import Swal from 'sweetalert2';
import { Eye, EyeOff, UserPlus } from 'lucide-react';

// Inner component to access context
const MainContent: React.FC = () => {
  const { isLoggedIn, login, verifyUser } = useData();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async () => {
    // 1. Validasi Kolom Wajib Diisi
    if (!username || !password) {
      Swal.fire({
        icon: 'warning',
        title: 'Opss...',
        text: 'Mohon lengkapi Username atau Password untuk masuk.',
        confirmButtonColor: '#ff0000' // merah
      });
      return;
    }

    setIsLoading(true);

    try {
      // 2. Verifikasi Akun ke Database (Async)
      const isValid = await verifyUser(username, password);

      if (isValid) {
        login(username); // Set State Login Sukses
        setIsLoginModalOpen(false);
        // Reset form
        setUsername('');
        setPassword('');
        
        // 3. Ucapan Selamat Datang
        Swal.fire({
          icon: 'success',
          title: `Selamat Datang, ${username}!`,
          text: 'Anda berhasil masuk ke Dashboard Admin.',
          showConfirmButton: false,
          timer: 3000
        });
      } else {
        // 4. Gagal Login & Reset Form
        // Jangan reset username agar user tidak perlu ngetik ulang jika typo
        setPassword(''); 
        Swal.fire({
          icon: 'error',
          title: 'Gagal Masuk',
          text: 'Username atau Password salah. Silakan periksa kembali.',
          confirmButtonColor: '#ff0000'
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Kesalahan Sistem',
        text: 'Terjadi gangguan koneksi ke server. Silakan coba lagi nanti.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterClick = () => {
    Swal.fire({
      title: 'Informasi Pendaftaran Akun',
      text: 'Silakan menghubungi Ketua Panitia PHBI',
      icon: 'info',
      confirmButtonText: 'Baik',
      confirmButtonColor: '#2563eb' // Blue
    });
  };

  if (isLoggedIn) {
    return <AdminDashboard />;
  }

  return (
    <div className="flex flex-col min-h-screen font-sans">
      <Header onLoginClick={() => setIsLoginModalOpen(true)} />
      
      <main className="flex-grow bg-gray-50">
        <PublicHome />
      </main>

      <Footer />

      {/* Login Modal */}
      {isLoginModalOpen && (
        <Modal title="Masuk Admin" onClose={() => setIsLoginModalOpen(false)}>
           {/* Mengurangi space vertical agar lebih padat di mobile */}
           <div className="space-y-2.5 md:space-y-5">
              <div>
                {/* Font label lebih kecil */}
                <label className="block text-[10px] md:text-sm font-semibold text-gray-700 mb-0.5 md:mb-1">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  // Padding input diperkecil (py-1.5) dan font diperkecil (text-xs)
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-1.5 md:px-4 md:py-3 text-xs md:text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none shadow-sm transition placeholder:text-gray-400"
                  placeholder="Masukkan Username"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-[10px] md:text-sm font-semibold text-gray-700 mb-0.5 md:mb-1">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    // Padding input diperkecil (py-1.5)
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-1.5 md:px-4 md:py-3 pr-8 md:pr-10 text-xs md:text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none shadow-sm transition placeholder:text-gray-400"
                    placeholder="Masukkan Password"
                    disabled={isLoading}
                  />
                  {/* Icon Mata */}
                  <button 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary transition"
                    type="button"
                  >
                    {showPassword ? <EyeOff size={14} className="md:w-5 md:h-5" /> : <Eye size={14} className="md:w-5 md:h-5" />}
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 md:gap-3 pt-1 md:pt-2">
                <div className="flex gap-2 md:gap-3">
                  <button 
                    onClick={() => setIsLoginModalOpen(false)}
                    // Tombol Batal diperkecil paddingnya
                    className="flex-1 bg-red-500 hover:bg-red-700 text-white py-1.5 md:py-3 rounded-lg font-bold shadow-md transition flex items-center justify-center gap-1.5 text-xs md:text-sm"
                    disabled={isLoading}
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleLoginSubmit}
                    disabled={isLoading}
                    // Tombol Masuk diperkecil paddingnya
                    className="flex-1 bg-primary text-white py-1.5 md:py-3 rounded-lg hover:bg-emerald-800 font-bold shadow-md transition text-xs md:text-sm flex justify-center items-center"
                  >
                    {isLoading ? (
                      <span className="inline-block w-3 h-3 md:w-4 md:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      'Masuk'
                    )}
                  </button>
                </div>

                {/* Separator lebih tipis */}
                <div className="relative flex py-0.5 md:py-2 items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink-0 mx-2 text-gray-400 text-[9px] md:text-xs">Atau</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                </div>

                <button 
                  onClick={handleRegisterClick}
                  // Tombol Daftar diperkecil paddingnya
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 md:py-3 rounded-lg font-bold shadow-md transition flex items-center justify-center gap-1.5 text-xs md:text-sm"
                >
                  <UserPlus size={14} className="md:w-[18px] md:h-[18px]" /> Daftar Akun Baru
                </button>
              </div>
           </div>
        </Modal>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <DataProvider>
      <MainContent />
    </DataProvider>
  );
};

export default App;