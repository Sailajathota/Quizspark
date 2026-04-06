import { io } from 'socket.io-client';

// Connect to the backend server. Vercel will inject VITE_BACKEND_URL in production.
const URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
export const socket = io(URL);
