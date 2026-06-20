import Image from "next/image";
import Link from "next/link";

export function BrandLogo({ className = "h-9 w-auto", priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Link href="/" aria-label="Realtors X home" className="inline-flex items-center">
      <Image src="/logo.png" alt="Realtors X logo" width={2048} height={772} className={className} priority={priority}/>
    </Link>
  );
}
