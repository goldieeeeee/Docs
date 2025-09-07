"use client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";

const Header = ({ children, className }: HeaderProps) => {
  const [logoVisible, setLogoVisible] = useState(true);

  useEffect(() => {
    const handleKeyDown = (event: { key: string }) => {
      if (event.key === "Escape") {
        setLogoVisible((logoVisible) => !logoVisible);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className={cn("header", className)}>
      {logoVisible && (
        <Link href="/" className="md:flex-1">
          <Image
            src="/assets/icons/logo.svg"
            alt="Goldie's Docs"
            width={360}
            height={94}
            className="hidden md:block"
          />
          <Image
            src="/assets/icons/logo-icon.svg"
            alt="Goldie's Docs"
            width={50}
            height={50}
            className="mr-2 md:hidden"
          />
        </Link>
      )}
      {children}
    </div>
  );
};

export default Header;
