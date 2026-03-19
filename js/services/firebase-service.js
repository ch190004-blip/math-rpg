
(function(app){
  const state = app.state;
  const utils = app.utils;

  function defaultProfile(name='勇者'){
    return {
      name,
      email: '',
      level: 1,
      exp: 0,
      coins: 100,
      inventory: [],
      customNameSet: false,
      avatarSkin: Object.assign({}, state.avatar)
    };
  }

  const service = {
    app: null,
    auth: null,
    db: null,

    async init(){
      try{
        if (!window.firebase || !window.firebase.apps) throw new Error('Firebase SDK not loaded');
        if (!firebase.apps.length) firebase.initializeApp(app.config.firebase);
        this.app = firebase.app();
        this.auth = firebase.auth();
        this.db = firebase.firestore();

        await this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        this.auth.onAuthStateChanged(async (user) => {
          state.user = user || null;
          if (user) {
            state.profile = await this.ensureUserProfile(user);
            await this.flushLocalFeedbackQueue();
          } else {
            state.profile = this.getLocalProfile();
          }
          state.authReady = true;
          app.ui.renderAll();
          app.ui.maybePromptProfileName();
        });
      }catch(error){
        console.warn('Firebase unavailable, fallback to local profile.', error);
        state.firebaseReady = false;
        state.authReady = true;
        state.profile = this.getLocalProfile();
        app.ui.renderAll();
      }
    },

    getLocalProfile(){
      const raw = localStorage.getItem('mathRpgLocalProfile');
      if (!raw) return defaultProfile('離線旅人');
      try {
        return Object.assign(defaultProfile('離線旅人'), JSON.parse(raw));
      } catch (_) {
        return defaultProfile('離線旅人');
      }
    },

    saveLocalProfile(profile){
      localStorage.setItem('mathRpgLocalProfile', JSON.stringify(profile));
    },

    getLocalFeedbackQueue(){
      const raw = localStorage.getItem('mathRpgFeedbackQueue');
      if (!raw) return [];
      try { return JSON.parse(raw); } catch (_) { return []; }
    },

    saveLocalFeedbackQueue(list){
      localStorage.setItem('mathRpgFeedbackQueue', JSON.stringify(list));
    },

    async signIn(){
      if (!this.auth || !state.firebaseReady) {
        state.user = { uid: 'offline-user', displayName: '離線旅人', email: '' };
        state.profile = this.getLocalProfile();
        state.authReady = true;
        app.ui.toast('已進入離線模式', 'good');
        app.ui.renderAll();
        return;
      }
      const provider = new firebase.auth.GoogleAuthProvider();
      try{
        if (utils.isMobile()) await this.auth.signInWithRedirect(provider);
        else await this.auth.signInWithPopup(provider);
      }catch(error){
        console.error(error);
        try{ await this.auth.signInWithRedirect(provider); }
        catch(error2){
          console.error(error2);
          app.ui.toast('Google 登入失敗，請確認 Firebase 授權網域。', 'bad');
        }
      }
    },

    async signOut(){
      state.uiMenuOpen = false;
      if (this.auth && state.firebaseReady) await this.auth.signOut();
      else {
        state.user = null;
        state.profile = this.getLocalProfile();
        app.ui.renderAll();
      }
    },

    async ensureUserProfile(user){
      const defaultName = utils.sanitizeName(user.displayName || user.email?.split('@')[0] || '勇者') || '勇者';
      const defaults = defaultProfile(defaultName);
      defaults.email = user.email || '';
      try{
        const ref = this.db.collection('users').doc(user.uid);
        const snap = await ref.get();
        let profile = defaults;
        if (!snap.exists) {
          await ref.set(defaults, { merge: true });
        } else {
          profile = Object.assign({}, defaults, snap.data() || {});
        }
        profile.level = app.utils.levelFromExp(profile.exp || 0);
        profile.avatarSkin = Object.assign({}, state.avatar, profile.avatarSkin || {});
        state.avatar = Object.assign({}, state.avatar, profile.avatarSkin || {});
        await ref.set({
          email: user.email || '',
          name: profile.name || defaultName,
          level: profile.level,
          customNameSet: !!profile.customNameSet,
          avatarSkin: profile.avatarSkin
        }, { merge: true });
        return profile;
      }catch(error){
        console.warn('ensureUserProfile fallback local', error);
        return this.getLocalProfile();
      }
    },

    async updateProfileName(name){
      const safeName = utils.sanitizeName(name);
      if (!safeName) throw new Error('名稱不可空白');
      const next = Object.assign({}, state.profile || defaultProfile(), { name: safeName, customNameSet: true });
      state.profile = next;
      if (state.user && state.firebaseReady && this.db && state.user.uid !== 'offline-user') {
        const ref = this.db.collection('users').doc(state.user.uid);
        await ref.set({ name: safeName, customNameSet: true }, { merge: true });
      } else {
        this.saveLocalProfile(next);
      }
      app.ui.renderHUD();
      return next;
    },

    async addReward(coins, exp){
      const addCoins = Number(coins || 0);
      const addExp = Number(exp || 0);

      if (state.user && state.firebaseReady && this.db && state.user.uid !== 'offline-user') {
        try{
          const ref = this.db.collection('users').doc(state.user.uid);
          const result = await this.db.runTransaction(async (tx) => {
            const snap = await tx.get(ref);
            const current = Object.assign({}, defaultProfile(state.profile?.name || '勇者'), snap.exists ? snap.data() : {});
            const nextCoins = Number(current.coins || 0) + addCoins;
            const nextExp = Number(current.exp || 0) + addExp;
            const nextLevel = app.utils.levelFromExp(nextExp);
            const nextProfile = Object.assign({}, current, {
              name: state.profile?.name || current.name || '勇者',
              email: state.user?.email || current.email || '',
              coins: nextCoins,
              exp: nextExp,
              level: nextLevel,
              customNameSet: !!current.customNameSet,
              avatarSkin: Object.assign({}, state.avatar)
            });
            tx.set(ref, nextProfile, { merge: true });
            return nextProfile;
          });
          state.profile = result;
          app.ui.renderHUD();
          return result;
        }catch(error){
          console.warn('reward sync fallback local', error);
        }
      }

      const profile = Object.assign({}, state.profile || defaultProfile('旅人'));
      profile.coins = Number(profile.coins || 0) + addCoins;
      profile.exp = Number(profile.exp || 0) + addExp;
      profile.level = app.utils.levelFromExp(profile.exp);
      profile.avatarSkin = Object.assign({}, state.avatar);
      state.profile = profile;
      this.saveLocalProfile(profile);
      app.ui.renderHUD();
      return state.profile;
    },


    async spendCoins(cost){
      const spend = Math.max(0, Number(cost || 0));
      if (!spend) return true;

      if (state.user && state.firebaseReady && this.db && state.user.uid !== 'offline-user') {
        try{
          const ref = this.db.collection('users').doc(state.user.uid);
          const result = await this.db.runTransaction(async (tx) => {
            const snap = await tx.get(ref);
            const current = Object.assign({}, defaultProfile(state.profile?.name || '勇者'), snap.exists ? snap.data() : {});
            const currentCoins = Number(current.coins || 0);
            if (currentCoins < spend) return null;
            const nextProfile = Object.assign({}, current, {
              name: state.profile?.name || current.name || '勇者',
              email: state.user?.email || current.email || '',
              coins: currentCoins - spend,
              exp: Number(current.exp || 0),
              level: app.utils.levelFromExp(Number(current.exp || 0)),
              customNameSet: !!current.customNameSet,
              avatarSkin: Object.assign({}, state.avatar)
            });
            tx.set(ref, nextProfile, { merge: true });
            return nextProfile;
          });
          if (!result) return false;
          state.profile = result;
          app.ui.renderHUD();
          return true;
        }catch(error){
          console.warn('spend coins fallback local', error);
        }
      }

      const profile = Object.assign({}, state.profile || defaultProfile('旅人'));
      const currentCoins = Number(profile.coins || 0);
      if (currentCoins < spend) return false;
      profile.coins = currentCoins - spend;
      profile.avatarSkin = Object.assign({}, state.avatar);
      state.profile = profile;
      this.saveLocalProfile(profile);
      app.ui.renderHUD();
      return true;
    },

    async submitFeedback(payload){
      const base = {
        uid: state.user?.uid || 'offline-user',
        userName: state.profile?.name || state.user?.displayName || '旅人',
        userEmail: state.user?.email || state.profile?.email || '',
        createdAt: new Date().toISOString(),
        build: state.build
      };
      const doc = Object.assign({}, base, payload || {});
      if (state.user && state.firebaseReady && this.db && state.user.uid !== 'offline-user') {
        try {
          await this.db.collection('feedback').add({
            ...doc,
            serverTimestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
          return true;
        } catch (error) {
          const queue = this.getLocalFeedbackQueue();
          queue.push(doc);
          this.saveLocalFeedbackQueue(queue);
          throw error;
        }
      } else {
        const queue = this.getLocalFeedbackQueue();
        queue.push(doc);
        this.saveLocalFeedbackQueue(queue);
        return true;
      }
    },

    async flushLocalFeedbackQueue(){
      if (!state.user || !state.firebaseReady || !this.db || state.user.uid === 'offline-user') return;
      const queue = this.getLocalFeedbackQueue();
      if (!queue.length) return;
      const remain = [];
      for (const item of queue) {
        try{
          await this.db.collection('feedback').add({
            ...item,
            syncedFromLocal: true,
            serverTimestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
        }catch(error){
          remain.push(item);
        }
      }
      this.saveLocalFeedbackQueue(remain);
    }
  };

  app.services.firebase = service;
})(window.MathRPG);
