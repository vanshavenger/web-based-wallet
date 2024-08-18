import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import * as bip39 from 'bip39'
import { HDKey } from 'micro-ed25519-hdkey'
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { ethers } from 'ethers'
import { z } from 'zod'
import rateLimit from 'express-rate-limit'
import bs58 from 'bs58'
import { configDotenv } from 'dotenv'

configDotenv()

const app = express()
const port = 8080

app.use(cors())
app.use(express.json())

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30
})

app.use(limiter)

const WalletSchema = z.object({
  publicKey: z.string(),
  path: z.string(),
  privateKey: z.string(),
  balance: z.number().optional(),
  type: z.enum(['solana', 'ethereum'])
})

const GenerateWalletRequestSchema = z.object({
  mnemonic: z.string().min(1),
  walletType: z.enum(['solana', 'ethereum']),
  index: z.number().int().min(0),
})

const SendTransactionRequestSchema = z.object({
  fromPublicKey: z.string(),
  toPublicKey: z.string(),
  amount: z.number().positive(),
  privateKey: z.string(),
})

type Wallet = z.infer<typeof WalletSchema>

app.post('/generate-mnemonic', (req: Request, res: Response) => {
  const mnemonic = bip39.generateMnemonic()
  res.json({ mnemonic })
})

app.post('/request-airdrop', async (req: Request, res: Response) => {
  try {
    const { publicKey } = req.body

    if (!publicKey) {
      return res.status(400).json({ error: "Public key is required" })
    }

    const connection = new Connection(process.env.SOLANA_RPC || "https://api.testnet.solana.com", "confirmed")
    
    try {
      const airdropSignature = await connection.requestAirdrop(
        new PublicKey(publicKey),
        LAMPORTS_PER_SOL
      )
      
      await connection.confirmTransaction(airdropSignature)
      
      res.json({ signature: airdropSignature })
    } catch (error) {
      console.error("Error requesting airdrop:", error)
      res.status(500).json({ error: "Failed to request airdrop" })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "An unexpected error occurred" })
  }
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

app.post('/send-transaction', async (req: Request, res: Response) => {
  try {
    const { fromPublicKey, toPublicKey, amount, privateKey } = SendTransactionRequestSchema.parse(req.body)

    const connection = new Connection(process.env.SOLANA_RPC || "https://api.testnet.solana.com", "confirmed")
    const fromPubkey = new PublicKey(fromPublicKey)
    const toPubkey = new PublicKey(toPublicKey)
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: amount * LAMPORTS_PER_SOL,
      })
    )

    const signers = [Keypair.fromSecretKey(bs58.decode(privateKey))]

    const signature = await connection.sendTransaction(transaction, signers)
    
    res.json({ signature })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid input", details: error.errors })
    } else {
      console.error(error)
      res.status(500).json({ error: "An unexpected error occurred" })
    }
  }
})

app.get('/get-balance/:publicKey', async (req: Request, res: Response) => {
  try {
    const { publicKey } = req.params
    
    if (!publicKey) {
      return res.status(400).json({ error: "Public key is required" })
    }

    const connection = new Connection(process.env.SOLANA_RPC || "https://api.testnet.solana.com", "confirmed")
    
    try {
      const balance = await connection.getBalance(new PublicKey(publicKey))
      const solBalance = balance / LAMPORTS_PER_SOL
      res.json({ balance: solBalance.toFixed(9) }) // 9 decimal places for SOL
    } catch (error) {
      console.error("Error fetching balance:", error)
      res.status(500).json({ error: "Failed to fetch balance" })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "An unexpected error occurred" })
  }
})

function generateSolanaWallet(seed: Buffer, index: number): Wallet {
  const hd = HDKey.fromMasterSeed(seed)
  const path = `m/44'/501'/${index}'/0'`
  const keypair = Keypair.fromSeed(hd.derive(path).privateKey)
  return {
    publicKey: keypair.publicKey.toBase58(),
    path: path,
    privateKey: bs58.encode(keypair.secretKey),
    type: 'solana', 

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
    type: 'ethereum',
  }
}



app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})