import { io } from 'socket.io-client';

const SOCKET_URL = 'https://jayantsadhwani.me';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
});
