import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Clipboard, Send, RefreshCw } from 'lucide-react'
import { WalletSchemaValue } from '@/schemas'
import { toast } from 'sonner'
import { REACT_APP_API_BASE_URL } from '@/constants'
import axios from 'axios'
import { AirdropButton } from './AirDropButton'



interface WalletItemProps {
  wallet: WalletSchemaValue
  index: number
}

export const WalletItem: React.FC<WalletItemProps> = ({ wallet, index }) => {
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [balance, setBalance] = useState<string | null>(null)
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(`${type} copied to clipboard!`))
      .catch(() => toast.error(`Failed to copy ${type.toLowerCase()}`))
  }

  const getBalance = async () => {
    setIsLoadingBalance(true)
    try {
      const response = await axios.get<{ balance: string }>(
        `${REACT_APP_API_BASE_URL}/get-balance/${wallet.publicKey}`
      )
      setBalance(response.data.balance)
      toast.success('Balance updated successfully')
    } catch (error) {
      toast.error('Failed to fetch balance')
      console.error(error)
    } finally {
      setIsLoadingBalance(false)
    }
  }
  

  const sendTransaction = async () => {
    if (!recipient || !amount) {
      toast.error('Please enter recipient address and amount')
      return
    }

    setIsSending(true)
    try {
      const response = await axios.post(
        `${REACT_APP_API_BASE_URL}/send-transaction`,
        {
          fromPublicKey: wallet.publicKey,
          toPublicKey: recipient,
          amount: parseFloat(amount),
          privateKey: wallet.privateKey,
        }
      )
      toast.success('Transaction sent successfully', {
        description: `Signature: ${response.data.signature}`,
      })
      setRecipient('')
      setAmount('')
      await getBalance()
    } catch (error) {
      toast.error('Failed to send transaction')
      console.error(error)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <li className='bg-secondary p-4 rounded-lg space-y-3'>
      <div className='flex items-center justify-between'>
        <span className='text-sm font-medium'>
          {wallet.type.charAt(0).toUpperCase() + wallet.type.slice(1)} Wallet{' '}
          {index + 1}
        </span>
        <div className='space-x-2'>
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
          {wallet.type === 'solana' && (
            <Button size='sm' onClick={getBalance} disabled={isLoadingBalance}>
              <RefreshCw
                className={`h-3 w-3 mr-1 ${
                  isLoadingBalance ? 'animate-spin' : ''
                }`}
              />
              {isLoadingBalance ? 'Loading...' : 'Refresh Balance'}
            </Button>
          )}
          {wallet.type === 'solana' && (
            <AirdropButton
              publicKey={wallet.publicKey}
              onSuccess={getBalance}
            />
          )}
        </div>
      </div>
      <p className='font-mono text-xs break-all'>{wallet.publicKey}</p>
      {balance !== null && (
        <p className='text-sm font-medium'>
          Balance: {balance} {wallet.type === 'solana' ? 'SOL' : 'ETH'}
        </p>
      )}
      <div className='flex items-center space-x-2'>
        <Switch
          id={`show-private-key-${index}`}
          checked={showPrivateKey}
          onCheckedChange={setShowPrivateKey}
        />
        <Label htmlFor={`show-private-key-${index}`}>Show Private Key</Label>
      </div>
      {showPrivateKey && (
        <p className='text-xs text-muted-foreground'>
          Private Key: {wallet.privateKey}
        </p>
      )}
      <p className='text-xs text-muted-foreground'>Path: {wallet.path}</p>

      <div className='space-y-2'>
        <Input
          placeholder="Recipient's address"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
        <Input
          type='number'
          placeholder='Amount'
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Button
          onClick={sendTransaction}
          disabled={isSending}
          className='w-full'
        >
          <Send className='h-4 w-4 mr-2' />
          {isSending ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </li>
  )
}
