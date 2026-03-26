import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This ensures we find the .env file whether running from src or dist
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('Config loaded. DATABASE_URL present:', !!process.env.DATABASE_URL);
export default process.env;
