/* Keep the persistent SP shortcuts out of modal/menu focus navigation. */
(() => {
 'use strict';
 const bar=document.querySelector('.mobile-direct');
 if(!bar)return;
 const sync=()=>{bar.inert=document.body.classList.contains('menu-lock');};
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
 sync();
})();
