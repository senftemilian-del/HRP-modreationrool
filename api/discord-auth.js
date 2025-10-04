export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { code } = req.query;

    if (!code) {
        return res.status(400).json({ error: 'Kein Code vorhanden' });
    }

    const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
    const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
    const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;

    try {
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
            }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            return res.status(400).json({ error: 'Token-Fehler', details: tokenData });
        }

        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });

        const userData = await userResponse.json();

        if (!userResponse.ok) {
            return res.status(400).json({ error: 'Benutzer-Fehler', details: userData });
        }

        return res.status(200).json({
            id: userData.id,
            username: userData.username,
            discriminator: userData.discriminator,
            avatar: userData.avatar,
            global_name: userData.global_name || userData.username,
        });

    } catch (error) {
        console.error('OAuth Error:', error);
        return res.status(500).json({ error: 'Server-Fehler', details: error.message });
    }
}
