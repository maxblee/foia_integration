var app=function(){"use strict";function e(){}function t(e){return e()}function n(){return Object.create(null)}function l(e){e.forEach(t)}function i(e){return"function"==typeof e}function r(e,t){return e!=e?t==t:e!==t||e&&"object"==typeof e||"function"==typeof e}function c(t,...n){if(null==t)return e;const l=t.subscribe(...n);return l.unsubscribe?()=>l.unsubscribe():l}function o(e,t,n){e.$$.on_destroy.push(c(t,n))}function s(e,t){e.appendChild(t)}function u(e,t,n){e.insertBefore(t,n||null)}function a(e){e.parentNode.removeChild(e)}function d(e,t){for(let n=0;n<e.length;n+=1)e[n]&&e[n].d(t)}function f(e){return document.createElement(e)}function p(e){return document.createElementNS("http://www.w3.org/2000/svg",e)}function m(e){return document.createTextNode(e)}function g(){return m(" ")}function h(e,t,n,l){return e.addEventListener(t,n,l),()=>e.removeEventListener(t,n,l)}function $(e,t,n){null==n?e.removeAttribute(t):e.getAttribute(t)!==n&&e.setAttribute(t,n)}function v(e,t){t=""+t,e.wholeText!==t&&(e.data=t)}function b(e,t){e.value=null==t?"":t}function y(e,t){for(let n=0;n<e.options.length;n+=1){const l=e.options[n];if(l.__value===t)return void(l.selected=!0)}}function x(e,t,n){e.classList[n?"add":"remove"](t)}let _;function w(e){_=e}function k(){if(!_)throw new Error("Function called outside component initialization");return _}const E=[],q=[],I=[],T=[],j=Promise.resolve();let N=!1;function A(e){I.push(e)}let B=!1;const S=new Set;function K(){if(!B){B=!0;do{for(let e=0;e<E.length;e+=1){const t=E[e];w(t),L(t.$$)}for(E.length=0;q.length;)q.pop()();for(let e=0;e<I.length;e+=1){const t=I[e];S.has(t)||(S.add(t),t())}I.length=0}while(E.length);for(;T.length;)T.pop()();N=!1,B=!1,S.clear()}}function L(e){if(null!==e.fragment){e.update(),l(e.before_update);const t=e.dirty;e.dirty=[-1],e.fragment&&e.fragment.p(e.ctx,t),e.after_update.forEach(A)}}const M=new Set;let O;function R(){O={r:0,c:[],p:O}}function z(){O.r||l(O.c),O=O.p}function H(e,t){e&&e.i&&(M.delete(e),e.i(t))}function P(e,t,n,l){if(e&&e.o){if(M.has(e))return;M.add(e),O.c.push(()=>{M.delete(e),l&&(n&&e.d(1),l())}),e.o(t)}}function C(e,t){const n=t.token={};function l(e,l,i,r){if(t.token!==n)return;t.resolved=r;let c=t.ctx;void 0!==i&&(c=c.slice(),c[i]=r);const o=e&&(t.current=e)(c);let s=!1;t.block&&(t.blocks?t.blocks.forEach((e,n)=>{n!==l&&e&&(R(),P(e,1,1,()=>{t.blocks[n]=null}),z())}):t.block.d(1),o.c(),H(o,1),o.m(t.mount(),t.anchor),s=!0),t.block=o,t.blocks&&(t.blocks[l]=o),s&&K()}if((i=e)&&"object"==typeof i&&"function"==typeof i.then){const n=k();if(e.then(e=>{w(n),l(t.then,1,t.value,e),w(null)},e=>{w(n),l(t.catch,2,t.error,e),w(null)}),t.current!==t.pending)return l(t.pending,0),!0}else{if(t.current!==t.then)return l(t.then,1,t.value,e),!0;t.resolved=e}var i}function W(e){e&&e.c()}function Z(e,n,r){const{fragment:c,on_mount:o,on_destroy:s,after_update:u}=e.$$;c&&c.m(n,r),A(()=>{const n=o.map(t).filter(i);s?s.push(...n):l(n),e.$$.on_mount=[]}),u.forEach(A)}function F(e,t){const n=e.$$;null!==n.fragment&&(l(n.on_destroy),n.fragment&&n.fragment.d(t),n.on_destroy=n.fragment=null,n.ctx=[])}function J(e,t){-1===e.$$.dirty[0]&&(E.push(e),N||(N=!0,j.then(K)),e.$$.dirty.fill(0)),e.$$.dirty[t/31|0]|=1<<t%31}function D(t,i,r,c,o,s,u=[-1]){const d=_;w(t);const f=i.props||{},p=t.$$={fragment:null,ctx:null,props:s,update:e,not_equal:o,bound:n(),on_mount:[],on_destroy:[],before_update:[],after_update:[],context:new Map(d?d.$$.context:[]),callbacks:n(),dirty:u,skip_bound:!1};let m=!1;if(p.ctx=r?r(t,f,(e,n,...l)=>{const i=l.length?l[0]:n;return p.ctx&&o(p.ctx[e],p.ctx[e]=i)&&(!p.skip_bound&&p.bound[e]&&p.bound[e](i),m&&J(t,e)),n}):[],p.update(),m=!0,l(p.before_update),p.fragment=!!c&&c(p.ctx),i.target){if(i.hydrate){const e=function(e){return Array.from(e.childNodes)}(i.target);p.fragment&&p.fragment.l(e),e.forEach(a)}else p.fragment&&p.fragment.c();i.intro&&H(t.$$.fragment),Z(t,i.target,i.anchor),K()}w(d)}class V{$destroy(){F(this,1),this.$destroy=e}$on(e,t){const n=this.$$.callbacks[e]||(this.$$.callbacks[e]=[]);return n.push(t),()=>{const e=n.indexOf(t);-1!==e&&n.splice(e,1)}}$set(e){var t;this.$$set&&(t=e,0!==Object.keys(t).length)&&(this.$$.skip_bound=!0,this.$$set(e),this.$$.skip_bound=!1)}}const G=[];function Q(t,n=e){let l;const i=[];function c(e){if(r(t,e)&&(t=e,l)){const e=!G.length;for(let e=0;e<i.length;e+=1){const n=i[e];n[1](),G.push(n,t)}if(e){for(let e=0;e<G.length;e+=2)G[e][0](G[e+1]);G.length=0}}}return{set:c,update:function(e){c(e(t))},subscribe:function(r,o=e){const s=[r,o];return i.push(s),1===i.length&&(l=n(c)||e),r(t),()=>{const e=i.indexOf(s);-1!==e&&i.splice(e,1),0===i.length&&(l(),l=null)}}}}const U={recipientName:{text:"Recipient Name",value:""},agencyName:{text:"Agency Name",value:""},foiaEmail:{text:"Public Records Email",value:""},agencyState:{text:"Agency State",value:""},agencyStreetAddress:{text:"Agency Street Address",value:""},agencyMunicipality:{text:"Agency Municipality",value:""},agencyZip:{text:"Agency ZIP Code",value:""}};Object.freeze(U);const X=function(){const{subscribe:e,set:t,update:n}=Q([Object.assign({},U)]);return{subscribe:e,addItem:()=>n(e=>[...e,Object.assign({},U)]),deleteItem:e=>n(t=>[...t.slice(0,e),...t.slice(e+1,t.length)]),changeItem:(e,t,l,i)=>{let r=e.map((e,n)=>{if(n===t){let t={};for(const n of Object.keys(U))t[n]=Object.create(e[n]),n===l&&(t[n].value=i);return t}return e});return n(e=>r)}}}(),Y=U,ee=function(t,n,r){const o=!Array.isArray(t),s=o?[t]:t,u=n.length<2;return function(e,t){return{subscribe:Q(e,t).subscribe}}(r,t=>{let r=!1;const a=[];let d=0,f=e;const p=()=>{if(d)return;f();const l=n(o?a[0]:a,t);u?t(l):f=i(l)?l:e},m=s.map((e,t)=>c(e,e=>{a[t]=e,d&=~(1<<t),r&&p()},()=>{d|=1<<t}));return r=!0,p(),function(){l(m),f()}})}(X,e=>e.length);function te(e,t,n){const l=e.slice();return l[11]=t[n],l}function ne(e){let t,n,l;return{c(){t=f("input"),$(t,"type",e[1]),$(t,"id",e[4]),$(t,"name",e[5]),t.value=e[6],$(t,"class","svelte-9497zi")},m(i,r){u(i,t,r),n||(l=h(t,"input",e[8]),n=!0)},p(e,n){2&n&&$(t,"type",e[1]),16&n&&$(t,"id",e[4]),32&n&&$(t,"name",e[5]),64&n&&t.value!==e[6]&&(t.value=e[6])},d(e){e&&a(t),n=!1,l()}}}function le(e){let t,n,l,i=e[2],r=[];for(let t=0;t<i.length;t+=1)r[t]=ie(te(e,i,t));return{c(){t=f("select");for(let e=0;e<r.length;e+=1)r[e].c();$(t,"id",e[4]),$(t,"name",e[5]),$(t,"class","svelte-9497zi")},m(i,c){u(i,t,c);for(let e=0;e<r.length;e+=1)r[e].m(t,null);y(t,e[7]),n||(l=h(t,"blur",e[8]),n=!0)},p(e,n){if(4&n){let l;for(i=e[2],l=0;l<i.length;l+=1){const c=te(e,i,l);r[l]?r[l].p(c,n):(r[l]=ie(c),r[l].c(),r[l].m(t,null))}for(;l<r.length;l+=1)r[l].d(1);r.length=i.length}16&n&&$(t,"id",e[4]),32&n&&$(t,"name",e[5]),132&n&&y(t,e[7])},d(e){e&&a(t),d(r,e),n=!1,l()}}}function ie(e){let t,n,l,i=e[11].name+"";return{c(){t=f("option"),n=m(i),t.__value=l=e[11].abbr,t.value=t.__value},m(e,l){u(e,t,l),s(t,n)},p(e,r){4&r&&i!==(i=e[11].name+"")&&v(n,i),4&r&&l!==(l=e[11].abbr)&&(t.__value=l,t.value=t.__value)},d(e){e&&a(t)}}}function re(t){let n,l,i,r,c,o=Y[t[0]].text+"";function d(e,t){return"select"===e[1]?le:ne}let p=d(t),h=p(t);return{c(){n=f("div"),l=f("label"),i=m(o),r=f("span"),c=g(),h.c(),x(r,"optional",!t[3]),x(r,"required",t[3]),$(l,"for",t[4]),$(l,"class","svelte-9497zi"),$(n,"class","form__field svelte-9497zi")},m(e,t){u(e,n,t),s(n,l),s(l,i),s(l,r),s(n,c),h.m(n,null)},p(e,[t]){1&t&&o!==(o=Y[e[0]].text+"")&&v(i,o),8&t&&x(r,"optional",!e[3]),8&t&&x(r,"required",e[3]),16&t&&$(l,"for",e[4]),p===(p=d(e))&&h?h.p(e,t):(h.d(1),h=p(e),h&&(h.c(),h.m(n,null)))},i:e,o:e,d(e){e&&a(n),h.d()}}}function ce(e,t,n){let l;o(e,X,e=>n(10,l=e));let i,r,c,s,{idx:u=0}=t,{fieldKey:a="recipientName"}=t,{fieldType:d="text"}=t,{options:f=[]}=t,{required:p=!1}=t;return e.$$set=e=>{"idx"in e&&n(9,u=e.idx),"fieldKey"in e&&n(0,a=e.fieldKey),"fieldType"in e&&n(1,d=e.fieldType),"options"in e&&n(2,f=e.options),"required"in e&&n(3,p=e.required)},e.$$.update=()=>{513&e.$$.dirty&&n(4,i=`id_${a}-${u}`),513&e.$$.dirty&&n(5,r=`${a}-${u}`),1537&e.$$.dirty&&n(6,c=l[u][a].value),70&e.$$.dirty&&n(7,s="select"===d&&f.length>0&&""===c?f[0].abbr:c)},[a,d,f,p,i,r,c,s,function(e){const t=e.target.value;X.changeItem(l,u,a,t)},u]}class oe extends V{constructor(e){super(),D(this,e,ce,re,r,{idx:9,fieldKey:0,fieldType:1,options:2,required:3})}}function se(t){return{c:e,m:e,p:e,i:e,o:e,d:e}}function ue(e){let t,n;return t=new oe({props:{idx:e[0],fieldKey:"agencyState",fieldType:"select",required:!0,options:e[6]}}),{c(){W(t.$$.fragment)},m(e,l){Z(t,e,l),n=!0},p(e,n){const l={};1&n&&(l.idx=e[0]),t.$set(l)},i(e){n||(H(t.$$.fragment,e),n=!0)},o(e){P(t.$$.fragment,e),n=!1},d(e){F(t,e)}}}function ae(t){return{c:e,m:e,p:e,i:e,o:e,d:e}}function de(e){let t,n,l,i,r,c,o,d;return{c(){t=f("button"),n=p("svg"),l=p("title"),i=m("Add New Item"),r=p("path"),$(r,"fill-rule","evenodd"),$(r,"d","M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"),$(r,"clip-rule","evenodd"),$(n,"role","img"),$(n,"width","25px"),$(n,"viewBox","0 0 20 20"),$(n,"fill","currentColor"),$(n,"class","plus w-6 h-6"),$(t,"id",c="add-"+e[0]),$(t,"class","svelte-16osli2")},m(e,c){u(e,t,c),s(t,n),s(n,l),s(l,i),s(n,r),o||(d=h(t,"click",X.addItem),o=!0)},p(e,n){1&n&&c!==(c="add-"+e[0])&&$(t,"id",c)},d(e){e&&a(t),o=!1,d()}}}function fe(e){let t,n,l,r,c,o,d,g;return{c(){t=f("button"),n=p("svg"),l=p("title"),r=m("Delete This Item"),c=p("path"),$(c,"fill-rule","evenodd"),$(c,"d","M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"),$(c,"clip-rule","evenodd"),$(n,"role","img"),$(n,"width","25px"),$(n,"viewBox","0 0 20 20"),$(n,"fill","currentColor"),$(n,"class","x w-6 h-6"),$(t,"id",o="delete-"+e[0]),$(t,"class","svelte-16osli2")},m(o,a){u(o,t,a),s(t,n),s(n,l),s(l,r),s(n,c),d||(g=h(t,"click",(function(){i(X.deleteItem(e[0]))&&X.deleteItem(e[0]).apply(this,arguments)})),d=!0)},p(n,l){e=n,1&l&&o!==(o="delete-"+e[0])&&$(t,"id",o)},d(e){e&&a(t),d=!1,g()}}}function pe(e){let t,n,l,i,r,c,o,d,p,b,y,x,_,w,k,E,q,I,T,j,N,A,B,S,K,L,M,O,R,z,J,D,V,G,Q;l=new oe({props:{idx:e[0],fieldKey:"recipientName"}}),c=new oe({props:{idx:e[0],fieldKey:"agencyName"}}),d=new oe({props:{idx:e[0],fieldKey:"foiaEmail",fieldType:"email",required:!0}});let U={ctx:e,current:null,token:null,pending:ae,then:ue,catch:se,value:6,blocks:[,,,]};C(b=e[3],U),_=new oe({props:{idx:e[0],fieldKey:"agencyStreetAddress"}}),k=new oe({props:{idx:e[0],fieldKey:"agencyZip"}}),q=new oe({props:{idx:e[0],fieldKey:"agencyMunicipality"}});let X=e[0]===e[2]-1&&de(e),Y=e[2]>1&&fe(e);return{c(){t=f("div"),n=f("div"),W(l.$$.fragment),i=g(),r=f("div"),W(c.$$.fragment),o=g(),W(d.$$.fragment),p=g(),U.block.c(),y=g(),x=f("div"),W(_.$$.fragment),w=g(),W(k.$$.fragment),E=g(),W(q.$$.fragment),I=g(),T=f("div"),j=f("div"),X&&X.c(),N=g(),A=f("div"),Y&&Y.c(),B=g(),S=f("div"),K=f("button"),L=m("Preview Request"),O=g(),R=f("div"),z=m(e[1]),$(n,"class","recipient__person"),$(r,"class","agency__general svelte-16osli2"),$(x,"class","agency__street svelte-16osli2"),$(j,"class","add__item"),$(A,"class","delete__item"),$(T,"class","new__items svelte-16osli2"),$(K,"id",M="expand-"+e[0]),$(K,"class","svelte-16osli2"),$(R,"id",J="template-"+e[0]),$(R,"class","template__results svelte-16osli2"),$(S,"class","expand__preview"),$(t,"class","recipient__item svelte-16osli2"),$(t,"id",D="recipient-"+e[0])},m(a,f){u(a,t,f),s(t,n),Z(l,n,null),s(t,i),s(t,r),Z(c,r,null),s(r,o),Z(d,r,null),s(r,p),U.block.m(r,U.anchor=null),U.mount=()=>r,U.anchor=null,s(t,y),s(t,x),Z(_,x,null),s(x,w),Z(k,x,null),s(x,E),Z(q,x,null),s(t,I),s(t,T),s(T,j),X&&X.m(j,null),s(T,N),s(T,A),Y&&Y.m(A,null),s(t,B),s(t,S),s(S,K),s(K,L),s(S,O),s(S,R),s(R,z),V=!0,G||(Q=h(K,"click",e[4]),G=!0)},p(n,[i]){e=n;const r={};1&i&&(r.idx=e[0]),l.$set(r);const o={};1&i&&(o.idx=e[0]),c.$set(o);const s={};1&i&&(s.idx=e[0]),d.$set(s);{const t=e.slice();t[6]=U.resolved,U.block.p(t,i)}const u={};1&i&&(u.idx=e[0]),_.$set(u);const a={};1&i&&(a.idx=e[0]),k.$set(a);const f={};1&i&&(f.idx=e[0]),q.$set(f),e[0]===e[2]-1?X?X.p(e,i):(X=de(e),X.c(),X.m(j,null)):X&&(X.d(1),X=null),e[2]>1?Y?Y.p(e,i):(Y=fe(e),Y.c(),Y.m(A,null)):Y&&(Y.d(1),Y=null),(!V||1&i&&M!==(M="expand-"+e[0]))&&$(K,"id",M),(!V||2&i)&&v(z,e[1]),(!V||1&i&&J!==(J="template-"+e[0]))&&$(R,"id",J),(!V||1&i&&D!==(D="recipient-"+e[0]))&&$(t,"id",D)},i(e){V||(H(l.$$.fragment,e),H(c.$$.fragment,e),H(d.$$.fragment,e),H(U.block),H(_.$$.fragment,e),H(k.$$.fragment,e),H(q.$$.fragment,e),V=!0)},o(e){P(l.$$.fragment,e),P(c.$$.fragment,e),P(d.$$.fragment,e);for(let e=0;e<3;e+=1){P(U.blocks[e])}P(_.$$.fragment,e),P(k.$$.fragment,e),P(q.$$.fragment,e),V=!1},d(e){e&&a(t),F(l),F(c),F(d),U.block.d(),U.token=null,U=null,F(_),F(k),F(q),X&&X.d(),Y&&Y.d(),G=!1,Q()}}}let me="/api/current-user/";function ge(e,t,n){let l;o(e,ee,e=>n(2,l=e));let{idx:i=0}=t,r="",c=fetch(me+"states").then(e=>e.json()).then(e=>e.states).catch(e=>{console.error(e)});return e.$$set=e=>{"idx"in e&&n(0,i=e.idx)},[i,r,l,c,async function(e){const t=document.getElementById("id_agencyState-"+i).value,l=me+"template/"+t,c=function(){let e={};const t=document.getElementById("recipient-"+i),n=[...document.getElementById("request").getElementsByTagName("textarea"),...document.getElementById("request").getElementsByTagName("input"),...t.getElementsByTagName("input"),...t.getElementsByTagName("select")];for(let t of n)e[t.id.replace("id_","").replace("-"+i,"")]=t.value;return e}();let o=await fetch(l).then(e=>e.json()).then(e=>function(e,t){let n=0,l="";for(let i of t.template){l+=t.boilerplate.slice(n,i.position);const r=e[i.field];l+=void 0===r?t[i.field]:r,n=i.position}return l+=t.boilerplate.slice(n,t.boilerplate.length),l}(c,e)).catch(e=>{console.error(e)});n(1,r=o)}]}class he extends V{constructor(e){super(),D(this,e,ge,pe,r,{idx:0})}}function $e(t){let n,i,r,c,o,d,p,m,v,y,x,_,w,k,E,q,I,T,j,N,A,B;return{c(){n=f("div"),i=f("div"),r=f("label"),r.innerHTML='Subject<span class="required"></span>',c=g(),o=f("input"),d=g(),p=f("div"),m=f("label"),m.innerHTML='Records Sought<span class="required"></span>',v=g(),y=f("textarea"),x=g(),_=f("div"),w=f("label"),w.innerHTML='Fee Waiver Justification<span class="optional svelte-1bcrtop"></span>',k=g(),E=f("textarea"),q=g(),I=f("div"),T=f("label"),T.innerHTML='Justification for Expedited Processing<span class="optional svelte-1bcrtop"></span>',j=g(),N=f("textarea"),$(r,"for","id_subject-line"),$(r,"class","svelte-1bcrtop"),$(o,"type","text"),$(o,"id","id_subject"),$(o,"name","subject"),$(o,"class","svelte-1bcrtop"),$(i,"class","subject__line"),$(m,"for","id_requestedRecords"),$(m,"class","svelte-1bcrtop"),$(y,"id","id_requestedRecords"),$(y,"name","requestedRecords"),$(y,"class","svelte-1bcrtop"),$(p,"class","records"),$(w,"for","id_feeWaiver"),$(w,"class","svelte-1bcrtop"),$(E,"id","id_feeWaiver"),$(E,"name","feeWaiver"),$(E,"class","svelte-1bcrtop"),$(_,"class","fee-waiver"),$(T,"for","id_expeditedProcessing"),$(T,"class","svelte-1bcrtop"),$(N,"id","id_expeditedProcessing"),$(N,"name","expeditedProcessing"),$(N,"class","svelte-1bcrtop"),$(I,"class","expedited-processing"),$(n,"id","request"),$(n,"class","request__container svelte-1bcrtop")},m(e,l){u(e,n,l),s(n,i),s(i,r),s(i,c),s(i,o),b(o,t[0]),s(n,d),s(n,p),s(p,m),s(p,v),s(p,y),b(y,t[1]),s(n,x),s(n,_),s(_,w),s(_,k),s(_,E),b(E,t[3]),s(n,q),s(n,I),s(I,T),s(I,j),s(I,N),b(N,t[2]),A||(B=[h(o,"input",t[4]),h(y,"input",ve),h(y,"input",t[5]),h(E,"input",ve),h(E,"input",t[6]),h(N,"input",ve),h(N,"input",t[7])],A=!0)},p(e,[t]){1&t&&o.value!==e[0]&&b(o,e[0]),2&t&&b(y,e[1]),8&t&&b(E,e[3]),4&t&&b(N,e[2])},i:e,o:e,d(e){e&&a(n),A=!1,l(B)}}}function ve(e){const t=e.target;t.clientHeight<t.scrollHeight&&(t.style.height=t.scrollHeight+20+"px")}function be(e,t,n){let l="",i="",r="",c="";return[l,i,r,c,function(){l=this.value,n(0,l)},function(){i=this.value,n(1,i)},function(){c=this.value,n(3,c)},function(){r=this.value,n(2,r)}]}class ye extends V{constructor(e){super(),D(this,e,be,$e,r,{})}}function xe(e,t,n){const l=e.slice();return l[3]=t[n],l[5]=n,l}function _e(t){let n,l;return n=new he({props:{states:t[2],idx:t[5]}}),{c(){W(n.$$.fragment)},m(e,t){Z(n,e,t),l=!0},p:e,i(e){l||(H(n.$$.fragment,e),l=!0)},o(e){P(n.$$.fragment,e),l=!1},d(e){F(n,e)}}}function we(e){let t,n,l,i,r,c,o,p,m,h,v,b;r=new ye({});let y=e[0],x=[];for(let t=0;t<y.length;t+=1)x[t]=_e(xe(e,y,t));const _=e=>P(x[e],1,1,()=>{x[e]=null});return{c(){t=f("div"),n=f("div"),l=f("h2"),l.textContent="Information about the Request",i=g(),W(r.$$.fragment),c=g(),o=f("div"),p=f("h2"),p.textContent="Information about the Recipients",m=g();for(let e=0;e<x.length;e+=1)x[e].c();h=g(),v=f("input"),$(l,"class","svelte-d6e61i"),$(n,"class","section__container svelte-d6e61i"),$(p,"class","svelte-d6e61i"),$(v,"type","hidden"),$(v,"name","num-items"),v.value=e[1],$(o,"class","section__container svelte-d6e61i"),$(t,"class","form__container svelte-d6e61i")},m(e,a){u(e,t,a),s(t,n),s(n,l),s(n,i),Z(r,n,null),s(t,c),s(t,o),s(o,p),s(o,m);for(let e=0;e<x.length;e+=1)x[e].m(o,null);s(o,h),s(o,v),b=!0},p(e,[t]){if(5&t){let n;for(y=e[0],n=0;n<y.length;n+=1){const l=xe(e,y,n);x[n]?(x[n].p(l,t),H(x[n],1)):(x[n]=_e(l),x[n].c(),H(x[n],1),x[n].m(o,h))}for(R(),n=y.length;n<x.length;n+=1)_(n);z()}(!b||2&t)&&(v.value=e[1])},i(e){if(!b){H(r.$$.fragment,e);for(let e=0;e<y.length;e+=1)H(x[e]);b=!0}},o(e){P(r.$$.fragment,e),x=x.filter(Boolean);for(let e=0;e<x.length;e+=1)P(x[e]);b=!1},d(e){e&&a(t),F(r),d(x,e)}}}function ke(e,t,n){let l,i;o(e,X,e=>n(0,l=e)),o(e,ee,e=>n(1,i=e));let r=fetch("/api/current-user/states");return[l,i,r]}return new class extends V{constructor(e){super(),D(this,e,ke,we,r,{})}}({target:document.getElementById("foia-request-items")})}();
//# sourceMappingURL=foia-request.js.map
