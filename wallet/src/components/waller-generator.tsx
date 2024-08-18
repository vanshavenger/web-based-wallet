import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { z } from 'zod'
import { REACT_APP_API_BASE_URL } from '@/constants'
import { WalletSchemaValue, WalletsResponseSchema } from '@/schemas'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WalletGeneratorForm } from './WalletGeneratorForm'
import { WalletList } from './WalletList'

export type WalletType = 'solana' | 'ethereum'

export const WalletGenerator: React.FC = () => {
  const [mnemonic, setMnemonic] = useState<string>('')
  const [wallets, setWallets] = useState<WalletSchemaValue[]>([])
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [mnemonicSaved, setMnemonicSaved] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<WalletType>('solana')

  const generateMnemonic = async () => {
    try {
      const response = await axios.post<{ mnemonic: string }>(
        `${REACT_APP_API_BASE_URL}/generate-mnemonic`
      )
      setMnemonic(response.data.mnemonic)
      setMnemonicSaved(false)
      setWallets([])
      toast.success('New mnemonic generated')
    } catch (error) {
      toast.error('Failed to generate mnemonic')
      console.error(error)
    }
  }

  const generateWallet = async () => {
    if (!mnemonic.trim()) {
      toast.error(
        'Mnemonic is required. Please generate or enter a mnemonic first.'
      )
      return
    }

    setIsGenerating(true)

    try {
      const response = await axios.post(
        `${REACT_APP_API_BASE_URL}/generate-wallet`,
        {
          mnemonic,
          walletType: activeTab,
          index: wallets.filter((w) => w.type === activeTab).length,
        }
      )

      const parsedResponse = WalletsResponseSchema.parse(response.data)
      const newWallet: WalletSchemaValue = {
        ...parsedResponse.wallets[0],
        type: activeTab,
      }
      setWallets([...wallets, newWallet])

      toast.success(`Generated new ${activeTab} wallet`, {
        description:
          "Click on the wallet's 'Copy' button to copy its public key.",
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error('Invalid response from server. Please try again.')
      } else {
        toast.error(
          'An error occurred while generating wallet. Please try again.'
        )
      }
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className='space-y-8'>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as WalletType)}
      >
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='solana'>Solana</TabsTrigger>
          <TabsTrigger value='ethereum'>Ethereum</TabsTrigger>
        </TabsList>
        <TabsContent value='solana'>
          <WalletGeneratorForm
            mnemonic={mnemonic}
            setMnemonic={setMnemonic}
            mnemonicSaved={mnemonicSaved}
            setMnemonicSaved={setMnemonicSaved}
            generateMnemonic={generateMnemonic}
            generateWallet={generateWallet}
            isGenerating={isGenerating}
            activeTab={activeTab}
          />
        </TabsContent>
        <TabsContent value='ethereum'>
          <WalletGeneratorForm
            mnemonic={mnemonic}
            setMnemonic={setMnemonic}
            mnemonicSaved={mnemonicSaved}
            setMnemonicSaved={setMnemonicSaved}
            generateMnemonic={generateMnemonic}
            generateWallet={generateWallet}
            isGenerating={isGenerating}
            activeTab={activeTab}
          />
        </TabsContent>
      </Tabs>

      <WalletList wallets={wallets} />
    </div>
  )
}
