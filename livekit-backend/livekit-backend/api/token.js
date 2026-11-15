// api/token.js
import { AccessToken } from 'livekit-server-sdk';

export default async function handler(req, res) {
  // 1. Cabeceras CORS mejoradas
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); // En producción, cámbialo por tu dominio: 'https://tiriktirik.byethost22.com'
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 2. Responder al Preflight (Esto evita el error 404 en la consola)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 3. Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
  }

  try {
    // 4. Parsear el body (Vercel a veces lo envía como string)
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const { identity, room } = body || {};

    if (!identity || !room) {
      return res.status(400).json({ error: 'Faltan los parámetros identity o room' });
    }

    // 5. Variables de entorno (Asegúrate de tener LIVEKIT_URL con el wss://)
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const serverUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !serverUrl) {
      console.error('Faltan variables de entorno');
      return res.status(500).json({ error: 'Faltan configurar las variables de entorno en Vercel' });
    }

    // 6. Crear el token (Aumenté el ttl a 2 horas para que no se corte rápido)
    const at = new AccessToken(apiKey, apiSecret, {
      identity: identity,
      ttl: '2h', 
    });

    at.addGrant({
      roomJoin: true,
      room: room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();
    
    // 7. Devolver token y la URL correcta de LiveKit
    res.status(200).json({ token, url: serverUrl });

  } catch (error) {
    console.error('Error generando token:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
}
