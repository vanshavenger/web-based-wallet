import React from 'react'
import { Button } from '@/components/ui/button'
import { Clipboard } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface MnemonicDisplayProps {
  mnemonic: string
  mnemonicSaved: boolean
  setMnemonicSaved: React.Dispatch<React.SetStateAction<boolean>>
}

export const MnemonicDisplay: React.FC<MnemonicDisplayProps> = ({
  mnemonic,
  mnemonicSaved,
  setMnemonicSaved,
}) => {
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(`${type} copied to clipboard!`))
      .catch(() => toast.error(`Failed to copy ${type.toLowerCase()}`))
  }

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-3 gap-2'>
        {mnemonic.split(' ').map((word, index) => (
          <div key={index} className='bg-secondary p-2 rounded text-center'>
            <span className='text-muted-foreground mr-2'>{index + 1}.</span>
            {word}
          </div>
        ))}
      </div>
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-2'>
          <Checkbox
            id='mnemonicSaved'
            checked={mnemonicSaved}
            onCheckedChange={(checked) => setMnemonicSaved(checked as boolean)}
          />
          <Label htmlFor='mnemonicSaved'>I have saved my mnemonic phrase</Label>
        </div>
        <Button
          onClick={() => copyToClipboard(mnemonic, 'Mnemonic')}
          size='sm'
          variant='outline'
        >
          <Clipboard className='h-4 w-4 mr-2' /> Copy
        </Button>
      </div>
    </div>
  )
}
