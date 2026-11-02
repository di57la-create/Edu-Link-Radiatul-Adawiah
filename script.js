/* Edulink Informatika X — script.js
   1) Menu mobile  2) Kuis  3) Refleksi (simpan otomatis)  4) Sidebar aktif */
(function () {
  'use strict';

  /* 1. Menu mobile */
  var toggle = document.getElementById('menuToggle');
  var links = document.getElementById('navLinks');
  if (toggle && links) {
    var setOpen = function (open) {
      links.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
    };
    toggle.addEventListener('click', function () { setOpen(!links.classList.contains('open')); });
    links.addEventListener('click', function (e) { if (e.target.tagName === 'A') setOpen(false); });
  }

  /* 2. Kuis: kunci ada di atribut data-answer pada setiap <fieldset class="quiz-q"> */
  var form = document.getElementById('quiz');
  if (form) {
    var result = document.getElementById('result');
    var resetBtn = document.getElementById('quizReset');
    var questions = Array.prototype.slice.call(form.querySelectorAll('.quiz-q'));

    var clearMarks = function () {
      questions.forEach(function (q) {
        q.classList.remove('correct', 'wrong', 'unanswered');
        q.querySelectorAll('label').forEach(function (l) { l.classList.remove('is-correct', 'is-wrong'); });
        var ex = q.querySelector('.explain');
        if (ex) { ex.hidden = true; ex.textContent = ex.getAttribute('data-text') || ex.textContent; }
      });
    };

    questions.forEach(function (q) {
      var ex = q.querySelector('.explain');
      if (ex) ex.setAttribute('data-text', ex.textContent);
      q.addEventListener('change', function () { q.classList.remove('unanswered'); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearMarks();
      result.classList.remove('warn');

      var missing = questions.filter(function (q) { return !q.querySelector('input:checked'); });
      if (missing.length) {
        missing.forEach(function (q) { q.classList.add('unanswered'); });
        var nums = missing.map(function (q) { return questions.indexOf(q) + 1; }).join(', ');
        result.classList.add('warn');
        result.textContent = 'Masih ada soal yang belum dijawab: nomor ' + nums + '.';
        missing[0].querySelector('input').focus();
        return;
      }

      var score = 0;
      questions.forEach(function (q) {
        var key = q.getAttribute('data-answer');
        var chosen = q.querySelector('input:checked');
        var right = q.querySelector('input[value="' + key + '"]');
        var ex = q.querySelector('.explain');
        var ok = chosen.value === key;
        if (ok) score++;
        q.classList.add(ok ? 'correct' : 'wrong');
        right.parentNode.classList.add('is-correct');
        if (!ok) chosen.parentNode.classList.add('is-wrong');
        if (ex) {
          var text = ex.getAttribute('data-text');
          ex.textContent = '';
          var tag = document.createElement('span');
          tag.className = ok ? 'tag-ok' : 'tag-bad';
          tag.textContent = ok ? '✓ Benar. ' : '✗ Kurang tepat. ';
          ex.appendChild(tag);
          ex.appendChild(document.createTextNode(text));
          ex.hidden = false;
        }
      });

      var total = questions.length;
      var msg = score === total ? 'Hebat! Semua jawaban tepat.'
        : score >= Math.ceil(total * 0.6) ? 'Cukup baik. Baca pembahasan pada soal yang salah, lalu coba lagi.'
        : 'Pelajari kembali materinya, lalu coba lagi.';
      result.textContent = 'Nilai: ' + score + '/' + total + ' benar. ' + msg;
      if (resetBtn) resetBtn.hidden = false;
    });

    form.addEventListener('reset', function () {
      clearMarks();
      result.textContent = '';
      result.classList.remove('warn');
      if (resetBtn) resetBtn.hidden = true;
    });
  }

  /* 3. Refleksi: tersimpan otomatis di browser ini (localStorage) */
  var fields = document.querySelectorAll('textarea[data-save]');
  var store = null;
  try { store = window.localStorage; store.getItem('x'); } catch (err) { store = null; }
  fields.forEach(function (f) {
    var k = 'edulink:' + f.getAttribute('data-save');
    if (store) {
      var saved = store.getItem(k);
      if (saved) f.value = saved;
      f.addEventListener('input', function () { try { store.setItem(k, f.value); } catch (err) {} });
    }
  });
  var printBtn = document.getElementById('printBtn');
  if (printBtn) printBtn.addEventListener('click', function () { window.print(); });

  /* 4. Sidebar: tandai bagian yang sedang dibaca */
  var side = document.querySelectorAll('.side a[href^="#"]');
  if (side.length && 'IntersectionObserver' in window) {
    var map = {};
    side.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          side.forEach(function (a) { a.classList.remove('active'); a.removeAttribute('aria-current'); });
          var a = map[en.target.id];
          if (a) { a.classList.add('active'); a.setAttribute('aria-current', 'true'); }
        }
      });
    }, { rootMargin: '-20% 0px -65% 0px' });
    Object.keys(map).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) io.observe(s);
    });
  }

  /* 5. Pengaturan guru: pengaturan.js (cadangan) + Google Sheet (jika sheetUrl diisi) */
  var baseCfg = window.EDULINK || {};
  var babNo = document.body.getAttribute('data-bab');
  var safeUrl = function (u) { return /^https?:\/\//i.test(String(u || '').trim()) ? String(u).trim() : ''; };
  var ytId = function (u) {
    var m = String(u || '').match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : '';
  };
  var $ = function (id) { return document.getElementById(id); };

  /* simpan isi awal (cadangan) agar bisa dirender ulang */
  var vl = $('videoList'), tl = $('tanyaLinks');
  var vlInit = vl ? vl.innerHTML : '', tlInit = tl ? tl.innerHTML : '';

  function mk(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  function linkBtn(label, href) {
    var a = mk('a', 'resource', label + ' ↗'); a.href = href; a.target = '_blank'; a.rel = 'noopener'; return a;
  }

  function render(cfg) {
    var babCfg = (cfg.bab && babNo && cfg.bab[babNo]) || {};
    var extra = (cfg.extra && babNo && cfg.extra[babNo]) || {};

    /* identitas */
    document.querySelectorAll('[data-ed]').forEach(function (el) {
      var k = el.getAttribute('data-ed');
      var v = k === 'alokasi' ? babCfg.alokasi : cfg[k];
      if (v) { el.textContent = v; el.classList.remove('ed-empty'); }
    });

    /* video */
    if (vl) {
      vl.innerHTML = vlInit;
      var vids = (babCfg.video || []).filter(function (v) { return ytId(v.youtube); });
      if (vids.length) {
        vl.textContent = '';
        vids.forEach(function (v, i) {
          var id = ytId(v.youtube);
          var box = mk('div', 'video-item'), fr = mk('div', 'video-frame');
          var ifr = document.createElement('iframe');
          ifr.src = 'https://www.youtube-nocookie.com/embed/' + id;
          ifr.title = v.judul || ('Video pembelajaran ' + (i + 1));
          ifr.loading = 'lazy'; ifr.allowFullscreen = true;
          ifr.setAttribute('allow', 'accelerometer; encrypted-media; gyroscope; picture-in-picture');
          fr.appendChild(ifr); box.appendChild(fr);
          var meta = mk('p', 'video-meta'), st = mk('strong', '', v.judul || ('Video ' + (i + 1)));
          meta.appendChild(st);
          if (v.durasi) meta.appendChild(document.createTextNode(' · Durasi ' + v.durasi));
          meta.appendChild(document.createTextNode(' · '));
          var a = mk('a', '', 'Buka di YouTube ↗'); a.href = 'https://www.youtube.com/watch?v=' + id;
          a.target = '_blank'; a.rel = 'noopener'; a.style.textDecoration = 'underline';
          meta.appendChild(a); box.appendChild(meta); vl.appendChild(box);
        });
      }
    }

    /* tautan tambahan: materi, praktik, asesmen; pertanyaan pemantik tambahan */
    [['materiExtra', 'materi', 'Materi tambahan'], ['praktikExtra', 'praktik', 'Lembar kerja dan sumber praktik'], ['asesmenExtra', 'asesmen', 'Asesmen tambahan']].forEach(function (c) {
      var box = $(c[0]); if (!box) return;
      box.textContent = '';
      var items = (extra[c[1]] || []).filter(function (x) { return safeUrl(x.url); });
      if (!items.length) return;
      box.appendChild(mk('h3', '', c[2]));
      items.forEach(function (x) {
        var row = mk('div', 'extra-item');
        row.appendChild(linkBtn(x.judul || 'Buka tautan', safeUrl(x.url)));
        if (x.ket) row.appendChild(mk('span', 'extra-note', x.ket));
        box.appendChild(row);
      });
    });
    var pb = $('pemantikExtra');
    if (pb) {
      pb.textContent = '';
      var qs = (extra.pemantik || []).filter(function (x) { return x.judul; });
      if (qs.length) {
        var ul = document.createElement('ul');
        qs.forEach(function (x) { ul.appendChild(mk('li', '', x.judul)); });
        pb.appendChild(ul);
      }
    }

    /* Tanya Guru */
    if (tl) {
      tl.innerHTML = tlInit;
      var tg = cfg.tanyaGuru || {}, items2 = [];
      var pesanDasar = document.body.getAttribute('data-judul');
      var pesan = pesanDasar ? 'Halo Bapak/Ibu, saya ingin bertanya tentang ' + pesanDasar + '.' : 'Halo Bapak/Ibu, saya ingin bertanya tentang pelajaran Informatika.';
      if (Array.isArray(tg.daftar)) {
        /* daftar kontak dari panel admin: tiap kontak bisa dinonaktifkan */
        tg.daftar.forEach(function (k) {
          if (!k || k.aktif === false) return;
          var jenis = String(k.jenis || '').toLowerCase(), val = String(k.tautan || '').trim();
          if (!val) return;
          var judulK = String(k.judul || '').trim(), ketK = String(k.ket || '').trim(), href = '';
          if (jenis === 'whatsapp') {
            var nomor = val.replace(/\D/g, '');
            if (!nomor) return;
            if (nomor.charAt(0) === '0') nomor = '62' + nomor.slice(1);
            href = 'https://wa.me/' + nomor + '?text=' + encodeURIComponent(pesan);
            judulK = judulK || 'Tanya via WhatsApp'; ketK = ketK || 'Kirim pertanyaan langsung ke guru';
          } else if (jenis === 'email') {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return;
            href = 'mailto:' + val;
            judulK = judulK || 'Kirim email'; ketK = ketK || val;
          } else {
            href = safeUrl(val);
            judulK = judulK || 'Buka tautan'; ketK = ketK || 'Tanya jawab dan diskusi';
          }
          if (href) items2.push([judulK, ketK, href]);
        });
      } else {
        var wa = String(tg.whatsapp || '').replace(/\D/g, '');
        if (wa) {
          if (wa.charAt(0) === '0') wa = '62' + wa.slice(1);
          items2.push(['Tanya via WhatsApp', 'Kirim pertanyaan langsung ke guru', 'https://wa.me/' + wa + '?text=' + encodeURIComponent(pesan)]);
        }
        if (safeUrl(tg.form)) items2.push(['Isi Formulir Pertanyaan', 'Google Form tanya jawab', safeUrl(tg.form)]);
        if (safeUrl(tg.padlet)) items2.push(['Forum Diskusi (Padlet)', 'Lihat dan tulis pertanyaan bersama', safeUrl(tg.padlet)]);
      }
      if (items2.length) {
        tl.textContent = '';
        items2.forEach(function (it) {
          var a = mk('a', '', it[0]); a.href = it[2]; a.target = '_blank'; a.rel = 'noopener';
          a.appendChild(mk('span', '', it[1])); tl.appendChild(a);
        });
      }
    }
  }

  /* --- Google Sheet: parser CSV + penggabungan --- */
  function parseCSV(text) {
    var rows = [], row = [], f = '', q = false, i = 0, c;
    text = text.replace(/^\uFEFF/, '');
    for (; i < text.length; i++) {
      c = text.charAt(i);
      if (q) {
        if (c === '"') { if (text.charAt(i + 1) === '"') { f += '"'; i++; } else q = false; }
        else f += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(f); f = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text.charAt(i + 1) === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
      else f += c;
    }
    if (f !== '' || row.length) { row.push(f); rows.push(row); }
    return rows;
  }

  function mergeSheet(base, table) {
    if (!table.length) return base;
    var head = table[0].map(function (h) { return h.trim().toLowerCase(); });
    var col = function (n) { return head.indexOf(n); };
    var cB = col('bab'), cJ = col('jenis'), cT = col('judul'), cK = col('keterangan'), cU = col('tautan');
    if (cJ < 0) return base;
    var c = JSON.parse(JSON.stringify(base));
    c.bab = c.bab || {}; c.tanyaGuru = c.tanyaGuru || {}; c.extra = {};
    var vidReset = {};
    var get = function (r, i) { return i >= 0 && r[i] !== undefined ? String(r[i]).trim() : ''; };
    table.slice(1).forEach(function (r) {
      var jenis = get(r, cJ).toLowerCase(), bab = parseInt(get(r, cB), 10);
      var judul = get(r, cT), ket = get(r, cK), url = get(r, cU);
      if (!jenis) return;
      if (!bab) {
        if (jenis === 'guru' || jenis === 'sekolah' || jenis === 'tahun') { if (judul) c[jenis] = judul; }
        else if (jenis === 'whatsapp') { if (judul || url) c.tanyaGuru.whatsapp = judul || url; }
        else if (jenis === 'form' || jenis === 'padlet') { if (url) c.tanyaGuru[jenis] = url; }
        return;
      }
      var b = c.bab[bab] = c.bab[bab] || {};
      var ex = c.extra[bab] = c.extra[bab] || { materi: [], praktik: [], asesmen: [], pemantik: [] };
      if (jenis === 'alokasi') { if (judul) b.alokasi = judul; }
      else if (jenis === 'video') {
        if (!vidReset[bab]) { b.video = []; vidReset[bab] = true; }
        if (url) b.video.push({ judul: judul, durasi: ket, youtube: url });
      }
      else if (jenis === 'materi' || jenis === 'praktik' || jenis === 'asesmen') { if (url) ex[jenis].push({ judul: judul, ket: ket, url: url }); }
      else if (jenis === 'pemantik') { if (judul) ex.pemantik.push({ judul: judul }); }
    });
    return c;
  }

  render(baseCfg);   /* tampil langsung dari pengaturan.js */

  /* --- Panel admin (/admin): data dari folder data/*.json --- */
  function getJSON(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }
  function absUrl(u) {
    u = String(u || '').trim();
    if (!u) return '';
    try { return new URL(u, window.location.href).href; } catch (e) { return ''; }
  }
  function listOf(a) { return Array.isArray(a) ? a : []; }
  function linkItems(a) {
    return listOf(a).map(function (x) {
      return { judul: x.judul || '', ket: x.ket || '', url: absUrl(x.url || x.berkas) };
    });
  }

  function loadAdminData() {
    if (!window.fetch) return Promise.resolve(baseCfg);
    var jobs = [getJSON('umum.json').catch(function () { return null; })];
    if (babNo) jobs.push(getJSON('bab' + babNo + '.json').catch(function () { return null; }));
    return Promise.all(jobs).then(function (res) {
      var u = res[0], b = res[1];
      if (!u && !b) return baseCfg;
      var c = JSON.parse(JSON.stringify(baseCfg));
      c.bab = c.bab || {}; c.tanyaGuru = c.tanyaGuru || {}; c.extra = c.extra || {};
      if (u) {
        ['guru', 'sekolah', 'tahun'].forEach(function (k) { if (u[k]) c[k] = String(u[k]).trim(); });
        ['whatsapp', 'form', 'padlet'].forEach(function (k) { if (u[k]) c.tanyaGuru[k] = String(u[k]).trim(); });
        if (Array.isArray(u.kontak)) c.tanyaGuru = { daftar: u.kontak };
      }
      if (b && babNo) {
        var bb = c.bab[babNo] = c.bab[babNo] || {};
        if (b.alokasi) bb.alokasi = String(b.alokasi).trim();
        var vids = listOf(b.video).filter(function (v) { return v && v.youtube; })
          .map(function (v) { return { judul: v.judul || '', durasi: v.durasi || '', youtube: v.youtube }; });
        if (vids.length) bb.video = vids;
        c.extra[babNo] = {
          materi: linkItems(b.materi),
          praktik: linkItems(b.praktik),
          asesmen: linkItems(b.asesmen),
          pemantik: listOf(b.pemantik).filter(function (x) { return x && x.judul; })
        };
      }
      return c;
    });
  }

  loadAdminData().then(function (cfg) {
    render(cfg);
    /* Google Sheet (opsional, hanya jika sheetUrl diisi di pengaturan.js) */
    var sheetUrl = safeUrl(baseCfg.sheetUrl);
    if (sheetUrl && window.fetch) {
      if (/\/pubhtml/.test(sheetUrl)) sheetUrl = sheetUrl.replace('/pubhtml', '/pub');
      if (!/output=csv/.test(sheetUrl)) sheetUrl += (sheetUrl.indexOf('?') > -1 ? '&' : '?') + 'output=csv';
      fetch(sheetUrl).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
        .then(function (t) { render(mergeSheet(cfg, parseCSV(t))); })
        .catch(function (e) { if (window.console) console.warn('Edulink: Google Sheet tidak terbaca.', e); });
    }
  });
})();
