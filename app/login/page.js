'use client';
import { GalleryVerticalEnd } from "lucide-react"
import { HeartPulse } from "lucide-react";
import { LoginForm } from "@/components/login-form"
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-2 p-1 md:p-10">
        <div className="flex justify-center gap-0 md:justify-start">
          <Link href="/" className="flex items-center gap-0 font-medium">
            <div className="flex items-center space-x-2">
              <HeartPulse className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">Breathline</span>
            </div>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center mt-0 pt-0">
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image src="/login.png"
          alt="Image" width={500} height={500}
          className="absolute inset-0 h-full w-full object-cover :brightness-[0.2] :grayscale" />
      </div>
    </div>
  );
}
