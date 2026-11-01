/* Edulink — semua bab (Bab 1, 2, 3, ...) dibaca dari daftar-bab.json yang diatur lewat panel /admin.
   Dipakai oleh beranda (kartu bab) dan bab.html (halaman bab). */
(function () {
  'use strict';

  function mk(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  function listOf(a) { return Array.isArray(a) ? a : []; }
  function str(v) { return v == null ? '' : String(v).trim(); }
  function absUrl(u) {
    u = str(u); if (!u) return '';
    try { var h = new URL(u, window.location.href).href; return /^https?:\/\//i.test(h) ? h : ''; } catch (e) { return ''; }
  }
  function ytId(u) {
    var m = String(u || '').match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : '';
  }

  /* --- Markdown mini (aman: dibangun lewat DOM, tanpa innerHTML) --- */
  function inline(parent, text) {
    text = String(text)
      .replace(/\\([*_\[\]()#>`~\\-])/g, '$1')
      .replace(/__([^_\n]+)__/g, '**$1**')
      .replace(/(^|[^\w])_([^_\n]+)_(?=[^\w]|$)/g, '$1*$2*');
    text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g).forEach(function (p) {
      if (!p) return;
      var m;
      if ((m = p.match(/^\*\*([^*]+)\*\*$/))) parent.appendChild(mk('strong', '', m[1]));
      else if ((m = p.match(/^\*([^*]+)\*$/))) parent.appendChild(mk('em', '', m[1]));
      else if ((m = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/))) {
        var href = absUrl(m[2]);
        if (href) { var a = mk('a', '', m[1]); a.href = href; a.target = '_blank'; a.rel = 'noopener'; a.style.textDecoration = 'underline'; parent.appendChild(a); }
        else parent.appendChild(document.createTextNode(m[1]));
      } else parent.appendChild(document.createTextNode(p));
    });
  }
  function markdown(text) {
    var frag = document.createDocumentFragment(), lines = String(text || '').replace(/\r/g, '').split('\n');
    var para = [], quote = [], list = null, listType = '';
    function flushPara() { if (para.length) { var p = mk('p'); inline(p, para.join(' ')); frag.appendChild(p); para = []; } }
    function flushQuote() { if (quote.length) { var d = mk('div', 'callout'); inline(d, quote.join(' ')); frag.appendChild(d); quote = []; } }
    function flushList() { list = null; listType = ''; }
    lines.forEach(function (raw) {
      var line = raw.replace(/\s+$/, ''), m;
      if (!line.trim()) { flushPara(); flushQuote(); flushList(); return; }
      if ((m = line.match(/^\s*>\s?(.*)$/))) { flushPara(); flushList(); quote.push(m[1]); return; }
      flushQuote();
      if ((m = line.match(/^(#{1,6})\s+(.*)$/))) {
        flushPara(); flushList();
        var h = mk(m[1].length >= 3 ? 'h4' : 'h3'); inline(h, m[2]); frag.appendChild(h); return;
      }
      if ((m = line.match(/^\s*[-*+]\s+(.*)$/))) {
        flushPara();
        if (listType !== 'ul') { list = mk('ul'); frag.appendChild(list); listType = 'ul'; }
        var li = mk('li'); inline(li, m[1]); list.appendChild(li); return;
      }
      if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
        flushPara();
        if (listType !== 'ol') { list = mk('ol'); frag.appendChild(list); listType = 'ol'; }
        var li2 = mk('li'); inline(li2, m[1]); list.appendChild(li2); return;
      }
      flushList(); para.push(line.trim());
    });
    flushPara(); flushQuote();
    return frag;
  }

  /* --- Pembantu tampilan --- */
  function section(id, eyebrow, title) {
    var s = mk('section'); s.id = id;
    s.appendChild(mk('div', 'eyebrow', eyebrow));
    s.appendChild(mk('h2', '', title));
    return s;
  }
  function linkBlock(heading, items) {
    var rows = listOf(items).map(function (x) {
      return { judul: str(x.judul), ket: str(x.ket), url: absUrl(x.url || x.berkas) };
    }).filter(function (x) { return x.url; });
    if (!rows.length) return null;
    var box = mk('div');
    if (heading) box.appendChild(mk('h3', '', heading));
    rows.forEach(function (x) {
      var row = mk('div', 'extra-item');
      var a = mk('a', 'resource', (x.judul || 'Buka tautan') + ' ↗'); a.href = x.url; a.target = '_blank'; a.rel = 'noopener';
      row.appendChild(a);
      if (x.ket) row.appendChild(mk('span', 'extra-note', x.ket));
      box.appendChild(row);
    });
    return box;
  }
  function loadJSON() {
    return fetch('daftar-bab.json', { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (j) { return listOf(j && j.bab).filter(function (x) { return x && str(x.judul); }); });
  }

  /* --- 1) Beranda: kartu semua bab --- */
  function renderCards(grid) {
    loadJSON().then(function (items) {
      if (!items.length) return;
      grid.textContent = '';
      items.forEach(function (it, i) {
        var n = i + 1;
        var card = mk('div', 'card c' + (((n - 1) % 5) + 1));
        card.appendChild(mk('div', 'num', (n < 10 ? '0' : '') + n));
        card.appendChild(mk('h3', '', str(it.judul)));
        card.appendChild(mk('p', 'desc', str(it.ringkas) || 'Materi, aktivitas, dan latihan.'));
        var a = mk('a', 'btn', 'Masuk Bab ' + n + ' →'); a.href = 'bab.html?b=' + n;
        card.appendChild(a);
        grid.appendChild(card);
      });
    }).catch(function () { /* tetap memakai kartu bawaan */ });
  }

  /* --- 2) Halaman bab.html --- */
  function renderBab(root) {
    var n = parseInt((window.location.search.match(/[?&]b=(\d+)/) || [])[1], 10);
    loadJSON().then(function (items) {
      var it = items[n - 1];
      if (!n || !it) throw new Error('tidak ada');
      build(root, n, it, items);
    }).catch(function () {
      var box = mk('main', 'content');
      box.style.padding = '60px 24px';
      box.appendChild(mk('h1', '', 'Bab tidak ditemukan'));
      var a = mk('a', 'btn', '← Kembali ke beranda'); a.href = 'index.html';
      box.appendChild(a); root.appendChild(box);
    });
  }

  function build(root, n, it, items) {
    var judul = str(it.judul);
    document.title = judul + ' · Edulink Informatika X';
    document.body.setAttribute('data-judul', 'Bab ' + n + ': ' + judul);

    var skip = mk('a', 'skip', 'Lewati ke materi'); skip.href = '#materi'; root.appendChild(skip);

    var head = mk('header', 'subhero');
    var back = mk('a', 'back', '← Kembali ke beranda'); back.href = 'index.html'; head.appendChild(back);
    var eb = mk('div', 'eyebrow', 'BAB ' + n + ' DARI ' + items.length); eb.style.marginTop = '28px'; head.appendChild(eb);
    var h1 = mk('h1', '', judul); h1.style.marginTop = '0'; head.appendChild(h1);
    if (str(it.pengantar)) head.appendChild(mk('p', '', str(it.pengantar)));
    root.appendChild(head);

    var layout = mk('div', 'layout'), side = mk('aside', 'side'), main = mk('main', 'content');
    side.setAttribute('aria-label', 'Daftar kegiatan');
    side.appendChild(mk('b', '', 'DAFTAR KEGIATAN'));
    function addSide(id, label) { var a = mk('a', '', label); a.href = '#' + id; side.appendChild(a); }

    /* Identitas dan tujuan */
    var sId = section('identitas', 'PROFIL PEMBELAJARAN', 'Identitas dan Tujuan Pembelajaran');
    var info1 = mk('p');
    info1.appendChild(mk('b', '', 'Judul bab: ')); info1.appendChild(document.createTextNode(judul));
    if (str(it.mapel)) { info1.appendChild(document.createTextNode(' · ')); info1.appendChild(mk('b', '', 'Mata pelajaran: ')); info1.appendChild(document.createTextNode(str(it.mapel))); }
    if (str(it.kelas)) { info1.appendChild(document.createTextNode(' · ')); info1.appendChild(mk('b', '', 'Kelas: ')); info1.appendChild(document.createTextNode(str(it.kelas))); }
    sId.appendChild(info1);
    var info = mk('p');
    function pair(label, key, cls) {
      info.appendChild(mk('b', '', label + ': '));
      var sp = mk('span', cls || 'ed-empty', 'belum diisi'); if (key) sp.setAttribute('data-ed', key);
      info.appendChild(sp);
    }
    pair('Guru', 'guru'); info.appendChild(document.createTextNode(' · '));
    pair('Sekolah', 'sekolah'); info.appendChild(document.createTextNode(' · '));
    pair('Tahun pelajaran', 'tahun', ''); info.appendChild(document.createTextNode(' · '));
    info.appendChild(mk('b', '', 'Alokasi waktu: '));
    info.appendChild(mk('span', str(it.alokasi) ? '' : 'ed-empty', str(it.alokasi) || 'belum diisi'));
    sId.appendChild(info);
    var tujuan = listOf(it.tujuan).map(function (x) { return typeof x === 'string' ? str(x) : str(x && (x.t || x.judul)); }).filter(Boolean);
    if (tujuan.length) {
      sId.appendChild(mk('h3', '', 'Setelah belajar, kamu mampu:'));
      var ul = mk('ul'); tujuan.forEach(function (t) { ul.appendChild(mk('li', '', t)); }); sId.appendChild(ul);
    }
    if (str(it.kriteria)) {
      var cr = mk('div', 'callout'); cr.appendChild(mk('b', '', 'Kriteria keberhasilan:'));
      cr.appendChild(document.createTextNode(' ' + str(it.kriteria))); sId.appendChild(cr);
    }
    main.appendChild(sId); addSide('identitas', 'Identitas & tujuan');

    /* Pemantik */
    var pem = listOf(it.pemantik).map(function (x) { return typeof x === 'string' ? str(x) : str(x && (x.p || x.judul)); }).filter(Boolean);
    if (pem.length || str(it.pemantik_pengantar)) {
      var sP = section('pemantik', 'MULAI DARI SEKITAR KITA', 'Pemantik / Apersepsi');
      if (str(it.pemantik_pengantar)) sP.appendChild(mk('p', '', str(it.pemantik_pengantar)));
      if (pem.length) { var ol = mk('ol'); pem.forEach(function (t) { ol.appendChild(mk('li', '', t)); }); sP.appendChild(ol); }
      if (str(it.pemantik_catatan)) sP.appendChild(mk('div', 'callout', str(it.pemantik_catatan)));
      main.appendChild(sP); addSide('pemantik', 'Pemantik');
    }

    /* Materi */
    var sM = section('materi', 'RINGKASAN MATERI', judul);
    if (str(it.materi)) sM.appendChild(markdown(it.materi));
    else sM.appendChild(mk('p', 'muted', 'Materi belum diisi.'));
    var lbM = linkBlock('Materi tambahan', it.materi_tautan); if (lbM) sM.appendChild(lbM);
    main.appendChild(sM); addSide('materi', 'Materi');

    /* Video */
    var vids = listOf(it.video).filter(function (v) { return v && ytId(v.youtube); });
    if (vids.length) {
      var sV = section('video', 'VIDEO PEMBELAJARAN', 'Tonton dan pahami');
      vids.forEach(function (v, i) {
        var id = ytId(v.youtube), box = mk('div', 'video-item'), fr = mk('div', 'video-frame');
        var ifr = document.createElement('iframe');
        ifr.src = 'https://www.youtube-nocookie.com/embed/' + id;
        ifr.title = str(v.judul) || ('Video pembelajaran ' + (i + 1));
        ifr.loading = 'lazy'; ifr.allowFullscreen = true;
        ifr.setAttribute('allow', 'accelerometer; encrypted-media; gyroscope; picture-in-picture');
        fr.appendChild(ifr); box.appendChild(fr);
        var meta = mk('p', 'video-meta'); meta.appendChild(mk('strong', '', str(v.judul) || ('Video ' + (i + 1))));
        if (str(v.durasi)) meta.appendChild(document.createTextNode(' · Durasi ' + str(v.durasi)));
        meta.appendChild(document.createTextNode(' · '));
        var a = mk('a', '', 'Buka di YouTube ↗'); a.href = 'https://www.youtube.com/watch?v=' + id;
        a.target = '_blank'; a.rel = 'noopener'; a.style.textDecoration = 'underline';
        meta.appendChild(a); box.appendChild(meta); sV.appendChild(box);
      });
      main.appendChild(sV); addSide('video', 'Video belajar');
    }

    /* Praktik / LKPD */
    var lbP = linkBlock('Lembar kerja dan sumber praktik', it.praktik_tautan);
    if (str(it.praktik) || lbP) {
      var sPr = section('praktik', 'AKTIVITAS PEMBELAJARAN', 'Praktik / LKPD');
      if (str(it.praktik)) { var task = mk('div', 'task'); task.appendChild(markdown(it.praktik)); sPr.appendChild(task); }
      if (lbP) sPr.appendChild(lbP);
      main.appendChild(sPr); addSide('praktik', 'Praktik / LKPD');
    }

    /* Asesmen: kuis + rubrik + tautan */
    var qs = listOf(it.kuis).map(function (q) {
      var opts = [['a', q.opsi_a], ['b', q.opsi_b], ['c', q.opsi_c], ['d', q.opsi_d]]
        .map(function (o) { return [o[0], str(o[1])]; }).filter(function (o) { return o[1]; });
      var key = str(q.jawaban).toLowerCase();
      var ok = str(q.pertanyaan) && opts.length >= 2 && opts.some(function (o) { return o[0] === key; });
      return ok ? { t: str(q.pertanyaan), opts: opts, key: key, ex: str(q.pembahasan) } : null;
    }).filter(Boolean);
    var rubrik = listOf(it.rubrik).filter(function (r) { return r && str(r.aspek); });
    var lbA = linkBlock('Asesmen tambahan', it.asesmen_tautan);
    if (qs.length || rubrik.length || lbA) {
      var sA = section('asesmen', 'UJI PEMAHAMAN', qs.length ? 'Kuis ' + judul : 'Asesmen');
      if (qs.length) {
        var form = mk('form'); form.id = 'quiz'; form.setAttribute('novalidate', '');
        qs.forEach(function (q, i) {
          var fs = mk('fieldset', 'quiz-q'); fs.setAttribute('data-answer', q.key);
          fs.appendChild(mk('legend', '', (i + 1) + '. ' + q.t));
          q.opts.forEach(function (o) {
            var lb = document.createElement('label'), inp = document.createElement('input');
            inp.type = 'radio'; inp.name = 'q' + (i + 1); inp.value = o[0];
            lb.appendChild(inp); lb.appendChild(document.createTextNode(' ')); lb.appendChild(mk('span', '', o[1]));
            fs.appendChild(lb);
          });
          if (q.ex) { var ex = mk('p', 'explain', q.ex); ex.hidden = true; fs.appendChild(ex); }
          form.appendChild(fs);
        });
        var act = mk('div', 'quiz-actions');
        var sub = mk('button', 'btn', 'Periksa Jawaban →'); sub.type = 'submit';
        var rst = mk('button', 'btn btn-ghost', 'Ulangi Kuis'); rst.type = 'reset'; rst.id = 'quizReset'; rst.hidden = true;
        act.appendChild(sub); act.appendChild(rst); form.appendChild(act);
        var res = mk('div', 'quiz-result'); res.id = 'result'; res.setAttribute('role', 'status'); res.setAttribute('aria-live', 'polite');
        form.appendChild(res); sA.appendChild(form);
        sA.appendChild(mk('p', 'muted small-note', 'Kuis berjalan di browser dan belum menyimpan nilai ke server.'));
      }
      if (rubrik.length) {
        sA.appendChild(mk('h3', '', 'Rubrik Penilaian LKPD'));
        var wrap = mk('div', 'table-scroll'), tbl = mk('table', 'rubrik');
        var thead = mk('thead'), hr = mk('tr');
        ['Aspek', '4 · Sangat baik', '3 · Baik', '2 · Cukup', '1 · Perlu bimbingan'].forEach(function (h) { hr.appendChild(mk('th', '', h)); });
        thead.appendChild(hr); tbl.appendChild(thead);
        var tb = mk('tbody');
        rubrik.forEach(function (r) {
          var tr = mk('tr');
          [r.aspek, r.s4, r.s3, r.s2, r.s1].forEach(function (c) { tr.appendChild(mk('td', '', str(c))); });
          tb.appendChild(tr);
        });
        tbl.appendChild(tb); wrap.appendChild(tbl); sA.appendChild(wrap);
        if (str(it.rubrik_catatan)) sA.appendChild(mk('p', 'muted', str(it.rubrik_catatan)));
      }
      if (lbA) sA.appendChild(lbA);
      main.appendChild(sA); addSide('asesmen', 'Asesmen');
    }

    /* Refleksi */
    var sR = section('refleksi', 'PENUTUP', 'Refleksi Belajar');
    var rf = mk('div', 'reflect');
    [['Hal baru yang saya pahami adalah ...', 'r1'], ['Bagian yang masih perlu saya pelajari adalah ...', 'r2'], ['Penerapan materi ini dalam kehidupan saya adalah ...', 'r3']].forEach(function (r) {
      var lb = mk('label', '', r[0]); lb.setAttribute('for', r[1]);
      var ta = document.createElement('textarea'); ta.id = r[1]; ta.rows = 3; ta.setAttribute('data-save', 'bab' + n + '-' + r[1]);
      rf.appendChild(lb); rf.appendChild(ta);
    });
    var qa = mk('div', 'quiz-actions'), pb = mk('button', 'btn btn-dark', 'Cetak / simpan PDF'); pb.type = 'button'; pb.id = 'printBtn';
    qa.appendChild(pb); rf.appendChild(qa);
    rf.appendChild(mk('p', 'muted small-note', 'Tulisanmu tersimpan otomatis di browser ini saja (tidak dikirim ke server).'));
    sR.appendChild(rf); main.appendChild(sR); addSide('refleksi', 'Refleksi');

    /* Tanya guru (diisi oleh script.js) */
    var sT = section('tanya', 'BUTUH BANTUAN?', 'Tanya Guru');
    sT.appendChild(mk('p', '', 'Ada materi yang belum dipahami? Tuliskan pertanyaanmu lewat salah satu tautan berikut.'));
    var ag = mk('div', 'ask-grid'); ag.id = 'tanyaLinks';
    ag.appendChild(mk('p', 'muted', 'Kanal tanya jawab akan segera tersedia.'));
    sT.appendChild(ag); main.appendChild(sT); addSide('tanya', 'Tanya Guru');

    /* Navigasi antarbab */
    var pager = mk('nav', 'pager'); pager.setAttribute('aria-label', 'Navigasi bab');
    var prev = mk('a', 'prev');
    if (n === 1) {
      prev.href = 'index.html'; prev.appendChild(mk('span', '', '← Beranda')); prev.appendChild(mk('strong', '', 'Daftar semua bab'));
    } else {
      prev.href = 'bab.html?b=' + (n - 1); prev.appendChild(mk('span', '', '← Bab sebelumnya')); prev.appendChild(mk('strong', '', str(items[n - 2].judul)));
    }
    pager.appendChild(prev);
    var nx = items[n], next = mk('a', 'next');
    if (nx) {
      next.href = 'bab.html?b=' + (n + 1); next.appendChild(mk('span', '', 'Bab berikutnya →')); next.appendChild(mk('strong', '', str(nx.judul)));
    } else {
      next.href = 'index.html'; next.appendChild(mk('span', '', 'Selesai →')); next.appendChild(mk('strong', '', 'Kembali ke beranda'));
    }
    pager.appendChild(next); main.appendChild(pager);

    layout.appendChild(side); layout.appendChild(main); root.appendChild(layout);
    var foot = mk('footer'); var fa = mk('a', '', '⌘ EDULINK / INFORMATIKA X'); fa.href = 'index.html';
    foot.appendChild(fa); foot.appendChild(mk('span', '', judul)); root.appendChild(foot);

    /* Setelah halaman terbentuk, jalankan script.js (kuis, refleksi, sidebar, identitas, Tanya Guru) */
    var s = document.createElement('script'); s.src = 'script.js'; document.body.appendChild(s);
  }

  if (!window.fetch) return;
  var grid = document.getElementById('babGrid');
  if (grid) renderCards(grid);
  var root = document.getElementById('babDinamis');
  if (root) renderBab(root);
})();
