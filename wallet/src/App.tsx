import { Navbar } from '@/components/navbar'
import { WalletGenerator } from '@/components/waller-generator'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'

const SolanaWalletGenerator: React.FC = () => {
  return (
    <ThemeProvider defaultTheme='light' storageKey='vite-ui-theme'>
      <div className='min-h-screen bg-background text-foreground'>
        <Navbar />
        <main className='container mx-auto px-4 pb-8'>
          <WalletGenerator />
        </main>
      </div>
      <Toaster richColors expand />
    </ThemeProvider>
  )
}

export default SolanaWalletGenerator
