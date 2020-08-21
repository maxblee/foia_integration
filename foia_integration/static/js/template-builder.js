var app=function(){"use strict";function t(){}function e(t){return t()}function n(){return Object.create(null)}function o(t){t.forEach(e)}function c(t){return"function"==typeof t}function r(t,e){return t!=t?e==e:t!==e||t&&"object"==typeof t||"function"==typeof t}function i(t,e){t.appendChild(e)}function l(t,e,n){t.insertBefore(e,n||null)}function s(t){t.parentNode.removeChild(t)}function u(t,e){for(let n=0;n<t.length;n+=1)t[n]&&t[n].d(e)}function a(t){return document.createElement(t)}function f(t){return document.createTextNode(t)}function d(){return f(" ")}function p(t,e,n,o){return t.addEventListener(e,n,o),()=>t.removeEventListener(e,n,o)}function m(t,e,n){null==n?t.removeAttribute(e):t.getAttribute(e)!==n&&t.setAttribute(e,n)}function g(t,e){e=""+e,t.wholeText!==e&&(t.data=e)}let h;function y(t){h=t}const $=[],b=[],_=[],x=[],v=Promise.resolve();let k=!1;function A(t){_.push(t)}let E=!1;const q=new Set;function N(){if(!E){E=!0;do{for(let t=0;t<$.length;t+=1){const e=$[t];y(e),I(e.$$)}for($.length=0;b.length;)b.pop()();for(let t=0;t<_.length;t+=1){const e=_[t];q.has(e)||(q.add(e),e())}_.length=0}while($.length);for(;x.length;)x.pop()();k=!1,E=!1,q.clear()}}function I(t){if(null!==t.fragment){t.update(),o(t.before_update);const e=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,e),t.after_update.forEach(A)}}const R=new Set;function S(t,e){-1===t.$$.dirty[0]&&($.push(t),k||(k=!0,v.then(N)),t.$$.dirty.fill(0)),t.$$.dirty[e/31|0]|=1<<e%31}function j(r,i,l,u,a,f,d=[-1]){const p=h;y(r);const m=i.props||{},g=r.$$={fragment:null,ctx:null,props:f,update:t,not_equal:a,bound:n(),on_mount:[],on_destroy:[],before_update:[],after_update:[],context:new Map(p?p.$$.context:[]),callbacks:n(),dirty:d,skip_bound:!1};let $=!1;if(g.ctx=l?l(r,m,(t,e,...n)=>{const o=n.length?n[0]:e;return g.ctx&&a(g.ctx[t],g.ctx[t]=o)&&(!g.skip_bound&&g.bound[t]&&g.bound[t](o),$&&S(r,t)),e}):[],g.update(),$=!0,o(g.before_update),g.fragment=!!u&&u(g.ctx),i.target){if(i.hydrate){const t=function(t){return Array.from(t.childNodes)}(i.target);g.fragment&&g.fragment.l(t),t.forEach(s)}else g.fragment&&g.fragment.c();i.intro&&((b=r.$$.fragment)&&b.i&&(R.delete(b),b.i(_))),function(t,n,r){const{fragment:i,on_mount:l,on_destroy:s,after_update:u}=t.$$;i&&i.m(n,r),A(()=>{const n=l.map(e).filter(c);s?s.push(...n):o(n),t.$$.on_mount=[]}),u.forEach(A)}(r,i.target,i.anchor),N()}var b,_;y(p)}function w(t,e,n){const o=t.slice();return o[5]=e[n],o}function T(t,e,n){const o=t.slice();return o[8]=e[n],o}function P(t){let e,n,o=t[8].content+"";return{c(){e=a("span"),n=f(o),m(e,"class","template__highlight svelte-14i44kq")},m(t,o){l(t,e,o),i(e,n)},p(t,e){2&e&&o!==(o=t[8].content+"")&&g(n,o)},d(t){t&&s(e)}}}function M(t){let e,n=t[8].content+"";return{c(){e=f(n)},m(t,n){l(t,e,n)},p(t,o){2&o&&n!==(n=t[8].content+"")&&g(e,n)},d(t){t&&s(e)}}}function O(t){let e;function n(t,e){return"text"===t[8].type?M:P}let o=n(t),c=o(t);return{c(){c.c(),e=f("")},m(t,n){c.m(t,n),l(t,e,n)},p(t,r){o===(o=n(t))&&c?c.p(t,r):(c.d(1),c=o(t),c&&(c.c(),c.m(e.parentNode,e)))},d(t){c.d(t),t&&s(e)}}}function B(t){let e,n,o,c,r,u=t[0][t[5]]+"";return{c(){e=a("button"),n=f(u),m(e,"type","button"),m(e,"data-field",o=t[5]),m(e,"class","button__item svelte-14i44kq")},m(o,s){l(o,e,s),i(e,n),c||(r=p(e,"click",t[3]),c=!0)},p(t,c){1&c&&u!==(u=t[0][t[5]]+"")&&g(n,u),1&c&&o!==(o=t[5])&&m(e,"data-field",o)},d(t){t&&s(e),c=!1,r()}}}function H(e){let n,o,c,r,f,g,h,y,$,b,_=e[1],x=[];for(let t=0;t<_.length;t+=1)x[t]=O(T(e,_,t));let v=Object.keys(e[0]),k=[];for(let t=0;t<v.length;t+=1)k[t]=B(w(e,v,t));return{c(){n=a("div");for(let t=0;t<x.length;t+=1)x[t].c();o=d(),c=a("div");for(let t=0;t<k.length;t+=1)k[t].c();r=d(),f=a("div"),g=a("textarea"),h=d(),y=a("div"),y.innerHTML='<input type="submit" value="Submit Template" class="svelte-14i44kq">',m(n,"class","presentation__area svelte-14i44kq"),m(c,"class","button__container svelte-14i44kq"),m(g,"name","template-text"),m(g,"aria-label","Write your template here"),m(g,"id","template-input"),m(g,"class","svelte-14i44kq"),m(f,"class","form__area svelte-14i44kq"),m(y,"class","submit__container svelte-14i44kq")},m(t,s){l(t,n,s);for(let t=0;t<x.length;t+=1)x[t].m(n,null);l(t,o,s),l(t,c,s);for(let t=0;t<k.length;t+=1)k[t].m(c,null);l(t,r,s),l(t,f,s),i(f,g),l(t,h,s),l(t,y,s),$||(b=p(g,"input",e[2]),$=!0)},p(t,[e]){if(2&e){let o;for(_=t[1],o=0;o<_.length;o+=1){const c=T(t,_,o);x[o]?x[o].p(c,e):(x[o]=O(c),x[o].c(),x[o].m(n,null))}for(;o<x.length;o+=1)x[o].d(1);x.length=_.length}if(9&e){let n;for(v=Object.keys(t[0]),n=0;n<v.length;n+=1){const o=w(t,v,n);k[n]?k[n].p(o,e):(k[n]=B(o),k[n].c(),k[n].m(c,null))}for(;n<k.length;n+=1)k[n].d(1);k.length=v.length}},i:t,o:t,d(t){t&&s(n),u(x,t),t&&s(o),t&&s(c),u(k,t),t&&s(r),t&&s(f),t&&s(h),t&&s(y),$=!1,b()}}}function L(t,e,n){let{buttonItems:o}=e,c=[];function r(){const t=/\{\{([\w\s]+)\}\}/g,e=document.getElementById("template-input").value;let o,r=[],i=0;for(;o=t.exec(e);){const t=o.input.slice(i,o.index);r.push({type:"text",content:t}),r.push({type:"plugin",content:o[1]}),i=o.index+o[0].length}r.push({type:"text",content:e.slice(i)}),n(1,c=r)}return t.$$set=t=>{"buttonItems"in t&&n(0,o=t.buttonItems)},[o,c,function(t){!function(t){const e=t.target;e.clientHeight<e.scrollHeight&&(e.style.height=e.scrollHeight+20+"px")}(t),r()},function(t){const e=t.target.innerText;document.getElementById("template-input").value+=`{{${e}}}`,r()}]}return new class extends class{$destroy(){!function(t,e){const n=t.$$;null!==n.fragment&&(o(n.on_destroy),n.fragment&&n.fragment.d(e),n.on_destroy=n.fragment=null,n.ctx=[])}(this,1),this.$destroy=t}$on(t,e){const n=this.$$.callbacks[t]||(this.$$.callbacks[t]=[]);return n.push(e),()=>{const t=n.indexOf(e);-1!==t&&n.splice(t,1)}}$set(t){var e;this.$$set&&(e=t,0!==Object.keys(e).length)&&(this.$$.skip_bound=!0,this.$$set(t),this.$$.skip_bound=!1)}}{constructor(t){super(),j(this,t,L,H,r,{buttonItems:0})}}({target:document.getElementById("foia-template"),props:{buttonItems:{requestedRecords:"Requested Records",recipientName:"Recipient Name",praName:"Public Records Act Name",expeditedProcessing:"Expedited Processing Justification",feeWaiver:"Fee Waiver Justification",maxRespTime:"Maximum Response Time",agencyName:"Agency Name",agencyStreetAddress:"Agency Street Address",agencyFullAddress:"Agency Full Address",agencyMunicipality:"Agency Municipality",agencyState:"Agency State",agencyZip:"Agency ZIP Code",subject:"Subject Line",foiaEmail:"Agency Public Records Email Address"}}})}();
//# sourceMappingURL=template-builder.js.map
