// api/token.js
import { AccessToken } from 'livekit-server-sdk';

export default async function handler(req, res) {
  // Permitir peticiones desde tu frontend (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // 1. Recibir datos del usuario y la sala desde el frontend
    const { identity, room } = req.body;
    if (!identity || !room) {
      return res.status(400).json({ error: 'Faltan identity o room' });
    }

    // 2. Leer las credenciales desde las variables de entorno (NUNCA las pongas en el código)
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const serverUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !serverUrl) {
      return res.status(500).json({ error: 'Faltan configurar las variables de entorno' });
    }

    // 3. Crear el Token de acceso con una duración corta (ej. 15 minutos)
    const at = new AccessToken(apiKey, apiSecret, {
      identity: identity,
      ttl: '15m', // El token expira rápido, el frontend pedirá uno nuevo si es necesario
    });

    // 4. Dar los permisos necesarios (entrar a la sala, publicar cámara/micrófono, etc.)
    at.addGrant({
      roomJoin: true,
      room: room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    // 5. Firmar y devolver el token
    const token = await at.toJwt();
    res.status(200).json({ token, url: serverUrl });

  } catch (error) {
    console.error('Error generando token:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}