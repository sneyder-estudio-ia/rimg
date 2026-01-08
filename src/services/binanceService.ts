
import CryptoJS from 'crypto-js';

const BASE_URL = 'https://api.binance.com';
const WS_BASE = 'wss://stream.binance.com:9443/ws';

// --- UTILIDADES DE FIRMA ---
const signQuery = (query: string, secret: string) => {
    return CryptoJS.HmacSHA256(query, secret).toString(CryptoJS.enc.Hex);
};

const buildQueryString = (params: Record<string, any>) => {
    return Object.keys(params)
        .map(key => `${key}=${encodeURIComponent(params[key])}`)
        .join('&');
};

// --- API PÚBLICA (DATOS DE MERCADO) ---

// Obtener velas históricas (Klines) para análisis técnico
export const getCandles = async (symbol: string, interval: string = '15m', limit: number = 50) => {
    try {
        const response = await fetch(`${BASE_URL}/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`);
        if (!response.ok) throw new Error('Error fetching klines');
        const data = await response.json();
        // Mapeamos a un formato útil: [Time, Open, High, Low, Close, Volume]
        return data.map((k: any[]) => ({
            time: k[0],
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5])
        }));
    } catch (error) {
        console.error("Error obteniendo velas:", error);
        return [];
    }
};

export const subscribeToTicker = (symbol: string, callback: (data: any) => void) => {
    const ws = new WebSocket(`${WS_BASE}/${symbol.toLowerCase()}@ticker`);
    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        callback({
            price: parseFloat(msg.c),
            change24h: parseFloat(msg.P),
            high24h: parseFloat(msg.h),
            low24h: parseFloat(msg.l),
            volume: parseFloat(msg.v).toFixed(2)
        });
    };
    return ws;
};

export const subscribeToDepth = (symbol: string, callback: (data: any) => void) => {
    const ws = new WebSocket(`${WS_BASE}/${symbol.toLowerCase()}@depth10@100ms`);
    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        callback({
            bids: msg.bids.map((b: string[]) => ({ price: parseFloat(b[0]), size: parseFloat(b[1]) })),
            asks: msg.asks.map((a: string[]) => ({ price: parseFloat(a[0]), size: parseFloat(a[1]) })).reverse()
        });
    };
    return ws;
};

// --- API PRIVADA (EJECUCIÓN REAL) ---
export const getAccountInfo = async (apiKey: string, apiSecret: string) => {
    const endpoint = '/api/v3/account';
    const timestamp = Date.now();
    const params = { timestamp };
    const queryString = buildQueryString(params);
    const signature = signQuery(queryString, apiSecret);
    
    try {
        const response = await fetch(`${BASE_URL}${endpoint}?${queryString}&signature=${signature}`, {
            method: 'GET',
            headers: { 'X-MBX-APIKEY': apiKey }
        });
        
        if (!response.ok) throw new Error(await response.text());
        return await response.json();
    } catch (error) {
        console.error("Fallo crítico obteniendo cuenta:", error);
        throw error;
    }
};

export const executeOrder = async (
    apiKey: string, 
    apiSecret: string, 
    symbol: string, 
    side: 'BUY' | 'SELL', 
    quantity: number,
    price?: number // Si se omite, es MARKET order
) => {
    const endpoint = '/api/v3/order';
    const timestamp = Date.now();
    
    const params: any = {
        symbol: symbol.toUpperCase(),
        side,
        type: price ? 'LIMIT' : 'MARKET',
        quantity,
        timestamp,
        timeInForce: price ? 'GTC' : undefined
    };

    if (price) params.price = price;

    // Limpiar undefined
    Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

    const queryString = buildQueryString(params);
    const signature = signQuery(queryString, apiSecret);

    try {
        const response = await fetch(`${BASE_URL}${endpoint}?${queryString}&signature=${signature}`, {
            method: 'POST',
            headers: { 
                'X-MBX-APIKEY': apiKey,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (!response.ok) throw new Error(await response.text());
        return await response.json();
    } catch (error) {
        console.error("EJECUCIÓN FALLIDA:", error);
        throw error;
    }
};
