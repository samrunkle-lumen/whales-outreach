import Image from "next/image";

export function Header() {
  return (
    <header className="w-full py-6 px-6 md:px-12 border-b border-[#E7E8E3]">
      <div className="max-w-[1200px] mx-auto flex items-center">
        <Image
          src="/logo-black.svg"
          alt="Lumen Energy"
          width={140}
          height={33}
          className="h-8 w-auto"
          priority
        />
      </div>
    </header>
  );
}
