# Pinata IPFS Setup Guide

This guide will help you set up Pinata (free cloud IPFS service) for your project.

## Why Pinata?

- **Free Tier**: 1GB storage + 10GB bandwidth/month (perfect for capstone projects!)
- **Always Available**: Files stay accessible even when your server is down
- **Global Access**: Public gateway accessible from anywhere
- **Easy Setup**: Simple API integration

## Step 1: Create Pinata Account

1. Go to [https://pinata.cloud](https://pinata.cloud)
2. Sign up for a free account
3. Verify your email

## Step 2: Get API Keys

1. Log in to Pinata
2. Go to **Account Settings** → **API Keys**
3. Click **"New Key"**
4. Give it a name (e.g., "Capstone Project")
5. Select permissions:
   - Toggle **Admin** ON (simplest) OR customize:
     - ✅ **Files: Write** (required for uploads)
     - ✅ **Files: Read** (optional, for retrieval)
     - ✅ **Gateways: Read** (optional, for accessing files)
6. Click **"Create Key"**
7. **Copy the JWT Token immediately** (you won't see it again!):
   - **JWT Token** (looks like `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - You may also see API Key and Secret Key (legacy method, still works)

## Step 3: Install Dependencies

The Pinata SDK is already added to `package.json`. Just install:

```bash
cd backend/services/auth-service
npm install

# Also for business-service if you're using it
cd ../business-service
npm install
```

## Step 4: Configure Environment Variables

Add these to your `.env` files:

### For `backend/services/auth-service/.env`:

**Option 1: JWT Token (Recommended - Modern Method)**
```env
# IPFS Configuration
IPFS_PROVIDER=pinata
PINATA_JWT=your_jwt_token_here
PINATA_GATEWAY_URL=https://gateway.pinata.cloud/ipfs/
```

**Option 2: API Key + Secret (Legacy Method - Still Works)**
```env
# IPFS Configuration
IPFS_PROVIDER=pinata
PINATA_API_KEY=your_api_key_here
PINATA_SECRET_KEY=your_secret_key_here
PINATA_GATEWAY_URL=https://gateway.pinata.cloud/ipfs/
```

### For `backend/services/business-service/.env`:

Use the same format as above.

**Important**: 
- **JWT Method (Recommended)**: Use `PINATA_JWT` with your JWT token
- **Legacy Method**: Use `PINATA_API_KEY` and `PINATA_SECRET_KEY` if you prefer the old method
- The code will automatically try JWT first, then fall back to API Key + Secret if JWT is not provided

## Step 5: Restart Your Services

```bash
# Stop your services
# Then restart them
cd backend/services
npm start
```

You should see in the logs:
```
✅ IPFS: Pinata authenticated successfully
IPFS service initialized { provider: 'pinata', apiUrl: '...' }
```

## Step 6: Test It!

Upload a file through your API. The file will be:
- Uploaded to Pinata's IPFS network
- Automatically pinned (stored permanently)
- Accessible via: `https://gateway.pinata.cloud/ipfs/{CID}`

## Gateway URLs

Your files will be accessible via:
- **Pinata Gateway**: `https://gateway.pinata.cloud/ipfs/{CID}` (default, free)
- **Public IPFS Gateway**: `https://ipfs.io/ipfs/{CID}` (also works)
- **Custom Gateway**: You can set up a custom domain in Pinata (paid plans)

## Free Tier Limits

- **Storage**: 1GB total
- **Bandwidth**: 10GB/month
- **Files**: Unlimited number of files (as long as total < 1GB)

## If You Need More

If you exceed the free tier:
- **Filebase**: $20/month for 1TB (cheapest paid option)
- **Pinata Paid**: Starts at $20/month for 1TB
- **Web3.Storage**: $10/month for 100GB

## Troubleshooting

### "Pinata authentication failed"
- Check that your API keys are correct
- Make sure there are no extra spaces in `.env` file
- Verify keys are active in Pinata dashboard

### "IPFS service not available"
- Check that `IPFS_PROVIDER=pinata` is set
- Verify `@pinata/sdk` is installed: `npm list @pinata/sdk`
- Check service logs for errors

### Files not accessible
- Wait a few seconds after upload (IPFS propagation)
- Try different gateway: `https://ipfs.io/ipfs/{CID}`
- Check Pinata dashboard to see if file is pinned

## Switching Back to Local IPFS

If you want to use local IPFS (Docker) instead:

```env
IPFS_PROVIDER=local
IPFS_API_URL=http://127.0.0.1:5001
IPFS_GATEWAY_URL=http://127.0.0.1:8080/ipfs/
```

## More Information

- [Pinata Documentation](https://docs.pinata.cloud/)
- [Pinata Pricing](https://pinata.cloud/pricing)
- [IPFS Documentation](https://docs.ipfs.io/)
