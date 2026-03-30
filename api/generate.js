export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Đọc body thủ công — đảm bảo hoạt động trên mọi Node version
    const raw = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => data += chunk.toString());
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });

    console.log('Raw body:', raw.substring(0, 200));

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error('JSON parse error:', e.message);
      return res.status(400).json({ error: 'Invalid JSON body' });
    }

    const messages = parsed.messages || [];
    console.log('Messages count:', messages.length);

    if (!messages.length) {
      return res.status(400).json({ error: 'No messages provided' });
    }

    const payload = {
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2000,
      messages: messages
    };

    console.log('Sending to Anthropic, model:', payload.model);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic error:', JSON.stringify(data));
      return res.status(response.status).json(data);
    }

    console.log('Success! Content blocks:', data.content?.length);
    return res.status(200).json(data);

  } catch (err) {
    console.error('Handler error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
