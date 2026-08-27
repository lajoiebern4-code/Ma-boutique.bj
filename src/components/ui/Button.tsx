import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  className = '',
  disabled = false,
  type = 'button'
}: ButtonProps) {
  const variants = {
    primary: 'bg-gradient-to-r from-[#0052CC] to-[#1A6BFF] text-white hover:shadow-lg hover:shadow-blue-500/25',
    secondary: 'bg-gradient-to-r from-[#FF7A1A] to-[#FF9C4D] text-white hover:shadow-lg hover:shadow-orange-500/25',
    outline: 'border-2 border-[#0052CC] text-[#0052CC] hover:bg-[#0052CC] hover:text-white',
    ghost: 'text-[#0052CC] hover:bg-[#EBF5FF]'
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }

  return (
    <motion.button
      type={type}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl font-bold transition-all duration-300 ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </motion.button>
  )
}
