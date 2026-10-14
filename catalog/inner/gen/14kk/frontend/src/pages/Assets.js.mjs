// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:frontend/src/pages/Assets.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$Assets$calculateReturn$totalReturn(purchasePrice, currentPrice, quantity) {
    const totalReturn = (currentPrice - purchasePrice) * quantity;
    return totalReturn;
}
export function inner$Assets$calculateReturn$returnPercentage(purchasePrice, currentPrice) {
    const returnPercentage = ((currentPrice - purchasePrice) / purchasePrice) * 100;
    return returnPercentage;
}
export function inner$Assets$filteredAssets(assets, searchTerm, filterType) {
    const filteredAssets = assets.filter(asset => {
        const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.symbol.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'all' || asset.type === filterType;
        return matchesSearch && matchesFilter;
    });
    return filteredAssets;
}
export function inner$Assets$filter$matchesSearch(searchTerm, asset) {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
}
export function inner$Assets$filter$matchesFilter(filterType, asset) {
    const matchesFilter = filterType === 'all' || asset.type === filterType;
    return matchesFilter;
}

export const SIGS = {
  inner$Assets$calculateReturn$totalReturn: [{"name":"purchasePrice","d":{"t":"num"},"opt":false},{"name":"currentPrice","d":{"t":"num"},"opt":false},{"name":"quantity","d":{"t":"num"},"opt":false}],
  inner$Assets$calculateReturn$returnPercentage: [{"name":"purchasePrice","d":{"t":"num"},"opt":false},{"name":"currentPrice","d":{"t":"num"},"opt":false}],
  inner$Assets$filteredAssets: [{"name":"assets","d":{"t":"any"},"opt":false},{"name":"searchTerm","d":{"t":"any"},"opt":false},{"name":"filterType","d":{"t":"any"},"opt":false}],
  inner$Assets$filter$matchesSearch: [{"name":"searchTerm","d":{"t":"any"},"opt":false},{"name":"asset","d":{"t":"any"},"opt":false}],
  inner$Assets$filter$matchesFilter: [{"name":"filterType","d":{"t":"any"},"opt":false},{"name":"asset","d":{"t":"any"},"opt":false}],
};
