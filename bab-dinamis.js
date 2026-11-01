/* Edulink — bab tambahan (Bab 6, 7, ...) yang diatur dari panel /admin.
   Data: data/bab-tambahan.json. Dipakai oleh beranda (kartu bab) dan bab.html (halaman bab). */
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
    String(text).split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g).forEach(function (p) {
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
    var para = [], list = null, listType = '';
    function flushPara() { if (para.length) { var p = mk('p'); inline(p, para.join(' ')); frag.appendChild(p); para = []; } }
    function flushList() { list = null; listType = ''; }
    lines.forEach(function (raw) {
      var line = raw.replace(/\s+$/, ''), m;
      if (!line.trim()) { flushPara(); flushList(); return; }
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
    flushPara();
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
    return fetch('bab-tambahan.json', { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (j) { return listOf(j && j.bab); });
  }

  /* --- 1) Beranda: kartu bab tambahan --- */
  function renderCards(grid) {
    loadJSON().then(function (items) {
      var shown = 0;
      items.forEach(function (it, i) {
        if (!str(it.judul)) return;
        var n = i + 6;
        var card = mk('div', 'card c' + (((n - 1) % 5) + 1));
        card.appendChild(mk('div', 'num', (n < 10 ? '0' : '') + n));
        card.appendChild(mk('h3', '', str(it.judul)));
        card.appendChild(mk('p', 'desc', str(it.ringkas) || 'Materi, aktivitas, dan latihan.'));
        var a = mk('a', 'btn', 'Masuk Bab ' + n + ' →'); a.href = 'bab.html?b=' + n;
        card.appendChild(a);
        grid.appendChild(card); shown++;
      });
      if (shown) grid.style.marginTop = '22px';
    }).catch(function () { /* tidak ada bab tambahan */ });
  }

  /* --- 2) Halaman bab.html --- */
  function renderBab(root) {
    var n = parseInt((window.location.search.match(/[?&]b=(\d+)/) || [])[1], 10);
    loadJSON().then(function (items) {
      var it = items[n - 6];
      if (!n || n < 6 || !it || !str(it.judul)) throw new Error('tidak ada');
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
    var eb = mk('div', 'eyebrow', 'BAB ' + n); eb.style.marginTop = '28px'; head.appendChild(eb);
    var h1 = mk('h1', '', judul); h1.style.marginTop = '0'; head.appendChild(h1);
    if (str(it.ringkas)) head.appendChild(mk('p', '', str(it.ringkas)));
    root.appendChild(head);

    var layout = mk('div', 'layout'), side = mk('aside', 'side'), main = mk('main', 'content');
    side.setAttribute('aria-label', 'Daftar kegiatan');
    side.appendChild(mk('b', '', 'DAFTAR KEGIATAN'));
    function addSide(id, label) { var a = mk('a', '', label); a.href = '#' + id; side.appendChild(a); }

    /* Identitas dan tujuan */
    var sId = section('identitas', 'PROFIL PEMBELAJARAN', 'Identitas dan Tujuan Pembelajaran');
    var info = mk('p');
    function pair(label, key, cls) {
      var b = mk('b', '', label + ': '); info.appendChild(b);
      var sp = mk('span', cls || 'ed-empty', 'belum diisi'); if (key) sp.setAttribute('data-ed', key);
      info.appendChild(sp);
    }
    pair('Guru', 'guru'); info.appendChild(document.createTextNode(' · '));
    pair('Sekolah', 'sekolah'); info.appendChild(document.createTextNode(' · '));
    pair('Tahun pelajaran', 'tahun', ''); info.appendChild(document.createTextNode(' · '));
    var bA = mk('b', '', 'Alokasi waktu: '); info.appendChild(bA);
    info.appendChild(mk('span', str(it.alokasi) ? '' : 'ed-empty', str(it.alokasi) || 'belum diisi'));
    sId.appendChild(info);
    var tujuan = listOf(it.tujuan).map(str).filter(Boolean);
    if (tujuan.length) {
      sId.appendChild(mk('h3', '', 'Setelah belajar, kamu mampu:'));
      var ul = mk('ul'); tujuan.forEach(function (t) { ul.appendChild(mk('li', '', t)); }); sId.appendChild(ul);
    }
    main.appendChild(sId); addSide('identitas', 'Identitas & tujuan');

    /* Pemantik */
    var pem = listOf(it.pemantik).map(function (x) { return typeof x === 'string' ? str(x) : str(x && x.judul); }).filter(Boolean);
    if (pem.length) {
      var sP = section('pemantik', 'MULAI DARI SEKITAR KITA', 'Pemantik / Apersepsi');
      var ol = mk('ol'); pem.forEach(function (t) { ol.appendChild(mk('li', '', t)); }); sP.appendChild(ol);
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

    /* Asesmen: kuis + tautan */
    var qs = listOf(it.kuis).map(function (q) {
      var opts = [['a', q.opsi_a], ['b', q.opsi_b], ['c', q.opsi_c], ['d', q.opsi_d]]
        .map(function (o) { return [o[0], str(o[1])]; }).filter(function (o) { return o[1]; });
      var key = str(q.jawaban).toLowerCase();
      var ok = str(q.pertanyaan) && opts.length >= 2 && opts.some(function (o) { return o[0] === key; });
      return ok ? { t: str(q.pertanyaan), opts: opts, key: key, ex: str(q.pembahasan) } : null;
    }).filter(Boolean);
    var lbA = linkBlock('Asesmen tambahan', it.asesmen_tautan);
    if (qs.length || lbA) {
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
    var prev = mk('a', 'prev'); prev.href = n === 6 ? 'bab5.html' : 'bab.html?b=' + (n - 1);
    prev.appendChild(mk('span', '', '← Bab sebelumnya'));
    prev.appendChild(mk('strong', '', n === 6 ? 'Jaringan Komputer dan Internet' : str(items[n - 7] && items[n - 7].judul) || ('Bab ' + (n - 1))));
    pager.appendChild(prev);
    var nx = items[n - 5], next = mk('a', 'next');
    if (nx && str(nx.judul)) {
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
  var grid = document.getElementById('babTambahanGrid');
  if (grid) renderCards(grid);
  var root = document.getElementById('babDinamis');
  if (root) renderBab(root);
})();
