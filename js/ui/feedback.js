(function(app){
  const state = app.state;
  const world = () => app.data.world;

  function defaultDraft(){
    const normalizedSemester = state.currentTowerId || '7up';
    const chapterId = state.currentChapterId || world().getChapters(normalizedSemester)[0]?.id || '7up-1-1';
    return {
      kind: 'bug',
      bugType: 'question',
      semesterId: normalizedSemester,
      chapterId,
      slimeTypeId: '',
      description: '',
      otherFeedback: ''
    };
  }

  function renderChapterOptions(semesterId){
    return world().getChapters(semesterId).map(ch => `<option value="${ch.id}">${ch.label}</option>`).join('');
  }

  function renderSlimeOptions(chapterId){
    const opts = world().getFeedbackSlimeOptions(chapterId);
    return `<option value="">不確定 / 非題型問題</option>${opts.map(item => `<option value="${item.value}">${item.label}</option>`).join('')}`;
  }

  function bindField(id, key){
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      state.feedback.draft[key] = el.value;
    });
    el.addEventListener('change', () => {
      state.feedback.draft[key] = el.value;
    });
  }

  app.ui.openFeedback = function(){
    state.modal = 'feedback';
    state.feedback.draft = Object.assign(defaultDraft(), state.feedback.draft || {});
    app.ui.renderFeedback();
  };

  app.ui.closeFeedback = function(){
    state.modal = 'none';
    app.ui.renderFeedback();
  };

  app.ui.renderFeedback = function(){
    const root = document.getElementById('modal-root');
    if (state.modal !== 'feedback') {
      root.innerHTML = '';
      return;
    }
    const d = state.feedback.draft || defaultDraft();
    root.innerHTML = `
      <div class="feedback-layer">
        <div class="feedback-panel soft-card">
          <div class="feedback-head">
            <div>
              <div class="badge">封測回饋入口</div>
              <div class="feedback-title">BUG / 其他回饋</div>
              <div class="feedback-sub">每個場景右下角都能送出。題目錯誤、樓層連結、史萊姆題型、手機操作問題都能在這裡回報。</div>
            </div>
            <button class="icon-btn" id="feedback-close-btn">關閉</button>
          </div>

          <div class="feedback-grid">
            <div class="feedback-field">
              <label>回饋種類</label>
              <select id="feedback-kind">
                <option value="bug" ${d.kind === 'bug' ? 'selected' : ''}>BUG 提報</option>
                <option value="other" ${d.kind === 'other' ? 'selected' : ''}>其他回饋</option>
              </select>
            </div>

            <div class="feedback-field">
              <label>問題分類</label>
              <select id="feedback-bug-type">
                <option value="question" ${d.bugType === 'question' ? 'selected' : ''}>題目的問題</option>
                <option value="other" ${d.bugType === 'other' ? 'selected' : ''}>其他問題</option>
              </select>
            </div>

            <div class="feedback-field">
              <label>第幾冊 / 學期之塔</label>
              <select id="feedback-semester">
                ${world().semesters.map(item => `<option value="${item.id}" ${d.semesterId === item.id ? 'selected' : ''}>${item.label}</option>`).join('')}
              </select>
            </div>

            <div class="feedback-field">
              <label>第幾章節</label>
              <select id="feedback-chapter">${renderChapterOptions(d.semesterId)}</select>
            </div>

            <div class="feedback-field full">
              <label>哪種題型的史萊姆</label>
              <select id="feedback-slime">${renderSlimeOptions(d.chapterId)}</select>
            </div>

            <div class="feedback-field full">
              <label>${d.kind === 'bug' ? '問題敘述' : '其他回饋內容'}</label>
              <textarea id="feedback-description" placeholder="${d.kind === 'bug' ? '請描述重現步驟、場景、畫面、題型、正確預期結果。' : '請留下想法、希望優化的地方、對視覺與操作的建議。'}">${d.description || ''}</textarea>
            </div>
          </div>

          <div class="feedback-note">建議寫法：BUG 提報 → 題目的問題 / 其他問題 → 選冊別 → 選章節 → 選史萊姆題型 → 問題敘述。沒有對應題型時可選「不確定 / 非題型問題」。</div>

          <div class="feedback-actions">
            <button class="secondary-btn" id="feedback-cancel-btn">取消</button>
            <button class="primary-btn" id="feedback-submit-btn">${state.feedback.submitting ? '送出中…' : '送出回饋'}</button>
          </div>
        </div>
      </div>
    `;

    const close = document.getElementById('feedback-close-btn');
    const cancel = document.getElementById('feedback-cancel-btn');
    if (close) close.onclick = () => app.ui.closeFeedback();
    if (cancel) cancel.onclick = () => app.ui.closeFeedback();

    const kindSel = document.getElementById('feedback-kind');
    const semesterSel = document.getElementById('feedback-semester');
    const chapterSel = document.getElementById('feedback-chapter');
    const slimeSel = document.getElementById('feedback-slime');
    if (chapterSel) chapterSel.value = d.chapterId;
    if (slimeSel) slimeSel.value = d.slimeTypeId || '';

    bindField('feedback-kind', 'kind');
    bindField('feedback-bug-type', 'bugType');
    bindField('feedback-description', 'description');

    if (kindSel) {
      kindSel.onchange = () => {
        state.feedback.draft.kind = kindSel.value;
        app.ui.renderFeedback();
      };
    }

    if (semesterSel) {
      semesterSel.onchange = () => {
        state.feedback.draft.semesterId = semesterSel.value;
        const firstChapter = world().getChapters(semesterSel.value)[0];
        state.feedback.draft.chapterId = firstChapter?.id || '';
        state.feedback.draft.slimeTypeId = '';
        app.ui.renderFeedback();
      };
    }

    if (chapterSel) {
      chapterSel.onchange = () => {
        state.feedback.draft.chapterId = chapterSel.value;
        state.feedback.draft.slimeTypeId = '';
        app.ui.renderFeedback();
      };
    }

    if (slimeSel) {
      slimeSel.onchange = () => {
        state.feedback.draft.slimeTypeId = slimeSel.value;
      };
    }

    const submit = document.getElementById('feedback-submit-btn');
    if (submit) {
      submit.onclick = async () => {
        if (state.feedback.submitting) return;
        const payload = Object.assign({}, state.feedback.draft);
        if (!payload.description || !payload.description.trim()) {
          app.ui.toast('請先填寫問題敘述或回饋內容', 'bad');
          return;
        }
        state.feedback.submitting = true;
        app.ui.renderFeedback();
        try {
          await app.services.firebase.submitFeedback({
            kind: payload.kind,
            bugType: payload.bugType,
            semesterId: payload.semesterId,
            chapterId: payload.chapterId,
            slimeTypeId: payload.slimeTypeId,
            description: payload.description,
            sceneKey: state.sceneKey,
            currentTowerId: state.currentTowerId,
            currentChapterId: state.currentChapterId
          });
          app.ui.toast('回饋已送出，感謝你幫忙封測', 'good');
          state.feedback.draft = defaultDraft();
          state.feedback.submitting = false;
          app.ui.closeFeedback();
        } catch (error) {
          console.error(error);
          state.feedback.submitting = false;
          app.ui.toast('送出失敗，已改存本機待補送', 'bad');
          app.ui.closeFeedback();
        }
      };
    }
  };
})(window.MathRPG);
