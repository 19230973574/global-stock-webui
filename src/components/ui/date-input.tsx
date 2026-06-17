import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

type DateInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, onClick, onFocus, ...props }, ref) => {
    const openPicker = (el: HTMLInputElement) => {
      try {
        el.showPicker?.()
      } catch {
        // 部分浏览器不支持或已打开时忽略
      }
    }

    return (
      <input
        ref={ref}
        type="date"
        className={cn('date-input', className)}
        onClick={(e) => {
          onClick?.(e)
          if (!e.defaultPrevented) openPicker(e.currentTarget)
        }}
        onFocus={(e) => {
          onFocus?.(e)
          openPicker(e.currentTarget)
        }}
        {...props}
      />
    )
  },
)
DateInput.displayName = 'DateInput'
