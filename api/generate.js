export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const raw = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => data += chunk.toString());
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });

    const parsed = JSON.parse(raw);
    const messages = parsed.messages || [];

    console.log('Messages count:', messages.length);
    console.log('API key exists:', !!process.env.ANTHROPIC_API_KEY);
    console.log('API key prefix:', process.env.ANTHROPIC_API_KEY?.substring(0, 20));

    const payload = {
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      messages: messages
    };

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
      console.error('Status:', response.status);
      console.error('Error type:', data?.error?.type);
      console.error('Error msg:', data?.error?.message);
      return res.status(response.status).json(data);
    }

    console.log('OK! Blocks:', data.content?.length);
    return res.status(200).json(data);

  } catch (err) {
    console.error('Exception:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
