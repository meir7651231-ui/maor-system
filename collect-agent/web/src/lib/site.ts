// דומיין ההשקה — מקור יחיד ב-marketing/launch/launch.json (נבדק בסנכרון: tests/test_launch_domain.py).
// להחלפה: python3 marketing/launch/set_domain.py <דומיין> — מעדכן גם את הקובץ הזה.
export const SITE_DOMAIN = 'gabi.example';
export const siteUrl = (path = '') => `https://${SITE_DOMAIN}${path}`;
