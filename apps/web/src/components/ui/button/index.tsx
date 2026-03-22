import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { type VariantProps } from 'class-variance-authority';
import cn from '@utils/cn';

import buttonVariants from './variants';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        type={props.type}
        disabled={props.disabled}
        onClick={props.onClick}
        tabIndex={props.tabIndex}
        aria-label={props['aria-label']}
      >
        {props.children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button };
