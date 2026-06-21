import { Database, Plus } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { EmptyCardData, type EmptyCardType, EmptyType } from './constant';

type EmptyProps = {
  className?: string;
  children?: ReactNode;
  type?: EmptyType;
  text?: string;
};

export default function Empty({ className, children, type, text }: EmptyProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 text-center',
        className,
      )}
    >
      <Database className="size-8 text-text-secondary" />
      {children || (
        <div className="empty-text text-sm text-text-secondary">
          {text || (type === EmptyType.SearchData ? 'No results' : 'No data')}
        </div>
      )}
    </div>
  );
}

type EmptyCardProps = {
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
  title?: string;
  description?: string;
  style?: CSSProperties;
} & React.HTMLAttributes<HTMLElement>;

export function EmptyCard({
  icon,
  className,
  children,
  title,
  description,
  style,
  ...restProps
}: EmptyCardProps) {
  return (
    <article
      className={cn(
        'flex w-fit flex-col items-start justify-start gap-3 rounded-md border border-dashed border-border-button p-5',
        className,
      )}
      style={style}
      {...restProps}
    >
      {icon}
      {title ? <div className="text-sm text-text-primary">{title}</div> : null}
      {description ? <p className="text-sm text-text-secondary">{description}</p> : null}
      {children}
    </article>
  );
}

export function EmptyAppCard({
  type,
  onClick,
  showIcon,
  className,
  isSearch,
  size,
  children,
  testId,
  tabIndex,
}: {
  type: EmptyCardType;
  onClick?: () => void;
  showIcon?: boolean;
  className?: string;
  isSearch?: boolean;
  size?: 'small' | 'large';
  children?: ReactNode;
  testId?: string;
  tabIndex?: number;
}) {
  const cardData = EmptyCardData[type];
  const style = size === 'large' ? { width: '480px' } : size === 'small' ? { width: '256px' } : {};
  const defaultClass = size === 'large' ? 'mt-5' : size === 'small' ? 'mt-1' : '';

  return (
    <div>
      <EmptyCard
        onClick={isSearch ? undefined : onClick}
        data-testid={testId}
        tabIndex={tabIndex ?? (isSearch ? undefined : 0)}
        icon={showIcon ? cardData.icon : undefined}
        title={isSearch ? cardData.notFound : cardData.title}
        className={cn(!isSearch && 'cursor-pointer', className)}
        style={style}
      >
        {!isSearch && !children ? (
          <div className={cn(defaultClass, 'flex w-full items-center justify-start')}>
            <Plus size={24} />
          </div>
        ) : null}
        {children}
      </EmptyCard>
    </div>
  );
}
