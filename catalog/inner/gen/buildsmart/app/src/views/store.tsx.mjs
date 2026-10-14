// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:app/src/views/store.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const orders = [
    { id: 'BS-1234', items: '12 פריטים', total: '₪5,420', stageLabel: 'בדרך 🚛', time: '24.5, 14:00', color: '#4CAF50' },
    { id: 'BS-1221', items: '5 פריטים', total: '₪1,890', stageLabel: 'מוכן 📦', time: '24.5, 09:30', color: '#2196F3' },
    { id: 'BS-1198', items: '3 פריטים', total: '₪630', stageLabel: 'בהכנה 🔧', time: '23.5', color: '#FF9800' },
    { id: 'BS-1171', items: '8 פריטים', total: '₪2,240', stageLabel: 'הסתיימה ✓', time: '21.5', color: '#888888' },
    { id: 'BS-1155', items: '2 פריטים', total: '₪310', stageLabel: 'הסתיימה ✓', time: '19.5', color: '#888888' },
];
export function inner$OrderSheet$order(orderId) {
    const order = orders.find((o) => o.id === orderId);
    return order;
}

export const SIGS = {
  inner$OrderSheet$order: [{"name":"orderId","d":{"t":"str"},"opt":false}],
};
