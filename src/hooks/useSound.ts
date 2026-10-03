import { useSyncExternalStore } from 'react'
import { setSoundEnabled, soundEnabled, subscribeSound } from '@/lib/sound'

export function useSound() {
  const on = useSyncExternalStore(subscribeSound, soundEnabled)
  return { on, toggle: () => setSoundEnabled(!on) }
}
