export interface PhantomProvider {
  isPhantom?: boolean
  publicKey?: { toString: () => string }
  connect: () => Promise<{ publicKey: { toString: () => string } }>
  disconnect: () => Promise<void>
  on: (event: string, callback: () => void) => void
  off: (event: string, callback: () => void) => void
}

declare global {
  interface Window {
    solana?: PhantomProvider
  }
}

export const getProvider = (): PhantomProvider | undefined => {
  if (typeof window !== "undefined" && window.solana?.isPhantom) {
    return window.solana
  }
  return undefined
}

export const connectWallet = async (): Promise<string | null> => {
  const provider = getProvider()
  if (!provider) {
    window.open("https://phantom.app/", "_blank")
    return null
  }
  try {
    const response = await provider.connect()
    return response.publicKey.toString()
  } catch (error) {
    console.error("Error connecting to Phantom wallet:", error)
    return null
  }
}

export const disconnectWallet = async (): Promise<void> => {
  const provider = getProvider()
  if (provider) {
    await provider.disconnect()
  }
}

export const shortenAddress = (address: string): string => {
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}
