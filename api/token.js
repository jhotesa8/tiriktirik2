// api/token.js
import { AccessToken } from 'livekit-server-sdk';

export default async function handler(req, res) {
  // Cabeceras CORS manuales (respaldo)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Responder a la petición de verificación (OPTIONS) para evitar el 404
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { identity, room } = req.body;
    if (!identity || !room) {
      return res.status(400).json({ error: 'Faltan identity o room' });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    // Usar la URL de entorno de Vercel si está disponible
    const serverUrl = process.env.LIVEKIT_URL || process.env.VERCEL_URL;

    if (!apiKey || !apiSecret || !serverUrl) {
      return res.status(500).json({ error: 'Faltan configurar las variables de entorno' });
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: identity,
      ttl: '15m',
    });

    at.addGrant({
      roomJoin: true,
      room: room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();
    res.status(200).json({ token, url: serverUrl });

  } catch (error) {
    console.error('Error generando token:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}