const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const envConfig = `export const env = {
    apiKey: "${process.env.API_KEY}"
};`;

fs.writeFileSync('./src/environments/env.ts', envConfig);
console.log('⚡ Archivo env.ts generado con éxito 🚀');
