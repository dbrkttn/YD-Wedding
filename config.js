/*
 * Semua detail undangan ada di file ini.
 * Every invitation detail lives here.
 */
window.UNDANGAN = {
    // Format: YYYY-MM-DD. Hari, tanggal, dan bulan di halaman dihitung otomatis.
    tanggal: '2026-12-26',

    // Selisih dari UTC dan zona waktu lokasi acara (WIB).
    offsetUtc: '+07:00',
    zonaWaktu: 'Asia/Jakarta',
    labelZona: 'WIB',

    mempelai: {
        wanita: {
            panggilan: 'Yundhai',
            namaLengkap: 'Ayundhai Elantra',
            keterangan: 'Putri kedua dari',
            ayah: 'Bapak Syaiful Bachri',
            ibu: 'Ibu Sri Hartatik',
            asal: 'Gendongan, Tingkir, Salatiga, Jawa Tengah',
        },
        pria: {
            panggilan: 'Dobrak',
            namaLengkap: 'Dobrak Tirani Tegak Nurani',
            keterangan: 'Putra pertama dari',
            ayah: 'Bapak Kusuma Prabawa',
            ibu: 'Ibu Anik Restianik',
            asal: 'Tamanmartani, Kalasan, Sleman, D.I. Yogyakarta',
        },
    },

    akad: {
        jam: '09.00',
        mulai: '09:00',
    },

    resepsi: {
        sesi: ['11.00 - 12.00', '12.00 - 13.00'],
        selesai: '13:00',
    },

    tempat: {
        // \n = pindah baris pada jadwal di dalam bingkai.
        nama: ['Gedung Balai\nPrajurit Makutarama', 'Salatiga'],
        // Tautan tombol "Buka Google Maps" dan kata kunci peta di halaman.
        mapsUrl: 'https://maps.app.goo.gl/GDxsPb4EtZCYH9uT9',
        petaKataKunci: 'Gedung Balai Prajurit Makutarama, Salatiga',
    },

    // Kosongkan ('') jika tidak ingin memakai musik.
    musik: 'assets/musik.mp3',

    galeri: [
        { src: 'assets/photos/galeri-1.webp', alt: 'Kedua mempelai duduk di atas rumput' },
        { src: 'assets/photos/galeri-2.webp', alt: 'Mempelai wanita memegang buket mawar merah' },
        { src: 'assets/photos/galeri-3.webp', alt: 'Mempelai pria duduk di atas rumput' },
        { src: 'assets/photos/galeri-4.webp', alt: 'Mempelai wanita tersenyum di taman' },
        { src: 'assets/photos/galeri-5.webp', alt: 'Mempelai pria di taman' },
        { src: 'assets/photos/galeri-6.webp', alt: 'Kedua mempelai bergandengan tangan' },
    ],

    // Tempel URL Web App dari Google Apps Script di sini (lihat README.md).
    // Selama kosong, formulir berjalan dalam mode contoh dan tidak mengirim data.
    rsvpUrl: 'https://script.google.com/macros/s/AKfycbyRblKk9mGIQ9N-5PUHt9DOFErCAAzX7e7c6ErFSdx_LeLqc2j40OIWjlwiHUOpZsCk/exec',
};
