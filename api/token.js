// api/token.js
import { AccessToken } from 'livekit-server-sdk';

export default async function handler(req, res) {
  // 1. Cabeceras CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 2. Responder al Preflight (OPTIONS) para evitar el error de CORS
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
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

    // 5. Variables de entorno (SOLO usar LIVEKIT_URL que empieza con wss://)
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const serverUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !serverUrl) {
      console.error('Faltan variables de entorno');
      return res.status(500).json({ error: 'Faltan configurar las variables de entorno en Vercel' });
    }

    // 6. Crear el token (Duración de 2 horas)
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
    
    // 7. Devolver token y la URL correcta
    res.status(200).json({ token, url: serverUrl });

  } catch (error) {
    console.error('Error generando token:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
}
