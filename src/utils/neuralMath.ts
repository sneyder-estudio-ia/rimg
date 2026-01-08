
// --- NÚCLEO MATEMÁTICO DE EVA (NO SIMULADO) ---

export const calculateRSI = (prices: number[], period: number = 14): number => {
    if (prices.length < period + 1) return 50; // Datos insuficientes

    let gains = 0;
    let losses = 0;

    // Calcular primera media
    for (let i = 1; i <= period; i++) {
        const change = prices[i] - prices[i - 1];
        if (change > 0) gains += change;
        else losses += Math.abs(change);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Suavizado posterior
    for (let i = period + 1; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1];
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? Math.abs(change) : 0;

        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
};

export const calculateVolatility = (prices: number[]): number => {
    if (prices.length === 0) return 0;
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / prices.length;
    return Math.sqrt(variance);
};

export const detectWhaleActivity = (volumes: number[]): boolean => {
    if (volumes.length < 10) return false;
    const recent = volumes[volumes.length - 1];
    const avg = volumes.slice(0, volumes.length - 1).reduce((a, b) => a + b, 0) / (volumes.length - 1);
    return recent > avg * 2.5; // Si el volumen actual es 2.5x el promedio, es una ballena
};
