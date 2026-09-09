/* Top navigation orders require login, before any conversation or commerce handler. */
(()=>{'use strict';if(window.__lxOrderLoginGuard)return;window.__lxOrderLoginGuard=true;
const selector='.topbar [data-commerce-entry="orders"],.topbar .utility-btn[aria-label="订单"],.lxfd-actions [data-commerce-entry="orders"],.lxfd-actions [data-lxfd-open="orders"]';
function loggedIn(){const state=window.__lxAgentAPI?.getState?.()||window.__lxState;if(state?.user||window.__lxMember?.guest===false)return true;try{return !!JSON.parse(localStorage.getItem('lexiang.auth.user.v1')||'null');}catch{return false;}}
window.addEventListener('click',event=>{const button=event.target.closest?.(selector);if(!button||loggedIn())return;event.preventDefault();event.stopImmediatePropagation();if(document.querySelector('.lx-auth-modal')?.getClientRects().length)return;const account=document.querySelector('.topbar .utility-btn[aria-label="账号"]');if(account)account.click();},true);
})();
