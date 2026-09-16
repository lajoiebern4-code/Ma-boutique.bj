import type { User } from '@supabase/supabase-js'
import type { ReactNode } from 'react'

export type AuthContextValue = {
  user: User | null
  estAdmin: boolean
  connexion: (email: string, password: string) => Promise<User>
  deconnexion: () => Promise<void>
  chargement: boolean
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element

export function useAuth(): AuthContextValue
