import Image from "next/image";

export function Header() {
  return (
    <header className="w-full py-6 px-6 md:px-12 border-b border-[#E7E8E3]">
      <div className="max-w-[1200px] mx-auto flex items-center">
        <h1 className="display text-[28px] font-light tracking-[-0.02em] text-[#1A1A1A]">
          Whales Outreach
        </h1>
      </div>
    </header>
  );
}
