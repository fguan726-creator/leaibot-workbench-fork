// POC only: no phone number is transmitted or persisted.
window.__lxInstallArrivalNotice = function(api) {
const {d,j,I,N,O,z,ot,nt,Qe,xe,ye,ke,Ne,Uo,qe,xn,bindDialog} = api;
function lxIsArrivalQuery(query) {
  return /^(?:请)?(?:为)?(?:联想)?天逸\s*510\s*Pro(?:开启|设置|订阅)?到货通知[。！!]?$/i.test(String(query || '').trim());
}
async function lxArrivalNoticeSkill() {
  return {
    text: '已为你准备这款商品的**到货通知**，请在弹窗中填写手机号并确认。本次为**演示流程**，不会实际订阅或发送短信。',
    id: 'modal:arrival-notice:1056661'
  };
}
function lxOpenArrivalNotice() {
  const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  j('到货通知', '<div class="lx-arrival-content"><p class="lx-arrival-product">联想天逸 510 Pro</p><p class="lx-p0-disclaimer">演示模式：手机号仅用于本次表单校验，不会上传或保存。</p><form class="lx-arrival-form" novalidate><label for="lx-arrival-phone">手机号码</label><div class="lx-arrival-input-wrap"><input id="lx-arrival-phone" type="tel" inputmode="numeric" autocomplete="off" maxlength="11" placeholder="请输入11位手机号码" aria-describedby="lx-arrival-error" required><button type="button" data-arrival-clear aria-label="清空手机号码">清空</button></div><p id="lx-arrival-error" class="lx-arrival-error" role="alert"></p><button class="detail-primary lx-arrival-confirm" type="submit">确定</button><p class="lx-arrival-status" role="status" aria-live="polite"></p></form></div>');
  const mask = I(), panel = mask.querySelector('.lx-p0-modal'), form = mask.querySelector('.lx-arrival-form');
  panel.classList.add('lx-arrival-dialog');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', '到货通知');
  const input = form.querySelector('input'), error = form.querySelector('.lx-arrival-error'), status = form.querySelector('.lx-arrival-status');
  const clear = () => { input.value = ''; input.removeAttribute('aria-invalid'); error.textContent = ''; };
  const cleanup = () => { clear(); panel.removeAttribute('aria-label'); };
  form.querySelector('[data-arrival-clear]').addEventListener('click', () => { clear(); input.focus(); });
  input.addEventListener('input', () => { input.removeAttribute('aria-invalid'); error.textContent = ''; });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!/^1[3-9]\d{9}$/.test(input.value.trim())) {
      error.textContent = '请输入有效的11位手机号码'; input.setAttribute('aria-invalid', 'true'); input.focus(); return;
    }
    clear();
    status.textContent = '演示完成，未实际订阅，也不会发送短信。';
    form.querySelector('[type="submit"]').disabled = true;
    input.disabled = true;
    form.querySelector('[data-arrival-clear]').disabled = true;
    panel.querySelector('.lx-p0-close')?.focus();
  });
  if (mask._lxArrivalCleanup) mask.removeEventListener('click', mask._lxArrivalCleanup, true);
  mask._lxArrivalCleanup = event => { if (event.target === mask || event.target.closest('.lx-p0-close')) cleanup(); };
  mask.addEventListener('click', mask._lxArrivalCleanup, true);
  const keyHandler = event => {
    if (event.key === 'Escape') { event.preventDefault(); cleanup(); N(); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...panel.querySelectorAll('button:not([disabled]), input:not([disabled])')].filter(el => el.getClientRects().length);
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  bindDialog(returnFocus, keyHandler);
  requestAnimationFrame(() => input.focus());
}
O('arrival-notice', lxOpenArrivalNotice);
async function lxArrivalNoticeQuery(query) {
  const nonce = d.conversationNonce;
  d.sending = true; ot(); nt();
  d.queryHistory.push(query);
  (d.queryAnchors || (d.queryAnchors = [])).push(Math.max(0, xe().children.length - 1));
  Qe();
  const reply = ye('ai loading', '', ke(['正在调用 Skill（到货通知 · 演示）'], {collapsed:false, foldable:false, skillCount:0}));
  try {
    const result = await lxArrivalNoticeSkill();
    reply._raw = result.text;
    await Ne(reply, Uo(result.text));
    if (nonce !== d.conversationNonce || !reply.isConnected || !d.sending) return;
    const body = qe(reply);
    body.insertAdjacentHTML('afterbegin', ke(['Skill（到货通知 · 演示）已完成：准备手机号确认表单，未提交订阅'], {collapsed:true, foldable:true, skillCount:1}));
    body.insertAdjacentHTML('beforeend', '<button class="answer-cta lx-store-appointment-cta lx-edu-auth-reco" type="button" data-lx-recommended-modal="arrival-notice" data-lx-recommended-modal-payload="1056661" data-lx-result-id="modal:arrival-notice:1056661" aria-label="打开到货通知弹窗"><span class="answer-cta-title">到货通知待确认</span><span class="answer-cta-icon" aria-hidden="true"><img src="/assets/icons/global-next.svg" alt=""></span></button>');
    xe().scrollTop = xe().scrollHeight;
    const card = body.querySelector('[data-lx-recommended-modal="arrival-notice"]');
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await Promise.all((card.getAnimations?.() || []).map(animation => animation.finished.catch(() => {})));
    if (nonce === d.conversationNonce && reply.isConnected && d.sending) z('arrival-notice', '1056661');
  } catch (error) {
    if (nonce === d.conversationNonce && reply.isConnected) await Ne(reply, Uo('到货通知演示暂未打开，请稍后重试。未提交任何订阅。'));
  } finally {
    if (nonce === d.conversationNonce) { d.sending = false; try { window.__lxSaveConversationNow?.(); } catch (error) {} }
  }
}
// Window capture runs before the existing document-level purchase handler.
let arrivalClickPending = false;
window.addEventListener('click', event => {
  const button = event.target.closest?.('.product-detail .detail-actions .detail-primary');
  if (!button || button.textContent.trim() !== '到货通知') return;
  const title = button.closest('.product-detail').querySelector('[data-detail-title], .detail-title');
  if (!/^(?:联想)?天逸510Pro$/i.test(String(title?.textContent || '').replace(/\s+/g, ''))) return;
  event.preventDefault(); event.stopImmediatePropagation();
  if (!d.sending && !arrivalClickPending) {
    arrivalClickPending = true;
    Promise.resolve(xn('联想天逸 510 Pro到货通知')).finally(() => { arrivalClickPending = false; });
  }
}, true);
window.__lxArrivalNotice = {matches:lxIsArrivalQuery, run:lxArrivalNoticeQuery};
};
