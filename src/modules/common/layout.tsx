import React from 'react'
import { cn } from '@/lib/utils'
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu'

type Props = { children: React.ReactNode, className?: string }

export default function Layout({ children, className }: Props) {
    return (<>
        <NavigationMenu>
            <NavigationMenuList >
                <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                        <a href="/" className={navigationMenuTriggerStyle()}>
                            <h2 className="text-xl">
                                Home
                            </h2>
                        </a>
                    </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                        <a href="/vendors" className={navigationMenuTriggerStyle()}>
                            <h2 className="text-xl">
                                Vendor List
                            </h2>
                        </a>
                    </NavigationMenuLink>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>

        <div
            className="flex flex-row items-start"
        >   <div className={cn("flex flex-col bg-gray-100 w-full min-h-[92vh] flex-1 w-full", className)}>
                {children}
            </div>
        </div>
    </>
    )
}