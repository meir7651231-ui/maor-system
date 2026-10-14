// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/courses/RetentionCenter.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function scoreColor(score) {
    if (score >= 80)
        return { bg: '#fdeaea', c: '#b91c1c' };
    if (score >= 60)
        return { bg: '#fdf1d4', c: '#9a6414' };
    return { bg: '#f2e8dc', c: '#8b6b3d' };
}
export function inner$RetentionCenter$memberName$m(memberId, f) {
    const m = f.members.find((x) => x.id === memberId);
    return m;
}
export function inner$RetentionCenter$map$col(ins) {
    const col = scoreColor(ins.score);
    return col;
}

export const SIGS = {
  inner$RetentionCenter$memberName$m: [{"name":"memberId","d":{"t":"str"},"opt":false},{"name":"f","d":{"t":"obj","n":"Family","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["father",{"t":"str"},false],["fatherId",{"t":"str"},false],["mother",{"t":"str"},false],["motherId",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["email",{"t":"str"},false],["city",{"t":"str"},false],["address",{"t":"str"},false],["community",{"t":"str"},false],["maritalStatus",{"t":"str"},false],["language",{"t":"str"},false],["tzedaka",{"t":"str"},false],["fullSefach",{"t":"bool"},false],["discount",{"t":"str"},false],["status",{"t":"lit","v":["pending","active","inactive"]},false],["notes",{"t":"str"},false],["kidsHome",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["kidsMarried",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["members",{"t":"arr","of":{"t":"obj","n":"Member","p":[["id",{"t":"str"},false],["first",{"t":"str"},false],["gender",{"t":"lit","v":["m","f"]},false],["birth",{"t":"str"},false],["idNum",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["school",{"t":"str"},false],["grade",{"t":"str"},false],["health",{"t":"str"},false],["mSefach",{"t":"bool"},false],["mInvite",{"t":"bool"},false],["mRecommend",{"t":"bool"},false],["mPhotos",{"t":"bool"},false],["mVideos",{"t":"bool"},false],["mConsentAt",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Partial","p":[["mSefach",{"t":"any"},true],["mInvite",{"t":"any"},true],["mRecommend",{"t":"any"},true],["mPhotos",{"t":"any"},true],["mVideos",{"t":"any"},true]]}]},true],["notes",{"t":"str"},false],["isParent",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["docs",{"t":"arr","of":{"t":"obj","n":"FamilyDoc","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["addedAt",{"t":"str"},false]]}},false],["cred",{"t":"obj","n":"FamilyCred","p":[["score",{"t":"num"},false],["log",{"t":"arr","of":{"t":"obj","n":"CredLogEntry","p":[["date",{"t":"str"},false],["delta",{"t":"num"},false],["reason",{"t":"str"},false]]}},false]]},false],["createdAt",{"t":"str"},false]]},"opt":false}],
  inner$RetentionCenter$map$col: [{"name":"ins","d":{"t":"obj","n":"DropoutInsight","p":[["enrollmentId",{"t":"str"},false],["memberId",{"t":"str"},false],["courseId",{"t":"str"},false],["absences",{"t":"num"},false],["debt",{"t":"num"},false],["score",{"t":"num"},false],["reason",{"t":"str"},false]]},"opt":false}],
};
