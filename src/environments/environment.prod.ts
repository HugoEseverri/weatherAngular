export const environment = {
    production: true,
    apiKey: typeof window !== 'undefined' ? (window as any).API_KEY || '' : ''
};
