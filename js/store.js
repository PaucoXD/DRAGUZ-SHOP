/* Capa de datos. Modo DEMO (localStorage) si no hay Firebase configurado; si no, Firebase Auth + Firestore. */
window.DB = (function () {
  const CFG = window.DRAGUZ_CONFIG || {};
  const live = !!(CFG.firebase && CFG.firebase.apiKey);
  const clone = o => JSON.parse(JSON.stringify(o));
  const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const listeners = [];
  const notify = (u, a, pending) => listeners.forEach(f => f(u, a, !!pending));
  const COLS = ['catalog', 'extras', 'stock', 'quotes', 'testimonials', 'faqs', 'gallery'];

  const api = { mode: live ? 'firebase' : 'demo', onAuth(f) { listeners.push(f); } };

  api.friendlyError = function (e) {
    const c = (e && (e.code || '')) + '';
    const m = {
      'auth/invalid-credential': 'Correo o contraseña incorrectos.', 'auth/wrong-password': 'Correo o contraseña incorrectos.',
      'auth/user-not-found': 'Correo o contraseña incorrectos.', 'auth/email-already-in-use': 'Ese correo ya tiene una cuenta.',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.', 'auth/invalid-email': 'Escribe un correo válido.',
      'auth/popup-closed-by-user': 'Cerraste la ventana de Google.', 'auth/unauthorized-domain': 'Este dominio no está autorizado en Firebase Auth.',
      'permission-denied': 'Sin permisos: revisa las reglas de Firestore.', 'auth/too-many-requests': 'Demasiados intentos. Espera un momento.'
    };
    return m[c] || (e && e.message) || 'Ocurrió un error.';
  };

  /* ───────────── MODO DEMO ───────────── */
  if (!live) {
    const get = k => { try { return JSON.parse(localStorage.getItem('dz_' + k)); } catch (e) { return null; } };
    const set = (k, v) => localStorage.setItem('dz_' + k, JSON.stringify(v));
    const cur = () => get('user');
    const login = (email, name) => {
      const u = { uid: 'demo-' + email, email, name: name || email.split('@')[0], admin: /^admin@/i.test(email) };
      set('user', u); notify({ uid: u.uid, email: u.email, name: u.name }, u.admin); return u;
    };
    Object.assign(api, {
      async init() { const u = cur(); notify(u ? { uid: u.uid, email: u.email, name: u.name } : null, !!(u && u.admin)); },
      async signIn(email) { if (!email) throw new Error('Escribe tu correo.'); return login(email); },
      async signUp(email, pw, name) { if (!email) throw new Error('Escribe tu correo.'); return login(email, name); },
      async signInGoogle() { return login('cliente@google.demo', 'Cliente Google'); },
      async signOut() { localStorage.removeItem('dz_user'); notify(null, false); },
      async list(col, opt) {
        opt = opt || {};
        let arr = get(col);
        if (arr === null) { arr = COLS.includes(col) && window.SEED[col] ? clone(window.SEED[col]) : []; set(col, arr); }
        if (col === 'quotes' && opt.mine) { const u = cur(); arr = arr.filter(q => u && q.uid === u.uid); }
        return clone(arr);
      },
      async save(col, obj) {
        let arr = get(col); if (arr === null) arr = COLS.includes(col) && window.SEED[col] ? clone(window.SEED[col]) : [];
        obj = clone(obj); if (!obj.id) obj.id = rid();
        const i = arr.findIndex(x => x.id === obj.id); if (i >= 0) arr[i] = obj; else arr.push(obj);
        set(col, arr); return obj.id;
      },
      async get(col, id) { const x = (await api.list(col)).find(o => o.id === id); return x || null; },
      async remove(col, id) { set(col, (get(col) || []).filter(x => x.id !== id)); },
      async getSettings() { return Object.assign({}, clone(window.SEED.settings), get('settings') || {}); },
      async saveSettings(s) { set('settings', s); },
      async seed(cols) { (cols || ['catalog', 'extras', 'stock']).forEach(c => set(c, clone(window.SEED[c]))); },
      async reset() { Object.keys(localStorage).filter(k => k.startsWith('dz_')).forEach(k => localStorage.removeItem(k)); }
    });
    return api;
  }

  /* ───────────── FIREBASE ───────────── */
  let auth, fs, ready;
  const V = '10.12.4', base = 'https://www.gstatic.com/firebasejs/' + V + '/';
  const loadScript = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('No se pudo cargar Firebase (' + src + ')')); document.head.appendChild(s); });
  const strip = o => JSON.parse(JSON.stringify(o));

  Object.assign(api, {
    init() {
      if (ready) return ready;
      ready = (async () => {
        await loadScript(base + 'firebase-app-compat.js');
        await Promise.all([loadScript(base + 'firebase-auth-compat.js'), loadScript(base + 'firebase-firestore-compat.js')]);
        firebase.initializeApp(CFG.firebase);
        auth = firebase.auth(); fs = firebase.firestore();
        await new Promise(resolve => {
          let first = true;
          auth.onAuthStateChanged(async u => {
            const user = u ? { uid: u.uid, email: u.email, name: u.displayName || (u.email || '').split('@')[0] } : null;
            // Mostrar la sesión de inmediato; la revisión de admin llega después
            notify(user, false, !!u);
            if (first) { first = false; resolve(); }
            if (!u) return;
            try {
              const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000));
              const admin = (await Promise.race([fs.doc('admins/' + u.uid).get(), timeout])).exists;
              if (auth.currentUser && auth.currentUser.uid === u.uid) notify(user, admin);
            } catch (e) {
              console.warn('No se pudo verificar si eres admin:', e);
              if (auth.currentUser && auth.currentUser.uid === u.uid) notify(user, false);
            }
          });
        });
      })();
      return ready;
    },
    async signIn(email, pw) { await auth.signInWithEmailAndPassword(email, pw); },
    async signUp(email, pw, name) {
      const r = await auth.createUserWithEmailAndPassword(email, pw);
      if (name) { await r.user.updateProfile({ displayName: name }); notify({ uid: r.user.uid, email: r.user.email, name: name }, false); }
    },
    async signInGoogle() { await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); },
    async signOut() { await auth.signOut(); },
    async list(col, opt) {
      opt = opt || {};
      let ref = fs.collection(col);
      if (col === 'quotes' && opt.mine) ref = ref.where('uid', '==', auth.currentUser.uid);
      const snap = await ref.get();
      return snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
    },
    async save(col, obj) {
      const id = obj.id; const data = strip(obj); delete data.id;
      if (id) { await fs.collection(col).doc(id).set(data); return id; }
      return (await fs.collection(col).add(data)).id;
    },
    async get(col, id) { const d = await fs.collection(col).doc(id).get(); return d.exists ? Object.assign({ id: d.id }, d.data()) : null; },
    async remove(col, id) { await fs.collection(col).doc(id).delete(); },
    async getSettings() {
      let s = {}; try { const d = await fs.doc('settings/main').get(); if (d.exists) s = d.data(); } catch (e) { }
      return Object.assign({}, clone(window.SEED.settings), s);
    },
    async saveSettings(s) { const d = strip(s); delete d.id; await fs.doc('settings/main').set(d); },
    async seed(cols) {
      for (const c of (cols || ['catalog', 'extras', 'stock'])) for (const it of window.SEED[c]) await api.save(c, it);
    },
    async reset() { }
  });
  return api;
})();
