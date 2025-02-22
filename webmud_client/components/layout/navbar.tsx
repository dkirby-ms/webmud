"use client";

import Image from "next/image";
import Link from "next/link";
import useScroll from "@/lib/hooks/use-scroll";
import { useSession } from 'next-auth/react';
import { SignInButton } from "@/components/shared/SignInButton";
import { UserAvatar } from "@/components/home/UserAvatar";
import { Flex } from "@radix-ui/themes";

export default function NavBar() {
    const scrolled = useScroll(50);
    const { data: status } = useSession();
    
    return (
        <>
            <div
                className={`fixed top-0 flex w-full justify-center ${scrolled
                        ? "border-b border-gray-200 bg-white/50 backdrop-blur-xl"
                        : "bg-white/0"
                    } z-30 transition-all`}
            >
                <div className="mx-5 flex h-16 w-full max-w-screen-xl items-center justify-between">
                    <Link href="/" className="flex items-center font-display text-2xl">
                        <Image
                            src="/logo.svg"
                            alt="webMUD logo"
                            width="50"
                            height="50"
                            className="mr-2 rounded-sm"
                        ></Image>
                        <p>webMUD</p>
                    </Link>
                { status !== 'authenticated' ? ( 
                    <SignInButton/>
                ) : (
                    <Flex gap="1"><UserAvatar></UserAvatar></Flex>
                )}
            </div>
        </div >
    </>
  );
}
