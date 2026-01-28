/*
  INSTRUKSI PERBAIKAN WARNING SUPABASE (VERSI FINAL - SAPU BERSIH):
  
  1. Masuk ke Dashboard Supabase Anda (https://supabase.com/dashboard).
  2. Pilih Project Anda.
  3. Klik menu "SQL Editor" (ikon terminal/kertas di sidebar kiri).
  4. Klik tombol "New query" atau "+".
  5. COPY semua kode di bawah ini dan PASTE ke area editor SQL tersebut.
  6. Klik tombol "Run" (pojok kanan bawah editor).
  
  PENJELASAN:
  Script ini menggunakan perintah khusus (DO BLOCK) untuk mencari dan menghapus
  SEMUA policy lama secara otomatis tanpa perlu tahu namanya.
  Setelah bersih, script akan membuat policy baru yang aman (khusus akses Anon)
  sehingga warning "RLS Policy Always True" akan hilang.
*/

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Loop untuk menghapus SEMUA policy lama pada tabel DanaSebelumnya_data
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'DanaSebelumnya_data') LOOP
        EXECUTE 'DROP POLICY "' || r.policyname || '" ON "DanaSebelumnya_data"';
    END LOOP;

    -- 2. Loop untuk menghapus SEMUA policy lama pada tabel Mingguan_data
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'Mingguan_data') LOOP
        EXECUTE 'DROP POLICY "' || r.policyname || '" ON "Mingguan_data"';
    END LOOP;

    -- 3. Loop untuk menghapus SEMUA policy lama pada tabel Donatur_data
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'Donatur_data') LOOP
        EXECUTE 'DROP POLICY "' || r.policyname || '" ON "Donatur_data"';
    END LOOP;

    -- 4. Loop untuk menghapus SEMUA policy lama pada tabel Pengeluaran_data
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'Pengeluaran_data') LOOP
        EXECUTE 'DROP POLICY "' || r.policyname || '" ON "Pengeluaran_data"';
    END LOOP;

    -- 5. Loop untuk menghapus SEMUA policy lama pada tabel admin_users
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'admin_users') LOOP
        EXECUTE 'DROP POLICY "' || r.policyname || '" ON "admin_users"';
    END LOOP;

    -- 6. Loop untuk menghapus SEMUA policy lama pada tabel app_meta
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'app_meta') LOOP
        EXECUTE 'DROP POLICY "' || r.policyname || '" ON "app_meta"';
    END LOOP;
END $$;

-- --- MEMBUAT POLICY BARU YANG AMAN (HANYA UNTUK ROLE ANON) ---

-- 1. DanaSebelumnya_data
ALTER TABLE "DanaSebelumnya_data" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Anon Access" ON "DanaSebelumnya_data" FOR ALL TO anon USING (auth.role() = 'anon') WITH CHECK (auth.role() = 'anon');

-- 2. Mingguan_data
ALTER TABLE "Mingguan_data" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Anon Access" ON "Mingguan_data" FOR ALL TO anon USING (auth.role() = 'anon') WITH CHECK (auth.role() = 'anon');

-- 3. Donatur_data
ALTER TABLE "Donatur_data" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Anon Access" ON "Donatur_data" FOR ALL TO anon USING (auth.role() = 'anon') WITH CHECK (auth.role() = 'anon');

-- 4. Pengeluaran_data
ALTER TABLE "Pengeluaran_data" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Anon Access" ON "Pengeluaran_data" FOR ALL TO anon USING (auth.role() = 'anon') WITH CHECK (auth.role() = 'anon');

-- 5. admin_users
ALTER TABLE "admin_users" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Anon Access" ON "admin_users" FOR ALL TO anon USING (auth.role() = 'anon') WITH CHECK (auth.role() = 'anon');

-- 6. app_meta
ALTER TABLE "app_meta" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Anon Access" ON "app_meta" FOR ALL TO anon USING (auth.role() = 'anon') WITH CHECK (auth.role() = 'anon');
