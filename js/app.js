(() => {
    'use strict';

    const cfg = window.UNDANGAN;
    const $ = (id) => document.getElementById(id);
    const UCAPAN_PER_HALAMAN = 10;

    document.documentElement.classList.add('js');

    /* ---------- Isi halaman dari config.js ---------- */

    const [tahun, bulan, tgl] = cfg.tanggal.split('-').map(Number);
    const tanggalUtc = new Date(Date.UTC(tahun, bulan - 1, tgl));
    const formatTanggal = (opsi) => new Intl.DateTimeFormat('id-ID', { timeZone: 'UTC', ...opsi }).format(tanggalUtc);
    const duaAngka = (n) => String(n).padStart(2, '0');
    const orangTua = (m) => `${m.keterangan}\n${m.ayah} & ${m.ibu}`;

    const nilai = {
        tanggalSingkat: `${duaAngka(tgl)}.${duaAngka(bulan)}.${String(tahun).slice(-2)}`,
        hari: formatTanggal({ weekday: 'long' }),
        tgl: String(tgl),
        bulan: formatTanggal({ month: 'long' }),
        tahun: String(tahun),
        tempatSatuBaris: cfg.tempat.nama.join(', ').replace(/\n/g, ' '),
        wanita: { ...cfg.mempelai.wanita, orangTua: orangTua(cfg.mempelai.wanita) },
        pria: { ...cfg.mempelai.pria, orangTua: orangTua(cfg.mempelai.pria) },
    };

    document.querySelectorAll('[data-isi]').forEach((el) => {
        el.textContent = el.dataset.isi.split('.').reduce((o, k) => o[k], nilai);
    });

    const baris = (wadah, daftar) => daftar.forEach((teks) => {
        const p = document.createElement('p');
        p.textContent = teks;
        wadah.appendChild(p);
    });
    // Jadwal resepsi: semua sesi, atau hanya sesi milik tamu (nomor mulai dari 1).
    const isiSesi = (nomor = null) => {
        const wadah = document.querySelector('[data-isi-sesi]');
        wadah.replaceChildren();
        if (nomor) {
            baris(wadah, [`${cfg.resepsi.sesi[nomor - 1]} ${cfg.labelZona}`]);
        } else {
            baris(wadah, cfg.resepsi.sesi.map((s) => `${s} ${cfg.labelZona}`));
        }
    };
    isiSesi();
    baris(document.querySelector('[data-isi-tempat]'), cfg.tempat.nama);


    /* ---------- Tamu: ?k=KODE dari daftar tamu, atau ?to=Nama ---------- */

    const parameter = new URLSearchParams(location.search);
    const kodeDiLink = (parameter.get('k') || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
    const namaDiLink = (parameter.get('to') || '').trim().slice(0, 60);
    let kodeTamu = '';

    const setNamaTamu = (nama) => {
        $('nama-tamu').textContent = nama;
        if (!$('rsvp-nama').value) {
            $('rsvp-nama').value = nama;
        }
    };

    if (namaDiLink) {
        setNamaTamu(namaDiLink);
    } else if (kodeDiLink && cfg.rsvpUrl) {
        $('nama-tamu').textContent = '...';
    }

    /* ---------- Musik ---------- */

    let musik = null;
    if (cfg.musik) {
        musik = new Audio(cfg.musik);
        musik.loop = true;
        musik.preload = 'none';
    }

    const setMusik = (main) => {
        const tombol = $('tombol-musik');
        tombol.setAttribute('aria-pressed', String(main));
        tombol.setAttribute('aria-label', main ? 'Jeda musik' : 'Putar musik');
    };

    const putarMusik = () => {
        if (!musik) {
            return;
        }
        musik.play().then(() => setMusik(true)).catch(() => setMusik(false));
    };

    $('tombol-musik').addEventListener('click', () => {
        if (musik.paused) {
            putarMusik();
        } else {
            musik.pause();
            setMusik(false);
        }
    });

    /* ---------- Buka undangan ---------- */

    $('buka-undangan').addEventListener('click', () => {
        const sampul = $('sampul');
        sampul.classList.add('terbuka');
        document.body.classList.remove('terkunci');
        window.scrollTo(0, 0);
        $('isi').focus({ preventScroll: true });

        if (musik) {
            $('tombol-musik').hidden = false;
            putarMusik();
        }

        setTimeout(() => {
            sampul.hidden = true;
            sampul.style.display = 'none';
        }, 800);
    });

    /* ---------- Animasi masuk ---------- */

    const elemenMuncul = document.querySelectorAll('.muncul');
    if ('IntersectionObserver' in window) {
        const pengamat = new IntersectionObserver((daftar) => daftar.forEach((e) => {
            if (e.isIntersecting) {
                e.target.classList.add('terlihat');
                pengamat.unobserve(e.target);
            }
        }), { rootMargin: '0px 0px -8% 0px' });
        elemenMuncul.forEach((el) => pengamat.observe(el));
    } else {
        elemenMuncul.forEach((el) => el.classList.add('terlihat'));
    }

    /* ---------- Hitung mundur ---------- */

    const waktuPada = (jam) => new Date(`${cfg.tanggal}T${jam}:00${cfg.offsetUtc}`).getTime();
    let waktuAcara = waktuPada(cfg.akad.mulai);
    let pewaktu = null;

    const perbaruiHitungan = () => {
        const sisa = waktuAcara - Date.now();

        if (sisa <= 0) {
            $('hitungan').hidden = true;
            $('hitungan').style.display = 'none';
            $('hitungan-selesai').hidden = false;
            clearInterval(pewaktu);
            return;
        }

        const detik = Math.floor(sisa / 1000);
        $('hm-hari').textContent = duaAngka(Math.floor(detik / 86400));
        $('hm-jam').textContent = duaAngka(Math.floor(detik / 3600) % 24);
        $('hm-menit').textContent = duaAngka(Math.floor(detik / 60) % 60);
        $('hm-detik').textContent = duaAngka(detik % 60);
    };

    pewaktu = setInterval(perbaruiHitungan, 1000);
    perbaruiHitungan();

    /* ---------- Google Calendar ---------- */

    const stempel = (jam) => `${cfg.tanggal.replace(/-/g, '')}T${jam.replace(':', '')}00`;
    const buatKalender = (mulai, selesai, keterangan) => {
        const kalender = new URL('https://calendar.google.com/calendar/render');
        kalender.search = new URLSearchParams({
            action: 'TEMPLATE',
            text: `Pernikahan ${cfg.mempelai.wanita.panggilan} & ${cfg.mempelai.pria.panggilan}`,
            dates: `${stempel(mulai)}/${stempel(selesai)}`,
            details: keterangan,
            location: nilai.tempatSatuBaris,
            ctz: cfg.zonaWaktu,
        }).toString();
        $('tautan-kalender').href = kalender.toString();
    };
    buatKalender(cfg.akad.mulai, cfg.resepsi.selesai,
        `Akad nikah pukul ${cfg.akad.jam} ${cfg.labelZona}. Resepsi: ${cfg.resepsi.sesi.join(', ')} ${cfg.labelZona}.`);

    // "11.00 - 12.00" menjadi ['11:00', '12:00'].
    const jamSesi = (nomor) => cfg.resepsi.sesi[nomor - 1].split('-').map((j) => j.trim().replace('.', ':'));

    const terapkanSesi = (nomor) => {
        if (!cfg.resepsi.sesi[nomor - 1]) {
            return;
        }
        const [mulai, selesai] = jamSesi(nomor);
        isiSesi(nomor);
        waktuAcara = waktuPada(mulai);
        perbaruiHitungan();
        buatKalender(mulai, selesai,
            `Resepsi sesi ${nomor}: ${cfg.resepsi.sesi[nomor - 1]} ${cfg.labelZona}.`);
    };

    /* ---------- Peta: dimuat saat hampir terlihat ---------- */

    $('tautan-maps').href = cfg.tempat.mapsUrl;

    const muatPeta = () => {
        const frame = document.createElement('iframe');
        frame.title = 'Peta lokasi acara';
        frame.loading = 'lazy';
        frame.referrerPolicy = 'no-referrer-when-downgrade';
        frame.src = `https://www.google.com/maps?q=${encodeURIComponent(cfg.tempat.petaKataKunci)}&output=embed`;
        $('peta').appendChild(frame);
    };

    if ('IntersectionObserver' in window) {
        const pengamatPeta = new IntersectionObserver((daftar) => {
            if (daftar.some((e) => e.isIntersecting)) {
                pengamatPeta.disconnect();
                muatPeta();
            }
        }, { rootMargin: '400px' });
        pengamatPeta.observe($('peta'));
    } else {
        muatPeta();
    }

    /* ---------- Galeri ---------- */

    const kotak = $('kotak-foto');
    const fotoBesar = $('foto-besar');
    let fotoAktif = 0;

    const tampilkanFoto = (i) => {
        fotoAktif = (i + cfg.galeri.length) % cfg.galeri.length;
        fotoBesar.src = cfg.galeri[fotoAktif].src;
        fotoBesar.alt = cfg.galeri[fotoAktif].alt;
    };

    /* Karusel: bergeser otomatis, berjeda saat tamu sedang berinteraksi. */
    const JEDA_KARUSEL = 3000;
    const karusel = $('karusel');
    const jalur = $('karusel-jalur');
    const jumlahFoto = cfg.galeri.length;
    const titik = [];
    let posisi = 0;              // jumlahFoto berarti salinan foto pertama di ujung jalur
    let pewaktuKarusel = null;
    let karuselTerlihat = false;
    let kursorDiAtas = false;
    let sedangGeser = false;
    let barusDigeser = false;

    const buatSlide = (foto, i, salinan) => {
        const tombol = document.createElement('button');
        tombol.type = 'button';
        tombol.className = 'karusel-slide';
        if (salinan) {
            tombol.setAttribute('aria-hidden', 'true');
            tombol.tabIndex = -1;
        } else {
            tombol.setAttribute('aria-label', `Perbesar foto ${i + 1} dari ${jumlahFoto}: ${foto.alt}`);
        }

        const latar = document.createElement('img');
        latar.className = 'karusel-latar';
        latar.alt = '';
        latar.dataset.src = foto.src;

        const gambar = document.createElement('img');
        gambar.className = 'karusel-foto';
        gambar.alt = salinan ? '' : foto.alt;
        gambar.dataset.src = foto.src;
        gambar.draggable = false;

        tombol.append(latar, gambar);
        tombol.addEventListener('click', () => {
            if (barusDigeser) {
                return;
            }
            tampilkanFoto(i);
            kotak.showModal();
        });
        return tombol;
    };

    // Banyak foto: penghitung "3 / 18" menggantikan titik yang tidak muat di layar ponsel.
    const pakaiPenghitung = jumlahFoto > 8;
    const penghitung = document.createElement('p');
    penghitung.className = 'karusel-penghitung';

    // Foto dimuat menjelang tampil: yang aktif, sebelum, dan dua sesudahnya.
    let fotoBolehDimuat = false;
    const muatSekitar = (aktif) => {
        if (!fotoBolehDimuat) {
            return;
        }
        const slide = Array.from(jalur.children);
        [aktif - 1, aktif, aktif + 1, aktif + 2].forEach((i) => {
            const nomor = (i + jumlahFoto) % jumlahFoto;
            [slide[nomor], nomor === 0 ? slide[jumlahFoto] : null].forEach((s) => {
                s?.querySelectorAll('img[data-src]').forEach((img) => {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                });
            });
        });
    };

    const setPosisi = (baru, animasi) => {
        posisi = baru;
        jalur.style.transition = animasi ? '' : 'none';
        jalur.style.transform = `translateX(${-posisi * 100}%)`;

        const aktif = posisi % jumlahFoto;
        muatSekitar(aktif);
        penghitung.textContent = `${aktif + 1} / ${jumlahFoto}`;
        titik.forEach((t, i) => t.setAttribute('aria-current', String(i === aktif)));
        Array.from(jalur.children).slice(0, jumlahFoto).forEach((slide, i) => {
            slide.tabIndex = i === aktif ? 0 : -1;
            slide.setAttribute('aria-hidden', String(i !== aktif));
        });
    };

    const pindahKarusel = (arah) => {
        // Kembali ke posisi sebenarnya tanpa animasi agar perulangan tidak terlihat.
        if (posisi === jumlahFoto) {
            setPosisi(0, false);
            void jalur.offsetWidth;
        }
        if (arah < 0 && posisi === 0) {
            setPosisi(jumlahFoto, false);
            void jalur.offsetWidth;
        }
        setPosisi(posisi + arah, true);
    };

    const karuselBolehJalan = () => karuselTerlihat
        && !document.hidden
        && !kotak.open
        && !kursorDiAtas
        && !sedangGeser
        && !karusel.querySelector(':focus-visible')
        && !$('karusel-titik').querySelector(':focus-visible');

    const mulaiPewaktuKarusel = () => {
        clearInterval(pewaktuKarusel);
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }
        pewaktuKarusel = setInterval(() => {
            if (karuselBolehJalan()) {
                pindahKarusel(1);
            }
        }, JEDA_KARUSEL);
    };

    const pindahManual = (arah) => {
        pindahKarusel(arah);
        mulaiPewaktuKarusel();
    };

    if (pakaiPenghitung) {
        $('karusel-titik').appendChild(penghitung);
    }

    cfg.galeri.forEach((foto, i) => {
        jalur.appendChild(buatSlide(foto, i, false));
        if (pakaiPenghitung) {
            return;
        }

        const tombolTitik = document.createElement('button');
        tombolTitik.type = 'button';
        tombolTitik.setAttribute('aria-label', `Tampilkan foto ${i + 1}`);
        tombolTitik.appendChild(document.createElement('span'));
        tombolTitik.addEventListener('click', () => {
            if (posisi === jumlahFoto) {
                setPosisi(0, false);
                void jalur.offsetWidth;
            }
            setPosisi(i, true);
            mulaiPewaktuKarusel();
        });
        titik.push(tombolTitik);
        $('karusel-titik').appendChild(tombolTitik);
    });
    jalur.appendChild(buatSlide(cfg.galeri[0], 0, true));
    setPosisi(0, false);

    jalur.addEventListener('transitionend', (e) => {
        if (e.target === jalur && posisi === jumlahFoto) {
            setPosisi(0, false);
        }
    });

    $('karusel-sebelum').addEventListener('click', () => pindahManual(-1));
    $('karusel-berikut').addEventListener('click', () => pindahManual(1));
    karusel.addEventListener('mouseenter', () => { kursorDiAtas = true; });
    karusel.addEventListener('mouseleave', () => { kursorDiAtas = false; });

    // Geser dengan jari atau tetikus.
    let awalX = null;
    let geserX = 0;

    jalur.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) {
            return;
        }
        if (posisi === jumlahFoto) {
            setPosisi(0, false);
        }
        awalX = e.clientX;
        geserX = 0;
        barusDigeser = false;
    });

    jalur.addEventListener('pointermove', (e) => {
        if (awalX === null) {
            return;
        }
        geserX = e.clientX - awalX;
        if (!sedangGeser && Math.abs(geserX) > 8) {
            sedangGeser = true;
            jalur.setPointerCapture(e.pointerId);
            jalur.style.transition = 'none';
        }
        if (sedangGeser) {
            jalur.style.transform = `translateX(calc(${-posisi * 100}% + ${geserX}px))`;
        }
    });

    const selesaiGeser = () => {
        if (awalX === null) {
            return;
        }
        awalX = null;
        if (!sedangGeser) {
            return;
        }
        sedangGeser = false;
        barusDigeser = true;
        setTimeout(() => { barusDigeser = false; }, 0);

        const cukupJauh = Math.abs(geserX) > jalur.clientWidth * 0.18;
        if (cukupJauh && (geserX > 0 || posisi < jumlahFoto)) {
            if (geserX > 0 && posisi === 0) {
                // Dari foto pertama ke foto terakhir, tetap mengikuti arah jari.
                setPosisi(jumlahFoto, false);
                jalur.style.transform = `translateX(calc(${-jumlahFoto * 100}% + ${geserX}px))`;
                void jalur.offsetWidth;
            }
            setPosisi(posisi + (geserX > 0 ? -1 : 1), true);
        } else {
            setPosisi(posisi, true);
        }
        mulaiPewaktuKarusel();
    };

    jalur.addEventListener('pointerup', selesaiGeser);
    jalur.addEventListener('pointercancel', selesaiGeser);

    // Foto mulai dimuat saat galeri hampir terlihat, dan pewaktu hanya berjalan saat terlihat.
    const muatFotoKarusel = () => {
        fotoBolehDimuat = true;
        muatSekitar(posisi % jumlahFoto);
    };

    if ('IntersectionObserver' in window) {
        new IntersectionObserver((daftar, pengamat) => {
            if (daftar.some((e) => e.isIntersecting)) {
                pengamat.disconnect();
                muatFotoKarusel();
            }
        }, { rootMargin: '800px' }).observe(karusel);

        new IntersectionObserver((daftar) => {
            karuselTerlihat = daftar[daftar.length - 1].isIntersecting;
        }, { threshold: 0.3 }).observe(karusel);
    } else {
        muatFotoKarusel();
        karuselTerlihat = true;
    }
    mulaiPewaktuKarusel();

    $('foto-tutup').addEventListener('click', () => kotak.close());
    $('foto-sebelum').addEventListener('click', () => tampilkanFoto(fotoAktif - 1));
    $('foto-berikut').addEventListener('click', () => tampilkanFoto(fotoAktif + 1));
    kotak.addEventListener('click', (e) => {
        if (e.target === kotak) {
            kotak.close();
        }
    });
    kotak.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            tampilkanFoto(fotoAktif - 1);
        } else if (e.key === 'ArrowRight') {
            tampilkanFoto(fotoAktif + 1);
        }
    });

    /* ---------- Ucapan ---------- */

    const modeContoh = !cfg.rsvpUrl;
    const contohUcapan = [
        { nama: 'Contoh Tamu Satu', ucapan: 'Selamat menempuh hidup baru. Semoga menjadi keluarga yang sakinah, mawaddah, warahmah.', waktu: '2027-05-20T10:00:00+07:00' },
        { nama: 'Contoh Tamu Dua', ucapan: 'Barakallahu lakuma. Turut berbahagia untuk kalian berdua!', waktu: '2027-05-18T19:30:00+07:00' },
    ];
    let semuaUcapan = [];
    let jumlahTampil = UCAPAN_PER_HALAMAN;

    const formatWaktu = (iso) => {
        const d = new Date(iso);
        return Number.isNaN(d.getTime())
            ? ''
            : new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
    };

    const buatElemen = (kelas, teks) => {
        const el = document.createElement('p');
        el.className = kelas;
        el.textContent = teks;
        return el;
    };

    const tampilkanUcapan = () => {
        const wadah = $('daftar-ucapan');
        wadah.replaceChildren();

        if (semuaUcapan.length === 0) {
            wadah.appendChild(buatElemen('ucapan-kosong', 'Belum ada ucapan. Jadilah yang pertama mengirim doa.'));
        }

        semuaUcapan.slice(0, jumlahTampil).forEach((u) => {
            const kartu = document.createElement('article');
            kartu.className = 'ucapan';
            kartu.append(
                buatElemen('ucapan-nama', u.nama),
                buatElemen('ucapan-waktu', formatWaktu(u.waktu)),
                buatElemen('ucapan-isi', u.ucapan),
            );
            wadah.appendChild(kartu);
        });

        $('ucapan-lagi').hidden = semuaUcapan.length <= jumlahTampil;
    };

    $('ucapan-lagi').addEventListener('click', () => {
        jumlahTampil += UCAPAN_PER_HALAMAN;
        tampilkanUcapan();
    });

    const muatUcapan = async () => {
        if (modeContoh) {
            semuaUcapan = contohUcapan.slice();
            tampilkanUcapan();
            return;
        }

        try {
            const res = await fetch(cfg.rsvpUrl);
            const data = await res.json();
            if (!data.ok) {
                throw new Error(data.pesan);
            }
            semuaUcapan = data.ucapan;
            tampilkanUcapan();
        } catch {
            $('daftar-ucapan').replaceChildren(buatElemen('ucapan-kosong', 'Ucapan belum dapat dimuat saat ini.'));
        }
    };

    /* ---------- Formulir RSVP ---------- */

    const form = $('form-rsvp');
    const status = $('rsvp-status');
    $('catatan-contoh').hidden = !modeContoh;

    const setStatus = (teks, galat = false) => {
        status.textContent = teks;
        status.classList.toggle('galat', galat);
    };

    form.addEventListener('change', (e) => {
        if (e.target.name === 'kehadiran') {
            $('baris-jumlah').hidden = e.target.value !== 'Hadir';
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = Object.fromEntries(new FormData(form).entries());
        data.nama = (data.nama || '').trim();
        data.ucapan = (data.ucapan || '').trim();

        if (!data.nama) {
            setStatus('Mohon isi nama Anda.', true);
            $('rsvp-nama').focus();
            return;
        }
        if (!data.kehadiran) {
            setStatus('Mohon pilih status kehadiran Anda.', true);
            form.querySelector('[name="kehadiran"]').focus();
            return;
        }
        data.jumlah = data.kehadiran === 'Hadir' ? Number(data.jumlah) : 0;
        if (kodeTamu) {
            data.kode = kodeTamu;
        }

        const tombol = $('rsvp-kirim');
        tombol.disabled = true;
        setStatus('Mengirim...');

        try {
            if (modeContoh) {
                await new Promise((selesai) => setTimeout(selesai, 500));
            } else {
                const res = await fetch(cfg.rsvpUrl, { method: 'POST', body: JSON.stringify(data) });
                const hasil = await res.json();
                if (!hasil.ok) {
                    throw new Error(hasil.pesan);
                }
            }

            if (data.ucapan) {
                semuaUcapan.unshift({ nama: data.nama, ucapan: data.ucapan, waktu: new Date().toISOString() });
                tampilkanUcapan();
            }

            $('rsvp-ucapan').value = '';
            setStatus(modeContoh
                ? 'Mode contoh: tampilan berhasil, tetapi data belum tersimpan.'
                : 'Terima kasih, konfirmasi Anda sudah kami terima.');
        } catch {
            setStatus('Gagal mengirim. Periksa koneksi Anda, lalu coba lagi.', true);
        } finally {
            tombol.disabled = false;
        }
    });

    /* ---------- Data tamu dari daftar undangan ---------- */

    const muatTamu = async () => {
        if (!kodeDiLink || !cfg.rsvpUrl) {
            return;
        }

        const batal = new AbortController();
        const batasWaktu = setTimeout(() => batal.abort(), 10000);
        try {
            const res = await fetch(`${cfg.rsvpUrl}?k=${encodeURIComponent(kodeDiLink)}`, { signal: batal.signal });
            const data = await res.json();
            if (data.ok && data.tamu) {
                kodeTamu = kodeDiLink;
                if (data.tamu.nama && !namaDiLink) {
                    setNamaTamu(data.tamu.nama);
                }
                if (data.tamu.sesi) {
                    terapkanSesi(data.tamu.sesi);
                }
            }
        } catch {
            // Tanpa data tamu, halaman tetap menampilkan semua sesi.
        } finally {
            clearTimeout(batasWaktu);
            if ($('nama-tamu').textContent === '...') {
                $('nama-tamu').textContent = 'Tamu Undangan';
            }
        }
    };

    muatTamu();
    muatUcapan();

    /* ---------- Layar muat: hilang setelah sampul benar-benar siap ---------- */

    const fotoSampul = document.querySelector('.sampul-foto');
    const fotoSiap = fotoSampul.complete
        ? Promise.resolve()
        : new Promise((siap) => {
            fotoSampul.addEventListener('load', siap, { once: true });
            fotoSampul.addEventListener('error', siap, { once: true });
        });
    const hurufSiap = document.fonts
        ? Promise.all([
            '600 1em Barlow', '400 1em Barlow', '1em Yellowtail',
        ].map((h) => document.fonts.load(h).catch(() => null)))
        : Promise.resolve();

    Promise.race([
        Promise.all([fotoSiap, hurufSiap]),
        new Promise((selesai) => setTimeout(selesai, 5000)),
    ]).then(() => {
        // Halaman lama dari cache mungkin belum punya layar muat.
        const muat = $('muat');
        if (!muat) {
            return;
        }
        muat.classList.add('selesai');
        setTimeout(() => muat.remove(), 600);
    });
})();
