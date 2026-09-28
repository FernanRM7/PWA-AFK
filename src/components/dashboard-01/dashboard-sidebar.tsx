'use client';

import {
  ArrowLeftRight,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  CircleHelp,
  CirclePlus,
  ClipboardCheck,
  CreditCard,
  LayoutDashboard,
  Moon,
  Settings,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export function DashboardSidebar({ activeLabel = 'Resumen' }: { readonly activeLabel?: 'Resumen' | 'Reportes' | 'Inspecciones' }) {
  const { isMobile, setOpenMobile, state } = useSidebar();
  const [workspaces, setWorkspaces] = useState([
    'Lumen Labs',
    'Halcyon Studio',
    'Pinecrest Co.',
  ]);
  const [workspace, setWorkspace] = useState('Lumen Labs');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="px-3 pt-3.5 pb-5">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuButton
                      aria-label={`${workspace}, cambiar espacio de trabajo`}
                      className="h-9 gap-2 rounded-lg px-2 font-medium group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!"
                    />
                  }
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-[5px] bg-blue-500 font-semibold text-[0.6875rem] text-white">
                    {workspace.slice(0, 1)}
                  </span>
                  <span className="flex-1 truncate group-data-[collapsible=icon]:sr-only">
                    {workspace}
                  </span>
                  <ChevronDown className="text-muted-foreground group-data-[collapsible=icon]:sr-only" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className={cn(
                    'rounded-[10px] p-1.5',
                    state === 'collapsed' && !isMobile
                      ? 'w-56'
                      : 'w-(--anchor-width)'
                  )}
                  side={state === 'collapsed' && !isMobile ? 'right' : 'bottom'}
                  sideOffset={8}
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="px-2.5 py-2">
                      espacio de trabajos
                    </DropdownMenuLabel>
                    {workspaces.map((item, index) => (
                      <DropdownMenuItem
                        className={cn(
                          'min-h-9 gap-2.5 px-2.5',
                          item === workspace && 'bg-accent'
                        )}
                        key={item}
                        onClick={() => setWorkspace(item)}
                      >
                        <span
                          className={cn(
                            'flex size-5 shrink-0 items-center justify-center rounded-[5px] font-semibold text-[0.6875rem]',
                            index === 0
                              ? 'bg-blue-500 text-white'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {item.slice(0, 1)}
                        </span>
                        <span className="flex-1 truncate">{item}</span>
                        {item === workspace && <Check aria-label="Seleccionado" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      className="min-h-9 gap-2.5 px-2.5"
                      onClick={() => setCreating(true)}
                    >
                      <CirclePlus />
                      Crear espacio de trabajo
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-3 py-0">
            <SidebarGroupLabel className="px-2.5 text-[0.6875rem] tracking-wider">
              NAVEGACIÓN
            </SidebarGroupLabel>
            <SidebarMenu className="gap-0.5">
              {navigation.map((item) => (
                <SidebarMenuItem
                  className={
                    item.label === activeLabel
                      ? 'before:-left-3 before:absolute before:top-2.5 before:h-4 before:w-0.75 before:rounded-r-sm before:bg-blue-500'
                      : undefined
                  }
                  key={item.label}
                >
                  <SidebarMenuButton
                    className="h-9 gap-2.5 rounded-lg px-2.5"
                    isActive={item.label === activeLabel}
                    onClick={() => setOpenMobile(false)}
                    render={
                      <a aria-current={item.label === activeLabel ? "page" : undefined} aria-label={item.label} className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring" href={item.href} tabIndex={0} title={item.label}>
                        <item.icon
                          aria-hidden="true"
                          className={
                            item.label === activeLabel
                              ? undefined
                              : 'text-muted-foreground'
                          }
                        />
                        <span className="flex-1 group-data-[collapsible=icon]:sr-only">
                          {item.label}
                        </span>
                        {false && (
                          <div className="rounded-full bg-muted px-1.5 text-[0.6875rem] text-muted-foreground tabular-nums group-data-[collapsible=icon]:sr-only">
                            12
                          </div>
                        )}
                      </a>
                    }
                    tooltip={item.label}
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="gap-3 px-3 pb-5">
          <SidebarMenu className="gap-0.5">
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuButton
                      aria-label="Configuración"
                      className="h-9 gap-2.5 rounded-lg px-2.5"
                      tooltip="Configuración"
                    />
                  }
                >
                  <Settings className="text-muted-foreground" />
                  <span className="group-data-[collapsible=icon]:sr-only">
                    Configuración
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-64 rounded-[10px] p-1.5"
                  side="top"
                  sideOffset={8}
                >
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      className="min-h-9 gap-2.5 px-2.5"
                      render={
                        <a
                          aria-label="Perfil de la organización"
                          href="/settings/company"
                        >
                          <BriefcaseBusiness />
                          Perfil de la organización
                        </a>
                      }
                    />
                    <DropdownMenuItem
                      className="min-h-9 gap-2.5 px-2.5"
                      render={
                        <a aria-label="Equipo" href="/settings/team">
                          <Users />
                          Equipo
                        </a>
                      }
                    />
                    <DropdownMenuItem
                      className="min-h-9 gap-2.5 px-2.5"
                      render={
                        <a aria-label="Facturación" href="/settings/billing">
                          <CreditCard />
                          Facturación
                        </a>
                      }
                    />
                    <DropdownMenuItem
                      className="min-h-9 gap-2.5 px-2.5"
                      closeOnClick={false}
                      onClick={() =>
                        document.documentElement.classList.toggle('dark')
                      }
                    >
                      <Moon />
                      <span className="flex-1">Apariencia</span>
                      <div className="text-muted-foreground text-xs">
                        <span className="dark:hidden">Claro</span>
                        <span className="not-dark:hidden">Oscuro</span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="h-9 gap-2.5 rounded-lg px-2.5"
                render={
                  <a
                    aria-label="Ayuda y soporte"
                    href="mailto:support@lumenlabs.io"
                  >
                    <CircleHelp className="text-muted-foreground" />
                    <span className="group-data-[collapsible=icon]:sr-only">
                      Ayuda y soporte
                    </span>
                  </a>
                }
                tooltip="Ayuda y soporte"
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <Dialog onOpenChange={setCreating} open={creating}>
        <DialogContent>
          <form
            className="flex flex-col gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              const nextName = name.trim();
              if (!nextName) {
                return;
              }
              if (!workspaces.includes(nextName)) {
                setWorkspaces([...workspaces, nextName]);
              }
              setWorkspace(nextName);
              setName('');
              setCreating(false);
            }}
          >
            <DialogHeader>
              <DialogTitle>Crear espacio de trabajo</DialogTitle>
              <DialogDescription>
                Agrega un espacio de trabajo a esta vista.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="workspace-name">nombre del espacio de trabajo</FieldLabel>
                <Input
                  autoComplete="organization"
                  id="workspace-name"
                  maxLength={60}
                  name="workspace-name"
                  onChange={(event) => setName(event.target.value)}
                  pattern=".*\S.*"
                  required
                  value={name}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                onClick={() => setCreating(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button type="submit">Crear espacio de trabajo</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

const navigation = [
  { label: 'Resumen', href: '/', icon: LayoutDashboard },
  { label: 'Inspecciones', href: '/inspecciones', icon: ClipboardCheck },
  { label: 'Reportes', href: '/reportes', icon: ChartNoAxesCombined },
];
