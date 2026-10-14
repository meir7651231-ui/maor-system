// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/cloud/LoginScreen.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$LoginScreen$eyeIcon(showPass) {
    const eyeIcon = showPass ? '🙈' : '👁';
    return eyeIcon;
}
export function inner$PendingApprovalScreen$failed(reqStatus) {
    const failed = !!reqStatus && reqStatus !== 'ok';
    return failed;
}

export const SIGS = {
  inner$LoginScreen$eyeIcon: [{"name":"showPass","d":{"t":"bool"},"opt":false}],
  inner$PendingApprovalScreen$failed: [{"name":"reqStatus","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
};
