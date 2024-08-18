import { z } from 'zod'

export const WalletSchema = z.object({
  publicKey: z.string(),
  path: z.string(),
  privateKey: z.string(),
  balance: z.number().optional(),
  type: z.enum(['solana', 'ethereum'])
})

export type WalletSchemaValue = z.infer<typeof WalletSchema>

export const WalletsResponseSchema = z.object({
  wallets: z.array(WalletSchema),
})

export type WalletsResponseSchemaValue = z.infer<typeof WalletsResponseSchema>
