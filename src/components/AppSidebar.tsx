
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { NavLink, useLocation } from "react-router-dom";
import { ITEMS_NAV, puedeAcceder } from "@/lib/navegacion";
import { useBrand } from "@/hooks/useBrand";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { state } = useSidebar();
  const { user, username, rolNombre } = useAuth();
  const { nombre, logoUrl } = useBrand();
  const rolLabel = rolNombre ?? '';
  const visibleItems = ITEMS_NAV.filter(item => puedeAcceder(item, user));
  const location = useLocation();
  const currentPath = location.pathname;
  
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const getNavClass = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
      active
        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    }`;

  return (
    <Sidebar className={`${collapsed ? "w-16" : "w-64"} transition-all duration-300`}>
      <SidebarContent className="bg-sidebar border-r border-sidebar-border">
        {/* Logo y Título */}
        <div className="flex items-center gap-3 px-4 py-6 border-b border-sidebar-border">
          {logoUrl ? (
            <img src={logoUrl} alt={`Logo de ${nombre}`} className="h-9 w-9 shrink-0 rounded-lg bg-white object-contain p-0.5" />
          ) : (
            <div className="w-9 h-9 shrink-0 bg-gradient-to-r from-stylepro-lavender-500 to-stylepro-gold-500 rounded-lg flex items-center justify-center" aria-hidden>
              <span className="text-white font-bold text-sm">{nombre.substring(0, 2).toUpperCase()}</span>
            </div>
          )}
          {!collapsed && (
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sidebar-foreground font-semibold text-lg">{nombre}</span>
              <span className="text-sidebar-foreground/70 text-xs">Sistema de gestión</span>
            </div>
          )}
        </div>

        <SidebarGroup className="px-4 py-4">
          <SidebarGroupLabel className="text-sidebar-foreground/60 text-xs font-medium uppercase tracking-wider mb-2">
            {!collapsed && "Gestión Principal"}
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="p-0">
                    <NavLink
                      to={item.url}
                      className={getNavClass(isActive(item.url))}
                      title={collapsed ? item.title : undefined}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && (
                        <span className="font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Usuario y Configuración */}
        {!collapsed && (
          <div className="mt-auto p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 bg-gradient-to-r from-stylepro-blue-500 to-stylepro-lavender-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">{(username || "??").substring(0, 2).toUpperCase()}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sidebar-foreground font-medium text-sm capitalize">{username}</span>
                <span className="text-sidebar-foreground/70 text-xs">{rolLabel}</span>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
