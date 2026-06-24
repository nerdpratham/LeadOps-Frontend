type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export default function Input({ label, error, id, leftIcon, rightIcon, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-600">
        {label}
      </label>
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3.5 flex items-center text-gray-400">
            {leftIcon}
          </span>
        )}
        <input
          id={id}
          className={`w-full rounded-xl border py-2.5 text-sm text-gray-900 outline-none transition
            placeholder:text-gray-400
            focus:ring-2 focus:ring-orange-300 focus:border-transparent
            ${leftIcon ? 'pl-10' : 'pl-3.5'}
            ${rightIcon ? 'pr-10' : 'pr-3.5'}
            ${error ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300 focus:bg-white'}`}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3.5 flex items-center text-gray-400">
            {rightIcon}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
