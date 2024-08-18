import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { RefreshCw, Plus } from 'lucide-react'
import { MnemonicDisplay } from './MnemonicDisplay'

interface WalletGeneratorFormProps {
  mnemonic: string
  setMnemonic: React.Dispatch<React.SetStateAction<string>>
  mnemonicSaved: boolean
  setMnemonicSaved: React.Dispatch<React.SetStateAction<boolean>>
  generateMnemonic: () => Promise<void>
  generateWallet: () => Promise<void>
  isGenerating: boolean
  activeTab: 'solana' | 'ethereum'
}

export const WalletGeneratorForm: React.FC<WalletGeneratorFormProps> = ({
  mnemonic,
  setMnemonic,
  mnemonicSaved,
  setMnemonicSaved,
  generateMnemonic,
  generateWallet,
  isGenerating,
  activeTab,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Generate {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}{' '}
          Wallets
        </CardTitle>
        <CardDescription>
          Generate a mnemonic, then create wallets from it
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          {!mnemonicSaved && (
            <div>
              <label className='block text-sm font-medium mb-2'>
                Mnemonic Phrase:
              </label>
              <div className='flex items-center space-x-2 mb-2'>
                <Input
                  value={mnemonic}
                  onChange={(e) => setMnemonic(e.target.value)}
                  placeholder='Enter or generate mnemonic'
                  className='flex-grow'
                />
                <Button
                  onClick={generateMnemonic}
                  size='sm'
                  variant='outline'
                  title='Generate new mnemonic'
                  disabled={!!isGenerating || !!mnemonic}
                >
                  <RefreshCw className='h-4 w-4 mr-2' />
                  Generate
                </Button>
              </div>
              {mnemonic && (
                <MnemonicDisplay
                  mnemonic={mnemonic}
                  mnemonicSaved={mnemonicSaved}
                  setMnemonicSaved={setMnemonicSaved}
                />
              )}
            </div>
          )}
          <Button
            onClick={generateWallet}
            className='w-full'
            disabled={isGenerating || !mnemonicSaved}
          >
            <Plus className='h-4 w-4 mr-2' />
            {isGenerating
              ? 'Generating...'
              : `Add ${
                  activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
                } Wallet`}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
