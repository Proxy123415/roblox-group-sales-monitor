/**
 * 
 * Setup: npm install express axios dotenv cheerio
 */

const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL;
const ROBLOX_GROUP_ID = process.env.ROBLOX_GROUP_ID;
const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;
const ROBLOX_COOKIE = process.env.ROBLOX_COOKIE;

let lastCheckTime = Date.now();
let lastKnownRevenue = 0;

function formatNumber(num) {
	return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Discord notification
async function notifyDiscord(title, description, details = {}) {
	if (!DISCORD_WEBHOOK) {
		console.warn('Discord webhook not configured');
		return;
	}

	const embed = {
		title: title,
		description: description,
		color: 3447003,
		fields: Object.entries(details).map(([key, value]) => ({
			name: key,
			value: String(value),
			inline: true
		})),
		footer: {
			text: 'Roblox Group Sales Monitor'
		},
		timestamp: new Date().toISOString()
	};

	try {
		await axios.post(DISCORD_WEBHOOK, { embeds: [embed] });
		console.log('Notified Discord');
	} catch (error) {
		console.error('Failed to send Discord notification:', error.message);
	}
}

// Roblox API
async function monitorGroupRevenueAPI() {
	if (!ROBLOX_GROUP_ID) {
		console.warn('ROBLOX_GROUP_ID not configured');
		return null;
	}

	if (!ROBLOX_COOKIE) {
		console.warn('ROBLOX_COOKIE not configured - revenue API monitoring disabled');
		console.warn('Get your .ROBLOSECURITY cookie and add it to .env');
		return null;
	}

	try {
		const response = await axios.get(
			`https://groups.roblox.com/v1/groups/${ROBLOX_GROUP_ID}/revenue`,
			{
				headers: {
					'Cookie': `.ROBLOSECURITY=${ROBLOX_COOKIE}`,
					'User-Agent': 'Mozilla/5.0'
				}
			}
		);

		const revenueData = response.data;
		const pending = revenueData.revenueByType?.Pending || 0;
		const available = revenueData.revenueByType?.Available || 0;
		const converted = revenueData.revenueByType?.Converted || 0;
		const totalRevenue = pending + available + converted;

		console.log(`Group Revenue:
  - Pending: ${formatNumber(pending)} Robux
  - Available: ${formatNumber(available)} Robux
  - Converted: ${formatNumber(converted)} Robux
  - Total: ${formatNumber(totalRevenue)} Robux`);

		// Notify if new revenue detected
		if (lastKnownRevenue > 0 && totalRevenue > lastKnownRevenue) {
			const newRevenue = totalRevenue - lastKnownRevenue;
			await notifyDiscord(
				'Group Revenue Increase.',
				`Your group earned new Robux.`,
				{
					'New Revenue': `${formatNumber(newRevenue)} Robux`,
					'Total Revenue': `${formatNumber(totalRevenue)} Robux`,
					'Timestamp': new Date().toUTCString()
				}
			);
		}

		lastKnownRevenue = totalRevenue;
		return revenueData;
	} catch (error) {
		console.error('Error fetching group revenue:', error.message);
		if (error.response?.status === 403) {
			console.error('Authentication failed - check your ROBLOX_COOKIE');
		}
		return null;
	}
}

// Open Cloud API
async function monitorUniverseSalesAPI() {
	if (!ROBLOX_API_KEY) {
		console.warn('ROBLOX_API_KEY not configured');
		return null;
	}

	if (!process.env.ROBLOX_UNIVERSE_ID) {
		console.warn('ROBLOX_UNIVERSE_ID not configured');
		return null;
	}

	try {
		// earnings data
		const response = await axios.get(
			`https://apis.roblox.com/developer-exchange/v1/earnings`,
			{
				headers: {
					'x-api-key': ROBLOX_API_KEY
				}
			}
		);

		console.log('Retrieved earnings via Open Cloud API');
		return response.data;
	} catch (error) {
		console.error('Error with Open Cloud API:', error.message);
		if (error.response?.status === 401) {
			console.error('Invalid API key - check ROBLOX_API_KEY');
		}
		return null;
	}
}

// Webhook receiver - for game to send sales data
app.post('/api/sales', express.json(), (req, res) => {
	const { playerName, playerId, productName, price } = req.body;

	if (!playerName || !playerId || !productName || !price) {
		return res.status(400).json({ error: 'Missing required fields' });
	}

	notifyDiscord(
		'New Sale.',
		`${playerName} purchased an item`,
		{
			'Player': playerName,
			'Product': productName,
			'Price': `${formatNumber(price)} Robux`,
			'Timestamp': new Date().toUTCString()
		}
	);

	res.json({ success: true, message: 'Sale logged' });
});

// Health check
app.get('/health', (req, res) => {
	res.json({
		status: 'healthy',
		uptime: process.uptime(),
		lastCheck: new Date(lastCheckTime).toISOString(),
		groupId: ROBLOX_GROUP_ID
	});
});

// monitoring
if (ROBLOX_GROUP_ID && process.env.ENABLE_POLLING === 'true') {
	console.log('Starting group sales monitoring...');
	
	if (ROBLOX_COOKIE) {
		setInterval(monitorGroupRevenueAPI, 60000);
		monitorGroupRevenueAPI(); 
		console.log('Method: Revenue API (authenticated)');
	} else if (ROBLOX_API_KEY) {
		setInterval(monitorUniverseSalesAPI, 60000);
		console.log('Method: Open Cloud API');
	} else {
		console.warn('No authentication configured');
		console.warn('To enable monitoring, set one of these in .env:');
		console.warn('  - ROBLOX_COOKIE (your .ROBLOSECURITY cookie)');
		console.warn('  - ROBLOX_API_KEY (your Open Cloud API key)');
	}
}

app.listen(PORT, () => {
	console.log(`Roblox Group Sales Monitor`);
	console.log(`Server: http://localhost:${PORT}`);
	console.log(`Group ID: ${ROBLOX_GROUP_ID || 'Not configured'}`);
	console.log(`Discord Webhook: ${DISCORD_WEBHOOK ? '✓' : '✗'}`);
	console.log(`Revenue API Auth: ${ROBLOX_COOKIE ? '✓' : '✗'}`);
	console.log(`Open Cloud API: ${ROBLOX_API_KEY ? '✓' : '✗'}`);
});

module.exports = app;