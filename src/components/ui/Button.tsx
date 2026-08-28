interface ButtonProps {
  children: React.ReactNode
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
    primary: 'bg-[#0052CC] text-white hover:bg-[#003D99] shadow-lg shadow-blue-500/25',
    secondary: 'bg-[#FF7A1A] text-white hover:bg-[#CC5C00] shadow-lg shadow-orange-500/25',
    outline: 'border-2 border-[#0052CC] text-[#0052CC] hover:bg-[#0052CC] hover:text-white',
    ghost: 'text-[#0052CC] hover:bg-[#EBF5FF]'
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl font-bold transition-all duration-300 ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  )
}
