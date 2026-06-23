type Variant = 'gradient' | 'outline' | 'default'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean
  variant?: Variant
}

const variantClasses: Record<Variant, string> = {
  gradient:
    'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white hover:from-fuchsia-600 hover:to-pink-600 shadow-md shadow-pink-200',
  outline:
    'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm',
  default:
    'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
}

export default function Button({
  children,
  loading,
  disabled,
  variant = 'default',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold
        transition active:scale-[0.98]
        disabled:cursor-not-allowed disabled:opacity-60
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-400
        ${variantClasses[variant]}
        ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Signing in…
        </span>
      ) : children}
    </button>
  )
}
