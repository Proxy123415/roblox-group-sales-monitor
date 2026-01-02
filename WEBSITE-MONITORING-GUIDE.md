# Logging Group Sales from the Website to Discord

Yes! You can monitor your Roblox group sales from the website without being in a game. Here are the methods:

## Method 1: Revenue API (Recommended - Real-time)

This is the **most reliable** method for monitoring actual group earnings in real-time.

### Setup:

1. **Get your Roblox Cookie:**
   - Open Roblox.com in your browser
   - Open **Developer Tools** (F12)
   - Go to **Application** → **Cookies** → roblox.com
   - Find `.ROBLOSECURITY` cookie and copy its value
   - ⚠️ **KEEP THIS SECRET** - don't share it!

2. **Configure .env:**
   ```
   ROBLOX_GROUP_ID=12345
   ROBLOX_COOKIE=your_roblosecurity_cookie_here
   DISCORD_WEBHOOK_URL=https://discordapp.com/api/webhooks/...
   ENABLE_POLLING=true
   ```

3. **Run the monitor:**
   ```
   npm install
   npm start
   ```

4. **What it does:**
   - Checks your group revenue every 60 seconds
   - Shows: Pending Robux, Available Robux, Converted Robux
   - Sends Discord notification when revenue increases
   - No game required!

## Method 2: Open Cloud API

Official Roblox API - more features but requires setup.

### Setup:

1. **Create an API Key:**
   - Go to https://create.roblox.com/credentials
   - Create a new API key
   - Give it permission for: **Analytics**, **Universe**
   - Copy your key

2. **Get your Universe ID:**
   - Open your Roblox game in Studio
   - Copy the Universe ID from **File** → **Game Settings**

3. **Configure .env:**
   ```
   ROBLOX_UNIVERSE_ID=123456789
   ROBLOX_API_KEY=your_api_key_here
   DISCORD_WEBHOOK_URL=https://discordapp.com/api/webhooks/...
   ENABLE_POLLING=true
   ```

4. **Run:**
   ```
   npm start
   ```

## Method 3: Hybrid Approach (Game + Website)

Use both methods together:

1. Run the game script (previous setup) for **per-purchase** notifications
2. Run the website monitor for **total revenue tracking**

This gives you both real-time individual sales AND overall revenue growth.

## Comparison

| Method | Real-time | Details | Setup | Reliability |
|--------|-----------|---------|-------|-------------|
| **Revenue API** | ✓ Very fast | Pending/Available/Converted | Easy | ★★★★★ |
| **Open Cloud** | ⚠️ Slower | Universe analytics | Medium | ★★★★☆ |
| **Game Script** | ✓ Instant | Per-purchase data | Easy | ★★★★★ |
| **Combined** | ✓ Best | All data | Medium | ★★★★★ |

## Troubleshooting

### "No revenue data" on Revenue API:
- Your `.ROBLOSECURITY` cookie might be expired
- Get a fresh cookie from the browser
- Make sure you have the right **Group ID** (not user ID)

### Open Cloud API returns 401:
- Your API key might be invalid
- Regenerate it at https://create.roblox.com/credentials
- Make sure you have correct **Universe ID**

### No Discord notifications:
- Check that ENABLE_POLLING=true in .env
- Verify Discord webhook URL is correct
- Check server console for error messages

### "Cookie not configured" warning:
- Either set `ROBLOX_COOKIE` in .env
- Or set `ROBLOX_API_KEY` + `ROBLOX_UNIVERSE_ID`
- At least one authentication method is required

## Security Notes

- ✓ The .ROBLOSECURITY cookie gives access to your account
- ✓ Store it in `.env` (add to .gitignore)
- ✓ Never commit .env to GitHub
- ✓ Change your password if the cookie is exposed
- ✓ The API key should be kept private too

## File Structure

```
├── group-sales-monitor.js   # Main monitoring script
├── package.json             # Dependencies
├── .env                     # Your configuration (DO NOT COMMIT)
├── .env.example             # Template
└── WEBSITE-MONITORING-GUIDE.md  # This file
```

## Next Steps

1. Choose your method (Revenue API recommended)
2. Run `npm install`
3. Configure `.env`
4. Run `npm start`
5. Check Discord for notifications
