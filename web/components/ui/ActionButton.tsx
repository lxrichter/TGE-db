import Link from 'next/link';
import React from 'react';

type Variant = 'primary' | 'secondary' | 'danger';

type BaseProps = {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  disabled?: boolean;
};

type ButtonProps = BaseProps & {
  href?: never;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
};

type LinkProps = BaseProps & {
  href: string;
  type?: never;
  onClick?: never;
};

type ActionButtonProps = ButtonProps | LinkProps;

function getVariantClasses(variant: Variant) {
  switch (variant) {
    case 'primary':
      return 'bg-[var(--tge-brand-green)] text-[var(--tge-surface-card)] hover:bg-[var(--tge-brand-green-dark)]';
    case 'danger':
      return 'border border-[var(--tge-governance-danger-border)] bg-[var(--tge-surface-card)] text-[var(--tge-governance-danger-text)] hover:bg-[var(--tge-governance-danger-bg)]';
    case 'secondary':
    default:
      return 'border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] text-[var(--tge-governance-neutral-text)] hover:bg-[var(--tge-governance-neutral-bg)]';
  }
}

function getBaseClasses(disabled?: boolean) {
  return [
    'inline-flex h-[48px] min-w-[140px] items-center justify-center px-5 text-sm font-semibold transition',
    disabled ? 'cursor-not-allowed opacity-60' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export default function ActionButton(props: ActionButtonProps) {
  const variant = props.variant ?? 'secondary';
  const classes = `${getBaseClasses(props.disabled)} ${getVariantClasses(variant)} ${props.className ?? ''}`.trim();

  if ('href' in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {props.children}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? 'button'}
      onClick={props.onClick}
      disabled={props.disabled}
      className={classes}
    >
      {props.children}
    </button>
  );
}
