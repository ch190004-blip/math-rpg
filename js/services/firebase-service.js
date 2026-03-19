(function(app){
  const state = app.state;
  const utils = app.utils;

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
          if (user) state.profile = await this.ensureUserProfile(user);
          else state.profile = { name: '旅人', email: '', level: 1, exp: 0, coins: 100 };
          state.authReady = true;
          app.ui.renderAll();
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
      if (!raw) return { name: '離線旅人', email: '', level: 1, exp: 0, coins: 100, avatarSkin: Object.assign({}, state.avatar) };
      try { return JSON.parse(raw); }
      catch (_) { return { name: '離線旅人', email: '', level: 1, exp: 0, coins: 100, avatarSkin: Object.assign({}, state.avatar) }; }
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
      if (this.auth && state.firebaseReady) await this.auth.signOut();
      else {
        state.user = null;
        state.profile = this.getLocalProfile();
        app.ui.renderAll();
      }
    },

    async ensureUserProfile(user){
      const defaultProfile = {
        name: user.displayName || '勇者',
        email: user.email || '',
        level: 1,
        exp: 0,
        coins: 100,
        inventory: [],
        avatarSkin: Object.assign({}, state.avatar)
      };
      try{
        const ref = this.db.collection('users').doc(user.uid);
        const snap = await ref.get();
        if (!snap.exists) {
          await ref.set(defaultProfile);
          return defaultProfile;
        }
        const profile = Object.assign({}, defaultProfile, snap.data() || {});
        state.avatar = Object.assign({}, state.avatar, profile.avatarSkin || {});
        profile.level = app.utils.levelFromExp(profile.exp || 0);
        await ref.set({ level: profile.level, avatarSkin: Object.assign({}, state.avatar, profile.avatarSkin || {}) }, { merge: true });
        return profile;
      }catch(error){
        console.warn('ensureUserProfile fallback local', error);
        return this.getLocalProfile();
      }
    },

    async addReward(coins, exp){
      const profile = state.profile || { name: '旅人', coins: 0, exp: 0, level: 1 };
      profile.coins = Number(profile.coins || 0) + Number(coins || 0);
      profile.exp = Number(profile.exp || 0) + Number(exp || 0);
      profile.level = app.utils.levelFromExp(profile.exp);

      if (state.user && state.firebaseReady && this.db && state.user.uid !== 'offline-user') {
        try{
          const ref = this.db.collection('users').doc(state.user.uid);
          await ref.set({
            name: state.user.displayName || profile.name || '勇者',
            email: state.user.email || '',
            coins: firebase.firestore.FieldValue.increment(Number(coins || 0)),
            exp: firebase.firestore.FieldValue.increment(Number(exp || 0)),
            level: profile.level,
            avatarSkin: Object.assign({}, state.avatar)
          }, { merge: true });
        }catch(error){
          console.warn('reward sync fallback local', error);
          this.saveLocalProfile(profile);
        }
      } else {
        this.saveLocalProfile(profile);
      }

      state.profile = Object.assign({}, profile);
      app.ui.renderHUD();
      return state.profile;
    },

    async submitFeedback(payload){
      const base = {
        uid: state.user?.uid || 'offline-user',
        userName: state.user?.displayName || state.profile?.name || '旅人',
        userEmail: state.user?.email || state.profile?.email || '',
        createdAt: new Date().toISOString()
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
    }
  };

  app.services.firebase = service;
})(window.MathRPG);
