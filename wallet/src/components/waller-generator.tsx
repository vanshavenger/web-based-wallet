import axios from 'axios'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Clipboard, RefreshCw } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { useState } from 'react'
import { REACT_APP_API_BASE_URL } from '@/constants'

const WalletSchema = z.object({
  publicKey: z.string(),
  path: z.string(),
})

const WalletsResponseSchema = z.object({
  wallets: z.array(WalletSchema),
})

type Wallet = z.infer<typeof WalletSchema>

export const WalletGenerator: React.FC = () => {
 
  const [mnemonic, setMnemonic] = useState<string>('')
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [walletCount, setWalletCount] = useState<number>(5)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)

  const generateMnemonic = async () => {
    try {
      const response = await axios.post<{ mnemonic: string }>(
        `${REACT_APP_API_BASE_URL}/generate-mnemonic`
      )
      setMnemonic(response.data.mnemonic)
      setWallets([])
      toast.success('New mnemonic generated')
    } catch (error) {
      toast.error('Failed to generate mnemonic')
      console.error(error)
    }
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(`${type} copied to clipboard!`))
      .catch(() => toast.error(`Failed to copy ${type.toLowerCase()}`))
  }

  const generateWallets = async () => {
    if (!mnemonic.trim()) {
      toast.error(
        'Mnemonic is required. Please generate or enter a mnemonic first.'
      )
      return
    }

    setIsGenerating(true)

    try {
      const response = await axios.post(
        `${REACT_APP_API_BASE_URL}/generate-wallets`,
        {
          mnemonic,
          walletCount,
        }
      )

      const parsedResponse = WalletsResponseSchema.parse(response.data)
      setWallets(parsedResponse.wallets)

      toast.success(
        `Generated ${walletCount} wallet${walletCount > 1 ? 's' : ''}`,
        {
          description:
            "Click on a wallet's 'Copy' button to copy its public key.",
        }
      )
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error('Invalid response from server. Please try again.')
      } else {
        toast.error(
          'An error occurred while generating wallets. Please try again.'
        )
      }
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className='space-y-8'>
      <Card>
        <CardHeader>
          <CardTitle>Generate Wallets</CardTitle>
          <CardDescription>
            Enter a mnemonic or generate a new one to create Solana wallets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-6'>
            <div>
              <label className='block text-sm font-medium mb-2'>
                Mnemonic Phrase:
              </label>
              <div className='flex items-center space-x-2'>
                <Input
                  value={mnemonic}
                  onChange={(e) => setMnemonic(e.target.value)}
                  placeholder='Enter or generate mnemonic'
                  className='flex-grow'
                />
                <Button
                  onClick={() => copyToClipboard(mnemonic, 'Mnemonic')}
                  size='icon'
                  variant='outline'
                  title='Copy mnemonic'
                  disabled={!mnemonic}
                >
                  <Clipboard className='h-4 w-4' />
                </Button>
                <Button
                  onClick={generateMnemonic}
                  size='icon'
                  variant='outline'
                  title='Generate new mnemonic'
                >
                  <RefreshCw className='h-4 w-4' />
                </Button>
              </div>
            </div>
            <div>
              <label className='block text-sm font-medium mb-2'>
                Number of Wallets: {walletCount}
              </label>
              <Slider
                value={[walletCount]}
                onValueChange={(value) => setWalletCount(value[0])}
                max={20}
                min={1}
                step={1}
                className='mb-4'
              />
            </div>
            <Button
              onClick={generateWallets}
              className='w-full'
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Wallets'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {wallets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Wallets</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className='space-y-3'>
              {wallets.map((wallet, index) => (
                <li key={index} className='bg-secondary p-3 rounded-lg'>
                  <div className='flex items-center justify-between mb-1'>
                    <span className='text-sm font-medium'>
                      Wallet {index + 1}
                    </span>
                    <Button
                      onClick={() =>
                        copyToClipboard(
                          wallet.publicKey,
                          `Wallet ${index + 1} public key`
                        )
                      }
                      size='sm'
                      variant='outline'
                    >
                      <Clipboard className='h-3 w-3 mr-1' /> Copy
                    </Button>
                  </div>
                  <p className='font-mono text-xs break-all'>
                    {wallet.publicKey}
                  </p>
                  <p className='text-xs text-muted-foreground mt-1'>
                    Path: {wallet.path}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
