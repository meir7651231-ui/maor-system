/** חוט · is-admin — הכרעת-מנהל. חוזה: is-admin.contract.md */
export function isAdmin(adminEmails, email) {
  if (!adminEmails || adminEmails.length === 0) return true;
  if (!email) return false;
  const e = email.trim().toLowerCase();
  return adminEmails.some((a) => a.trim().toLowerCase() === e);
}
