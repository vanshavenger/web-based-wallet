import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'
import { REACT_APP_API_BASE_URL } from '@/constants'

interface AirdropButtonProps {
  publicKey: string
  onSuccess: () => void
}

export const AirdropButton: React.FC<AirdropButtonProps> = ({
  publicKey,
  onSuccess,
}) => {
  const [isAirdropping, setIsAirdropping] = useState<boolean>(false)

  const handleAirdrop = async () => {
    setIsAirdropping(true)
    try {
      const response = await axios.post(
        `${REACT_APP_API_BASE_URL}/request-airdrop`,
        { publicKey }
      )
      toast.success('Airdrop successful', {
        description: `Transaction signature: ${response.data.signature}`,
      })
      onSuccess()
    } catch (error) {
      console.error('Airdrop failed:', error)
      toast.error('Airdrop failed', {
        description: 'Please try again later.',
      })
    } finally {
      setIsAirdropping(false)
    }
  }

  return (
    <Button
      onClick={handleAirdrop}
      disabled={isAirdropping}
      size='sm'
      variant='outline'
    >
      {isAirdropping ? (
        <>
          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          Airdropping...
        </>
      ) : (
        'Request Airdrop'
      )}
    </Button>
  )
}
