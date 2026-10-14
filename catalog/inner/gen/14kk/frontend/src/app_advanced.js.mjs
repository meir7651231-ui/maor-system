// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:frontend/src/app_advanced.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$AdvancedAssetManagerApp$httpRequest$Promise$onload$data(xhr) {
    const data = JSON.parse(xhr.responseText);
    return data;
}
export function inner$AdvancedAssetManagerApp$updateTasksList$forEach$statusClass(task) {
    const statusClass = task.status === 'completed' ? 'completed' :
        task.status === 'in_progress' ? 'in-progress' : 'pending';
    return statusClass;
}
export function inner$AdvancedAssetManagerApp$updateTasksList$forEach$statusIcon(task) {
    const statusIcon = task.status === 'completed' ? '✅' :
        task.status === 'in_progress' ? '🔄' : '⏳';
    return statusIcon;
}

export const SIGS = {
  inner$AdvancedAssetManagerApp$httpRequest$Promise$onload$data: [{"name":"xhr","d":{"t":"obj","n":"XMLHttpRequest","p":[["onreadystatechange",{"t":"or","of":[{"t":"null"},{"t":"fn"}]},false],["readyState",{"t":"num"},false],["response",{"t":"any"},false],["responseText",{"t":"str"},false],["responseType",{"t":"lit","v":["","arraybuffer","blob","document","json","text"]},false],["responseURL",{"t":"str"},false],["responseXML",{"t":"or","of":[{"t":"null"},{"t":"any"}]},false],["status",{"t":"num"},false],["statusText",{"t":"str"},false],["timeout",{"t":"num"},false],["upload",{"t":"obj","n":"XMLHttpRequestUpload","p":[["addEventListener",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false],["onabort",{"t":"or","of":[{"t":"null"},{"t":"fn"}]},false],["onerror",{"t":"or","of":[{"t":"null"},{"t":"fn"}]},false],["onload",{"t":"or","of":[{"t":"null"},{"t":"fn"}]},false],["onloadend",{"t":"or","of":[{"t":"null"},{"t":"fn"}]},false],["onloadstart",{"t":"or","of":[{"t":"null"},{"t":"fn"}]},false],["onprogress",{"t":"or","of":[{"t":"null"},{"t":"fn"}]},false],["ontimeout",{"t":"or","of":[{"t":"null"},{"t":"fn"}]},false],["dispatchEvent",{"t":"fn"},false]]},false],["withCredentials",{"t":"bool"},false],["abort",{"t":"fn"},false],["getAllResponseHeaders",{"t":"fn"},false],["getResponseHeader",{"t":"fn"},false],["open",{"t":"fn"},false],["overrideMimeType",{"t":"fn"},false],["send",{"t":"fn"},false],["setRequestHeader",{"t":"fn"},false],["UNSENT",{"t":"lit","v":[0]},false],["OPENED",{"t":"lit","v":[1]},false],["HEADERS_RECEIVED",{"t":"lit","v":[2]},false],["LOADING",{"t":"lit","v":[3]},false],["DONE",{"t":"lit","v":[4]},false],["addEventListener",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false],["onabort",{"t":"or","of":[{"t":"null"},{"t":"fn"}]},false],["onerror",{"t":"or","of":[{"t":"null"},{"t":"fn"}]},false],["onload",{"t":"or","of":[{"t":"null"},{"t":"fn"}]},false],["onloadend",{"t":"or","of":[{"t":"null"},{"t":"fn"}]},false],["onloadstart",{"t":"or","of":[{"t":"null"},{"t":"fn"}]},false],["onprogress",{"t":"or","of":[{"t":"null"},{"t":"fn"}]},false],["ontimeout",{"t":"or","of":[{"t":"null"},{"t":"fn"}]},false],["dispatchEvent",{"t":"fn"},false]]},"opt":false}],
  inner$AdvancedAssetManagerApp$updateTasksList$forEach$statusClass: [{"name":"task","d":{"t":"undef"},"opt":false}],
  inner$AdvancedAssetManagerApp$updateTasksList$forEach$statusIcon: [{"name":"task","d":{"t":"undef"},"opt":false}],
};
