import styles from './Button.module.css';
import { cn } from '@/utils';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  as: Tag = 'button',
  className,
  ...props
}) {
  return (
    <Tag
      className={cn(
        styles.btn,
        styles[variant],
        size !== 'md' && styles[size],
        fullWidth && styles.fullWidth,
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
