const fetch = require('node-fetch');

app.get('/proxy/train-live', async (req, res) => {
    try {
        const trainNo = req.query.no;
        const response = await fetch(`https://taiwanhelper.com/api/get-train-live?no=${trainNo}`, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('回應不是 JSON 格式!');
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ 
            error: error.message,
            message: '無法獲取車次資訊'
        });
    }
}); 