(()=>{'use strict';
if(window.__lxRecoMatchInstalled)return;window.__lxRecoMatchInstalled=true;
const style=document.createElement('style');style.textContent=`
.lx-reco-match-label{cursor:pointer}.lx-reco-match-label:focus-visible{outline:2px solid #4d144a;outline-offset:3px}
#lx-reco-match-dialog{box-sizing:border-box;width:min(1080px,calc(100vw - 64px));height:min(730px,calc(100dvh - 64px));max-width:none;max-height:none;padding:42px 56px;border:1px solid #e2ddeb;border-radius:12px;background:#fff;color:#242424;box-shadow:0 20px 70px #190e2126;font-family:inherit}
#lx-reco-match-dialog::backdrop{background:var(--lx-modal-overlay-background,#190e21d1)}
#lx-reco-match-dialog .lx-match-layout{height:100%;display:flex;flex-direction:column;gap:26px;min-height:0}
#lx-reco-match-dialog h2{font-size:26px;line-height:1.4;margin:0;font-weight:700}
#lx-reco-match-dialog .lx-match-close{position:absolute;right:20px;top:18px;border:0;background:transparent;color:#979797;width:32px;height:32px;cursor:pointer;display:grid;place-items:center}
#lx-reco-match-dialog .lx-match-scroll{overflow:auto;min-height:0;flex:1}
#lx-reco-match-dialog .lx-match-product{display:flex;align-items:center;gap:22px;padding:20px;background:#fbf9fd;border:1px solid #eee9f5;border-radius:12px;margin-bottom:14px}
#lx-reco-match-dialog .lx-match-product img{width:128px;height:128px;object-fit:contain;background:white;border-radius:12px;flex:none}
#lx-reco-match-dialog h3{font-size:20px;line-height:1.5;margin:0 0 12px;color:#111;font-weight:600}
#lx-reco-match-dialog .lx-match-price{font-size:20px;font-weight:600;color:#111}
#lx-reco-match-dialog .lx-match-table-wrap{border:1px solid #eee9f5;border-radius:12px;overflow:auto;background:#fbf9fd}
#lx-reco-match-dialog table{border-collapse:collapse;width:100%;font-size:16px;line-height:1.65;text-align:left}
#lx-reco-match-dialog th,#lx-reco-match-dialog td{padding:16px 20px;vertical-align:top;border-bottom:1px solid #eae5f1}
#lx-reco-match-dialog tr:last-child td{border-bottom:0}#lx-reco-match-dialog th:first-child,#lx-reco-match-dialog td:first-child{width:90px;text-align:center;white-space:nowrap}#lx-reco-match-dialog th:nth-child(2){width:140px}
#lx-reco-match-dialog .lx-match-status{display:inline-grid;place-items:center;width:23px;height:23px;border-radius:50%;color:white;background:linear-gradient(110deg,#4d144a,#bd202a);font-size:16px}#lx-reco-match-dialog .lx-match-status.pending{background:#eee9f3;color:#807687;font-size:14px}
#lx-reco-match-dialog .lx-match-footer{display:flex;justify-content:flex-end;padding-top:12px}
#lx-reco-match-dialog .lx-match-buy{border:0;border-radius:999px;min-width:188px;padding:13px 32px;color:white;background:linear-gradient(110deg,#4d144a,#bd202a);font:inherit;font-size:20px;cursor:pointer}
#lx-reco-match-dialog button:hover{filter:brightness(.96)}#lx-reco-match-dialog button:focus-visible{outline:2px solid #4d144a;outline-offset:3px}
@media(max-width:700px){#lx-reco-match-dialog{width:calc(100vw - 24px);height:calc(100dvh - 32px);padding:28px 18px}#lx-reco-match-dialog .lx-match-product{padding:12px;gap:12px}#lx-reco-match-dialog .lx-match-product img{width:80px;height:80px}#lx-reco-match-dialog h3{font-size:16px}#lx-reco-match-dialog th,#lx-reco-match-dialog td{padding:12px 10px}#lx-reco-match-dialog table{font-size:14px}}
`;document.head.append(style);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state=()=>window.__lxAgentAPI?.getState?.()||window.__lxState||{};
let dialog,trigger,product,oldOverflow,request=0;
function close(){dialog?.close()}
function ensure(){if(dialog)return;dialog=document.createElement('dialog');dialog.id='lx-reco-match-dialog';dialog.setAttribute('data-buy-modal-direct','');dialog.setAttribute('aria-labelledby','lx-match-title');document.body.append(dialog);dialog._handleMatchClick=function(e){if(e.target.closest('[data-match-close]'))close();if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close()}if(e.target.closest('[data-match-buy]')){const sku=product?.sku;close();if(sku)window.__lxAgentAPI?.openProduct?.(sku)}};dialog.addEventListener('close',()=>{request++;document.documentElement.style.overflow=oldOverflow;trigger?.focus({preventScroll:true})})}
function analysis(p){
 const history=(state().queryHistory||[]).filter(x=>typeof x==='string');const q=[...history].reverse().find(x=>/笔记本|台式|台机|电脑|预算|内存/.test(x))||'';
 const rows=[];const features=[p.category,p.name,p.description].filter(Boolean).join('；');
 const type=q.match(/笔记本(?:电脑)?|台式(?:机|电脑)?|台机/);
 if(type){const laptop=type[0].includes('笔记本'),matched=laptop?/笔记本/.test(features):/台式|台机/.test(features);rows.push({status:matched?'yes':'pending',need:type[0],feature:p.category?`商品类型：${p.category}。${p.name||''}`:p.name||'商品类型待确认'})}
 const budget=q.match(/(?:预算|不超过|低于|以内)[\s：:]*([\d,]+(?:\.\d+)?)\s*(元|块|万)?/);if(budget){const max=Number(budget[1].replace(/,/g,''))*(budget[2]==='万'?10000:1);if(max>0)rows.push({status:Number(p.price)>0&&Number(p.price)<=max?'yes':'pending',need:`预算 ${max.toLocaleString('zh-CN')} 元`,feature:Number(p.price)>0?`当前商品价格为 ${Number(p.price).toLocaleString('zh-CN')} 元${Number(p.price)>max?'，超出该预算':''}。`:'暂无报价，待确认'})}
 if(!rows.length)rows.push({status:'pending',need:q||'待补充具体需求',feature:p.description||p.name||'商品信息待确认'});
 return rows;
}
function render(p,loading=false){product=p;const rows=analysis(p);const image=/^(https?:\/\/|\/)/.test(p.image_url||'')?p.image_url:'';dialog.innerHTML=`<div class="lx-match-layout"><button type="button" class="lx-match-close" data-match-close aria-label="关闭匹配分析"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m5 5 14 14M19 5 5 19"/></svg></button><h2 id="lx-match-title">匹配分析</h2><div class="lx-match-scroll"><section class="lx-match-product">${image?`<img src="${esc(image)}" alt="${esc(p.name)}">`:''}<div><h3>${esc(p.name||'商品信息加载中')}</h3><div class="lx-match-price">¥ ${Number(p.price)>0?Number(p.price).toLocaleString('zh-CN'):'暂无报价'}</div></div></section><div class="lx-match-table-wrap" aria-busy="${loading}"><table><thead><tr><th>是否满足</th><th>您的需求</th><th>商品特征</th></tr></thead><tbody>${rows.map(r=>`<tr><td><span class="lx-match-status ${r.status==='yes'?'':'pending'}" aria-label="${r.status==='yes'?'已满足':'待确认'}" title="${r.status==='yes'?'已满足':'待确认'}">✓</span></td><td>${esc(r.need)}</td><td>${esc(r.feature)}</td></tr>`).join('')}</tbody></table></div></div><footer class="lx-match-footer"><button type="button" class="lx-match-buy" data-match-buy>去购买</button></footer></div>`}
async function open(label){const row=label.closest('[data-open-product]');const sku=row?.dataset.openProduct;if(!sku)return;ensure();trigger=label;const serial=++request;const cached=(state().products||[]).find(p=>String(p.sku)===sku);const fallback={sku,price:Number((row.textContent.match(/[¥￥]\s*([\d,]+(?:\.\d+)?)/)||[])[1]?.replace(/,/g,""))||0,name:row.querySelector('.lx-reco-poc-copy > strong,.reco-row-main > strong')?.textContent?.trim(),image_url:row.querySelector('img')?.src,description:row.querySelector('.spec')?.textContent};render(cached||fallback,true);oldOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';dialog.showModal();dialog.querySelector('[data-match-close]').focus();try{const response=await fetch('/api/products/'+encodeURIComponent(sku),{signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error();const p=await response.json();if(serial===request&&dialog.open)render({...fallback,...p,sku})}catch(_){if(serial===request&&dialog.open)render(cached||fallback)}}
window.addEventListener('click',e=>{if(dialog?.open&&(e.target===dialog||dialog.contains(e.target))){e.stopImmediatePropagation();dialog._handleMatchClick(e);return}const label=e.target.closest?.('.lx-reco-match-label');if(!label)return;e.preventDefault();e.stopImmediatePropagation();open(label)},true);
window.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches?.('.lx-reco-match-label')){e.preventDefault();e.stopImmediatePropagation();open(e.target)}},true);
function decorate(){document.querySelectorAll('.lx-reco-match-label:not([data-match-ready])').forEach(el=>{el.dataset.matchReady='1';el.setAttribute('role','button');el.tabIndex=0;el.setAttribute('aria-haspopup','dialog');el.title='查看匹配分析'})}new MutationObserver(decorate).observe(document.body,{childList:true,subtree:true});decorate();
})();
