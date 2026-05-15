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
      return 'bg-[#8dc63f] text-white hover:opacity-90';
    case 'danger':
      return 'border border-red-300 bg-white text-red-700 hover:bg-red-50';
    case 'secondary':
    default:
      return 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50';
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