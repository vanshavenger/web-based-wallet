import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import * as bip39 from 'bip39'
import { HDKey } from 'micro-ed25519-hdkey'
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { ethers } from 'ethers'
import * as ecc from 'tiny-secp256k1'
import { BIP32Factory } from 'bip32'
import { z } from 'zod'
import rateLimit from 'express-rate-limit'
import bs58 from 'bs58'
import axios from 'axios'
import { configDotenv } from 'dotenv'

configDotenv()

const bip32 = BIP32Factory(ecc)

const app = express()
const port = 8080

app.use(cors())
app.use(express.json())

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30
})

// app.use(limiter)

const WalletSchema = z.object({
  publicKey: z.string(),
  path: z.string(),
  privateKey: z.string(),
})

const GenerateWalletRequestSchema = z.object({
  mnemonic: z.string().min(1),
  walletType: z.enum(['solana', 'ethereum']),
  index: z.number().int().min(0),
})

type Wallet = z.infer<typeof WalletSchema>

app.post('/generate-mnemonic', (req: Request, res: Response) => {
  const mnemonic = bip39.generateMnemonic()
  res.json({ mnemonic })
})

app.post('/ask-airdrop', async (req: Request, res: Response) => {
  const { publicKey } = req.body
  if (!publicKey) {
    return res.status(400).json({ error: "Public key is required" })
  }

  const connection = new Connection("https://api.testnet.solana.com", "confirmed");
  const myAddress = new PublicKey(publicKey);
  const signature = await connection.requestAirdrop(myAddress, LAMPORTS_PER_SOL);

  console.log("Airdrop requested with signature", signature);
  await connection.confirmTransaction(signature);
})

app.post('/generate-wallet', async (req: Request, res: Response) => {
  try {
    const { mnemonic, walletType, index } = GenerateWalletRequestSchema.parse(req.body)

    if (!bip39.validateMnemonic(mnemonic)) {
      return res.status(400).json({ error: "Invalid mnemonic" })
    }

    const seed = await bip39.mnemonicToSeed(mnemonic)
    let wallet: Wallet

    switch (walletType) {
      case 'solana':
        wallet = generateSolanaWallet(seed, index)
        break
      case 'ethereum':
        wallet = generateEthereumWallet(seed, index)
        break
      default:
        return res.status(400).json({ error: "Invalid wallet type" })
    }

    res.json({ wallets: [wallet] })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid input", details: error.errors })
    } else {
      console.error(error)
      res.status(500).json({ error: "An unexpected error occurred" })
    }
  }
})

app.post('/get-balance', async (req: Request, res: Response) => {
  const { publicKey } = req.body
  if (!publicKey) {
    return res.status(400).json({ error: "Public key is required" })
  }

  let data = JSON.stringify({
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getBalance",
  "params": [
    publicKey
  ]
});

let config = {
  method: 'post',
  maxBodyLength: Infinity,
  url: process.env.SOLANA_RPC,
  data : data
};

const response = await axios.request(config)

  
  const balance = parseInt(response.data.result.value)
  const correctBalance = (balance / 1000_000_000).toString()

  res.json({ balance: correctBalance })
})

function generateSolanaWallet(seed: Buffer, index: number): Wallet {
  const hd = HDKey.fromMasterSeed(seed)
  const path = `m/44'/501'/${index}'/0'`
  const keypair = Keypair.fromSeed(hd.derive(path).privateKey)
  return {
    publicKey: keypair.publicKey.toBase58(),
    path: path,
    privateKey: bs58.encode(keypair.secretKey),
  }
}

function generateEthereumWallet(seed: Buffer, index: number): Wallet {
  const hdNode = ethers.HDNodeWallet.fromSeed(seed)
  const path = `m/44'/60'/0'/0/${index}`
  const wallet = hdNode.derivePath(path)
  return {
    publicKey: wallet.address,
    path: path,
    privateKey: wallet.privateKey,
  }
}



app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})