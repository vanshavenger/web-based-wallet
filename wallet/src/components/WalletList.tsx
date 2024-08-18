import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExtendedWalletSchemaValue, WalletItem } from './WalletItem'

interface WalletListProps {
  wallets: ExtendedWalletSchemaValue[]
}

export const WalletList: React.FC<WalletListProps> = ({ wallets }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Generated Wallets</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className='space-y-3'>
          {wallets.map((wallet, index) => (
            <WalletItem
              key={`${wallet.type}-${index}`}
              wallet={wallet}
              index={wallets
                .filter((w) => w.type === wallet.type)
                .indexOf(wallet)}
            />
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
