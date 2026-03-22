import * as React from 'react';
import { Button } from '@components/ui/button/index';
import cn from '@utils/cn';
import WindowDetail from '@/assets/svgs/windowdetail.svg?react';

interface WindowWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  showButtons?: boolean;
  headerClasses?: string;
  windowTitleClasses?: string;
  windowTitle?: string;
  isBaloonChat?: boolean;
  minimizeButton?: () => void;
  closeButton?: () => void;
  variant?: 'pink' | 'blue';
}

const WindowWrapper = React.forwardRef<HTMLDivElement, WindowWrapperProps>(
  (
    {
      className, // root classes
      isBaloonChat,
      windowTitle,
      windowTitleClasses,
      minimizeButton,
      closeButton,
      headerClasses,
      showButtons = false,
      children,
      variant = 'pink',
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col shadow-[var(--shadow-window)] rounded-[8px] relative min-w-[50px] border-[2px] border-[#221208]',
          className,
          isBaloonChat ? '' : 'rounded-[8px] overflow-clip'
        )}
        {...props}
      >
        <div
          className={cn(
            'px-[14px] py-[12px] w-full h-[50px] gap-[20px] flex flex-row items-center justify-between rounded-t-[8px] border-b-[2px]  border-[#221208]',
            windowTitle ? 'justify-between' : 'justify-end',
            headerClasses,
            variant === 'pink' ? 'bg-[#E9D3DF]' : 'bg-[#82AADE]'
          )}
        >
          {windowTitle ? (
            <h3 className={cn('text-[40px]', windowTitleClasses)}>{windowTitle}</h3>
          ) : (
            ''
          )}

          {showButtons ? (
            <div className="flex flex-row gap-[5px]">
              <Button
                asChild={false}
                className="p-[10px] w-[20px] h-[20px] gap-[10px] rounded-[3px] border-[1px] bg-[#F2F2E8]"
              >
                _
              </Button>

              <Button
                asChild={false}
                className="p-[10px] w-[20px] h-[20px] gap-[10px] rounded-[3px] border-[1px] bg-[#F2F2E8]"
              >
                □
              </Button>
              <Button
                type="button"
                onClick={closeButton}
                asChild={false}
                className="p-[10px] w-[20px] h-[20px] gap-[10px] rounded-[3px] border-[1px] bg-[#F2F2E8] transition duration-300 ease-in-out hover:cursor-pointer hover:scale-[1.05]"
              >
                X
              </Button>
            </div>
          ) : (
            <div className="flex flex-row gap-[5px]">
              {[...Array(3)].map((_, index) => (
                <Button
                  // eslint-disable-next-line react/no-array-index-key
                  key={`button-${index}`}
                  asChild={false}
                  className={cn(
                    'p-[10px] w-[20px] h-[20px] gap-[10px] rounded-[3px] border-[1px]',
                    variant === 'pink' ? 'bg-[#E9D3DF]' : 'bg-[#82AADE]'
                  )}
                />
              ))}
            </div>
          )}
        </div>

        <div className=" w-full min-h-[50px]  rounded-bl-[4px] bg-[#F2F2E8]">{children}</div>

        {isBaloonChat ? (
          <WindowDetail className="absolute -bottom-[39px] right-[0] fill-white w-[40px] h-[40px] " />
        ) : (
          ''
        )}
      </div>
    );
  }
);

WindowWrapper.displayName = 'WindowWrapper';

export default WindowWrapper;
