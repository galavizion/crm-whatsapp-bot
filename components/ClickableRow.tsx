"use client";

import { useRouter } from "next/navigation";

export function ClickableRow({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
    if ((e.target as HTMLElement).closest("a, button, select, input, label")) return;
    router.push(href);
  };

  return (
    <tr onClick={handleClick} className={`cursor-pointer ${className ?? ""}`}>
      {children}
    </tr>
  );
}
