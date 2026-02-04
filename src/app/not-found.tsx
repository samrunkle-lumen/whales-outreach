import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 flex items-center justify-center px-6 md:px-12 py-12 md:py-20">
        <div className="text-center">
          <h1 className="text-6xl md:text-8xl font-semibold text-[#1A1A1A] mb-4">404</h1>
          <p className="text-lg md:text-xl text-[#9FA3BF] mb-8">
            This page doesn&apos;t exist.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-[#DFFF5E] text-[#1A1A1A] font-medium hover:bg-[#d4f54e] transition-colors"
          >
            Go Home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
