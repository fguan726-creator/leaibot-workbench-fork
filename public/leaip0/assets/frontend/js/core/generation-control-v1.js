/* Shared cancellation for the P0 assistant, fullscreen and split composer. */
(() => {
  'use strict';
  if (window.__lxGeneration) return;
  let epoch = 0;
  const scopes = new Map();
  const states = new Set(), pending = new Set(), timers = new Map(), requests = new Set();
  const buttons = '#lxfdSend,.assistant-panel .send-btn,.hero-send-btn';
  const markers = '.lx-p0-messages .loading-line,.lx-p0-messages .typing-cursor,.lx-p0-messages .streaming,.lxfd-thread .loading-line,.lxfd-thread .typing-cursor,.lxfd-thread .streaming';
  const abortError = () => new DOMException('已停止生成', 'AbortError');
  const current = token => token === epoch;
  const busy = () => [...states].some(state => state.sending) || !!document.querySelector(markers);
  function sync() {
    const running = busy();
    if (!running) requests.clear();
    document.querySelectorAll(buttons).forEach(button => {
      if (!button.dataset.lxSendLabel) button.dataset.lxSendLabel = button.getAttribute('aria-label') || '发送';
      if (button.classList.contains('lx-stop-generation') !== running) button.classList.toggle('lx-stop-generation', running);
      const label = running ? '停止生成' : button.dataset.lxSendLabel;
      if (button.getAttribute('aria-label') !== label) button.setAttribute('aria-label', label);
      if (button.title !== label) button.title = label;
      const input = button.closest('form,.composer,.hero-composer')?.querySelector('textarea');
      const disabled = !running && !input?.value.trim();
      if (button.disabled !== disabled) button.disabled = disabled;
      if (running && button.classList.contains('idle')) button.classList.remove('idle');
    });
  }
  function register(state, scope) {
    if (!state || states.has(state)) return;
    states.add(state);
    scopes.set(scope,state);
    const descriptor = Object.getOwnPropertyDescriptor(state, 'sending');
    let value = state.sending;
    Object.defineProperty(state, 'sending', {configurable:true,enumerable:true,
      get(){return descriptor?.get ? descriptor.get.call(state) : value;},
      set(next){if(descriptor?.set) descriptor.set.call(state,next);else value=!!next;sync();}
    });
    sync();
  }
  function wait(token, task) {
    return new Promise((resolve,reject) => {
      const cancel = () => {pending.delete(cancel);reject(abortError());};
      if (!current(token)) {Promise.resolve(task).catch(()=>{});cancel();return;}
      pending.add(cancel);
      Promise.resolve(task).then(value=>{pending.delete(cancel);current(token)?resolve(value):reject(abortError());},error=>{pending.delete(cancel);reject(current(token)?error:abortError());});
    });
  }
  function schedule(kind, token, callback, delay, ...args) {
    if (!current(token)) return 0;
    let id;
    const invoke = (...values) => {if(kind==='timeout')timers.delete(id);if(current(token))callback(...values);else clear(id);};
    id = kind==='interval'?window.setInterval(invoke,delay,...args):kind==='frame'?window.requestAnimationFrame(invoke):window.setTimeout(invoke,delay,...args);
    timers.set(id,kind);return id;
  }
  function clear(id) {const kind=timers.get(id);timers.delete(id);if(kind==='frame')window.cancelAnimationFrame(id);else {window.clearTimeout(id);window.clearInterval(id);}}
  function request(token, input, options={}) {
    const controller = new AbortController();
    const upstream = options.signal;
    const signal = upstream ? AbortSignal.any([controller.signal, upstream]) : controller.signal;
    if(!current(token))controller.abort();
    requests.add(controller);
    return fetch(input,{...options,signal}).then(response=>{
      if(response.body){
        const getReader=response.body.getReader.bind(response.body);
        response.body.getReader=(...args)=>{
          const reader=getReader(...args),read=reader.read.bind(reader),cancel=reader.cancel.bind(reader);
          reader.read=(...values)=>read(...values).then(result=>{if(result.done)requests.delete(controller);return result;},error=>{requests.delete(controller);throw error;});
          reader.cancel=(...values)=>{requests.delete(controller);return cancel(...values);};
          return reader;
        };
      }
      return response;
    },error=>{requests.delete(controller);throw error;});
  }

  function stop() {
    if(!busy())return false;
    const active = [];
    for(const selector of ['.lx-p0-messages','.lxfd-thread']) {
      const root=document.querySelector(selector), node=root?.lastElementChild;
      if(node && !node.matches('.user,.lxfd-msg-user') && (node.querySelector('.loading-line,.typing-cursor,.streaming') || scopes.get(selector==='.lxfd-thread'?'fullscreen':'split')?.sending)) active.push(node);
    }
    epoch++;
    for(const controller of requests)controller.abort();requests.clear();
    for(const id of [...timers.keys()])clear(id);
    for(const cancel of [...pending])cancel();
    for(const state of states){state.conversationNonce=(state.conversationNonce||0)+1;state.sending=false;state._buyFlowRunning=false;state._buyEntryLoading=false;clearTimeout(state._sendTimeout);}
    active.forEach(node=>{
      node._pendingExtras=null;node._afterAnswer=[];node.classList.remove('loading');
      node.querySelectorAll('.loading-line,.lx-generating,.typing-cursor,.lxfd-typing').forEach(el=>el.remove());
      node.querySelectorAll('.streaming').forEach(el=>el.classList.remove('streaming'));
      node.querySelectorAll('.lx-skill-trace-item.current').forEach(el=>el.classList.remove('current'));
      const body=node.querySelector('.ai-body,.lxfd-ai-body')||node;
      node._raw=(body.querySelector('.lxfd-ai-text,.lx-msg-text')||body).textContent.trim();
      if(!body.querySelector('[data-lx-generation-stopped]')){const status=document.createElement('p');status.dataset.lxGenerationStopped='true';status.className='lx-p0-disclaimer';status.setAttribute('role','status');status.textContent='已停止生成';body.append(status);}
    });
    document.body.classList.remove('lx-agent-generating');
    sync();window.__lxSaveConversationNow?.();window.__lxPersistStoppedFullscreen?.();
    return true;
  }
  window.__lxGeneration=Object.freeze({capture:()=>epoch,current,register,wait,fetch:request,stop,sync,
    timeout:(token,fn,delay,...args)=>schedule('timeout',token,fn,delay,...args),
    interval:(token,fn,delay,...args)=>schedule('interval',token,fn,delay,...args),
    frame:(token,fn)=>schedule('frame',token,fn),clear});
  const style=document.createElement('style');style.id='lx-stop-generation-style';
  const stopSelector='html body #lxfdSend.lx-stop-generation,html body .assistant-panel button.send-btn.lx-stop-generation,html body .hero-send-btn.lx-stop-generation';
  style.textContent=`:is(${stopSelector}){position:relative!important;opacity:1!important;cursor:pointer!important;background:linear-gradient(90deg,#4d144a 11.9%,#b8252e 100%)!important;border-radius:50%!important}:is(${stopSelector})>*{visibility:hidden!important}:is(${stopSelector})::after{content:""!important;display:block!important;visibility:visible!important;opacity:1!important;position:absolute;left:50%;top:50%;width:12px;height:12px;transform:translate(-50%,-50%);border-radius:2px;background:#FFFFFF}:is(${stopSelector}):focus-visible{outline:2px solid #4d144a;outline-offset:3px}:is(${stopSelector}):active{transform:scale(.96)}[data-lx-generation-stopped]{color:#979797;font-size:12px;line-height:1.6}`;
  style.textContent += ":is(.ai-body,.lxfd-ai-body):has([data-lx-generation-stopped]) .lx-skill-trace-item{animation:none!important;background:none!important;-webkit-text-fill-color:#979797!important;color:#979797!important;font-weight:400!important}:is(.ai-body,.lxfd-ai-body):has([data-lx-generation-stopped]) .lx-skill-trace-item::after{animation:none!important;content:none!important}";
  (document.head||document.documentElement).append(style);
  window.addEventListener('click',event=>{if(event.target.closest?.(buttons)&&busy()){event.preventDefault();event.stopImmediatePropagation();stop();}},true);
  window.addEventListener('submit',event=>{if(event.target.matches?.('.composer,.lxfd-composer,.hero-composer')&&busy()){event.preventDefault();event.stopImmediatePropagation();}},true);
  window.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing&&event.target.matches?.('.composer textarea,.lxfd-composer textarea,.hero-composer textarea')&&busy()){event.preventDefault();event.stopImmediatePropagation();}},true);
  let queued=false;
  new MutationObserver(()=>{if(!queued){queued=true;queueMicrotask(()=>{queued=false;sync();});}}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','class']});
  document.addEventListener('input',sync);
})();
