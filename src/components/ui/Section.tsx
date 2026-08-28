interface SectionProps {
  children: React.ReactNode
  className?: string
  bg?: 'white' | 'gray' | 'blue' | 'dark'
  padding?: 'sm' | 'md' | 'lg'
}

export default function Section({
  children,
  className = '',
  bg = 'white',
  padding = 'lg'
}: SectionProps) {
  const backgrounds = {
    white: 'bg-white',
    gray: 'bg-[#F8FAFC]',
    blue: 'bg-[#EBF5FF]',
    dark: 'bg-[#0B1E3D]'
  }

  const paddings = {
    sm: 'py-8',
    md: 'py-16',
    lg: 'py-24'
  }

  return (
    <section className={`${backgrounds[bg]} ${paddings[padding]} ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  )
}
