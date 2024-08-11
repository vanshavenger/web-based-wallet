import express from 'express';
import cors from 'cors';
import * as bip39 from 'bip39';
import { HDKey } from 'micro-ed25519-hdkey';
import { Keypair } from '@solana/web3.js';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';


const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100 
});

app.use(limiter);

const WalletSchema = z.object({
  publicKey: z.string(),
  path: z.string(),
});

const GenerateWalletsRequestSchema = z.object({
  mnemonic: z.string().min(1),
  walletCount: z.number().int().min(1).max(20),
});

type Wallet = z.infer<typeof WalletSchema>;

app.post('/generate-mnemonic', (req, res) => {
  const mnemonic = bip39.generateMnemonic();
  res.json({ mnemonic });
});

app.post('/generate-wallets', async (req, res) => {
  try {
    const { mnemonic, walletCount } = GenerateWalletsRequestSchema.parse(req.body);

    if (!bip39.validateMnemonic(mnemonic)) {
      return res.status(400).json({ error: "Invalid mnemonic" });
    }

    const seed = await bip39.mnemonicToSeed(mnemonic);
    const hd = HDKey.fromMasterSeed(seed.toString("hex"));
    const wallets: Wallet[] = Array.from({ length: walletCount }, (_, i) => {
      const path = `m/44'/501'/${i}'/0'`;
      const keypair = Keypair.fromSeed(hd.derive(path).privateKey);
      return {
        publicKey: keypair.publicKey.toBase58(),
        path: path
      };
    });

    res.json({ wallets });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid input", details: error.errors });
    } else {
      console.error(error);
      res.status(500).json({ error: "An unexpected error occurred" });
    }
  }
});


app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
