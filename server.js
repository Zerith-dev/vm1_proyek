const express = require('express');
const mysql = require('mysql2');
const axios = require('axios');

const app = express();
const PORT = 3000;

// =========================================================================
// SYARAT DOSEN: "VM 1 pull/sentral, komunikasi via IP Address ke Database"
// Konfigurasi ini menembak ke IP VM 2 (Database)
// =========================================================================
const db = mysql.createConnection({
    host: '192.168.56.102', // IP VM 2 (Database)
    user: 'root',           // User DB VM 2
    password: '',           // Password DB VM 2
    database: 'db_kampus'   // Nama database di VM 2
});

db.connect((err) => {
    if (err) {
        console.log('[-] Menunggu koneksi ke Database VM 2...');
    } else {
        console.log('[+] Berhasil terhubung ke Database VM 2 via IP Address!');
    }
});

// =========================================================================
// SYARAT DOSEN: "Tembak tidak boleh langsung ke DB, tapi ke web dulu"
// Klien mengakses endpoint ini, lalu VM 1 yang merangkum datanya.
// =========================================================================
app.get('/api/mahasiswa/Lengkap', async (req, res) => {
    
    // TUGAS 1: Tarik data dari Database (VM 2)
    db.query('SELECT * FROM mahasiswa', async (err, dbResults) => {
        if (err) {
            return res.status(500).json({ 
                error: 'Gagal menarik data dari Database VM 2', 
                detail: err.message 
            });
        }

        // TUGAS 2: Tarik data dari API Web 2 di Proxmox (VM 4)
        // SYARAT DOSEN: "Ambil dari API atau proxmox/VM 3 yang isinya web"
        try {
            const apiResponse = await axios.get('http://192.168.56.103:4000');
            const apiData = apiResponse.data;

            // TUGAS 3: Gabungkan (Sentralisasi) Data
            res.status(200).json({
                keterangan: "Data Dirangkum oleh Web Sentral (VM 1)",
                syarat_terpenuhi: "Komunikasi via IP Address berhasil",
                data_dari_database_vm2: dbResults,  // Berisi nama-nama asal/fiktif nanti
                data_dari_api_proxmox_vm4: apiData
            });

        } catch (apiErr) {
            res.status(500).json({ 
                error: 'Gagal menghubungi API di Proxmox (VM 4)', 
                detail: apiErr.message 
            });
        }
    });
});

// Jalankan Web Sentral di VM 1
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[+] Web Sentral (VM 1) aktif di Port ${PORT}`);
    console.log(`[+] Akses di: http://192.168.56.105:${PORT}/api/mahasiswa/Lengkap`);
});