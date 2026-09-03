import{$t as e}from"./jsx-runtime-BgzJBctb.js";function t(e){let t=String(e??``);return/^[=+\-@\t\r]/.test(t)&&(t=`'`+t),t.includes(`,`)||t.includes(`"`)||t.includes(`
`)||t.includes(`\r`)?`"`+t.replace(/"/g,`""`)+`"`:t}function n(t,n,r){if(!e())return;let i=document.createElement(`a`);i.href=URL.createObjectURL(new Blob([`﻿`+r],{type:n})),i.download=t,i.click(),setTimeout(()=>URL.revokeObjectURL(i.href),5e3)}function r(e,r){n(e,`text/csv;charset=utf-8`,r.map(e=>e.map(t).join(`,`)).join(`
`))}function i(e,t){n(e,`text/plain;charset=utf-8`,t.join(`
`))}export{i as n,r as t};