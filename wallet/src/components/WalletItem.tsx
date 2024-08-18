import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Clipboard } from 'lucide-react'
import { WalletSchemaValue } from '@/schemas'
import { toast } from 'sonner'
import { REACT_APP_API_BASE_URL } from '@/constants'
import axios from 'axios'

export type WalletType = 'solana' | 'ethereum'
export interface ExtendedWalletSchemaValue extends WalletSchemaValue {
  type: WalletType
}

interface WalletItemProps {
  wallet: ExtendedWalletSchemaValue
  index: number
}

export const WalletItem: React.FC<WalletItemProps> = ({ wallet, index }) => {
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [showBalance, setShowBalance] = useState('')

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(`${type} copied to clipboard!`))
      .catch(() => toast.error(`Failed to copy ${type.toLowerCase()}`))
  }

  //   const requestForAirdrop = async (publicKey: string) => {
  //     try {
  //       await axios.post<{ mnemonic: string }>(
  //         `${REACT_APP_API_BASE_URL}/ask-airdrop`,
  //         { publicKey }
  //       )
  //       toast.success('Airdrop requested successfully')
  //     } catch (error) {
  //       toast.error('Failed to request airdrop')
  //       console.error(error)
  //     }
  //   }

  const getBalance = async (publicKey: string) => {
    try {
      const response = await axios.post<{ balance: number }>(
        `${REACT_APP_API_BASE_URL}/get-balance`,
        { publicKey }
      )
      setShowBalance(response.data.balance.toString())
      toast.success('Balance requested successfully')
    } catch (error) {
      toast.error('Failed to request balance')
      console.error(error)
    }
  }

  return (
    <li className='bg-secondary p-3 rounded-lg'>
      <div className='flex items-center justify-between mb-1'>
        <span className='text-sm font-medium'>
          {wallet.type.charAt(0).toUpperCase() + wallet.type.slice(1)} Wallet{' '}
          {index + 1}
        </span>
        <div className='gap-2 space-x-2'>
          <Button
            onClick={() =>
              copyToClipboard(
                wallet.publicKey,
                `${wallet.type} Wallet ${index + 1} public key`
              )
            }
            size='sm'
            variant='outline'
          >
            <Clipboard className='h-3 w-3 mr-1' /> Copy
          </Button>
          {/* <Button size={'sm'} onClick={() => requestForAirdrop(wallet.publicKey)}>
            Request Airdrop
          </Button> */}
          {wallet.type === 'solana' && (
            <Button size={'sm'} onClick={() => getBalance(wallet.publicKey)}>
              Get Balance
            </Button>
          )}
        </div>
      </div>
      <p className='font-mono text-xs break-all'>{wallet.publicKey}</p>
      <div className='flex items-center space-x-2 mt-2'>
        <Switch
          id={`show-private-key-${index}`}
          checked={showPrivateKey}
          onCheckedChange={setShowPrivateKey}
        />
        <Label htmlFor={`show-private-key-${index}`}>Show Private Key</Label>
      </div>
      {showPrivateKey && (
        <p className='text-xs text-muted-foreground mt-1'>
          Private Key: {wallet.privateKey}
        </p>
      )}
      {showBalance && (
        <p className='text-xs text-red-500 mt-1'>Balance: {showBalance}</p>
      )}
      <p className='text-xs text-muted-foreground mt-1'>Path: {wallet.path}</p>
    </li>
  )
}
