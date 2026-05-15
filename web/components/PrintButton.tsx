"use client";

type PrintButtonProps = {
  className?: string;
};

export default function PrintButton({ className }: PrintButtonProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button type="button" onClick={handlePrint} className={className}>
      Print
    </button>
  );
}