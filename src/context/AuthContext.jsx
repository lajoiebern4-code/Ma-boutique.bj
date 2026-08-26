import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [estAdmin, setEstAdmin] = useState(false)
  const [chargement, setChargement] = useState(true)

  const verifierAdmin = async () => {
    if (!supabase) {
      setEstAdmin(false)
      return false
    }

    try {
      const { data, error } = await supabase.rpc('cs_est_admin')

      if (error) {
        console.error('Erreur vérification admin:', error)
        setEstAdmin(false)
        return false
      }

      const admin = data === true
      setEstAdmin(admin)
      return admin
    } catch (err) {
      console.error('Erreur vérification admin:', err)
      setEstAdmin(false)
      return false
    }
  }

  useEffect(() => {
    let actif = true

    const verifierSession = async () => {
      if (!supabase) {
        console.error('Supabase non configuré')

        if (actif) {
          setUser(null)
          setEstAdmin(false)
          setChargement(false)
        }

        return
      }

      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Erreur récupération session:', error)
      }

      if (!actif) return

      const utilisateur = data?.session?.user || null

      console.log(
        'DEBUG UID SESSION REEL:',
        utilisateur?.id || 'AUCUN',
      )

      setUser(utilisateur)

      if (utilisateur) {
        await verifierAdmin()
      } else {
        setEstAdmin(false)
      }

      if (actif) {
        setChargement(false)
      }
    }

    verifierSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!actif) return

      const utilisateur = session?.user || null

      setUser(utilisateur)

      if (utilisateur) {
        await verifierAdmin()
      } else {
        setEstAdmin(false)
      }

      setChargement(false)
    })

    return () => {
      actif = false
      subscription.unsubscribe()
    }
  }, [])

  const connexion = async (email, password) => {
    if (!supabase) {
      throw new Error('Supabase non configuré')
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      throw error
    }

    if (!data?.user) {
      throw new Error('Supabase n’a retourné aucun utilisateur.')
    }

    setUser(data.user)

    await verifierAdmin()

    return data.user
  }

  const deconnexion = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }

    setUser(null)
    setEstAdmin(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        estAdmin,
        connexion,
        deconnexion,
        chargement,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
