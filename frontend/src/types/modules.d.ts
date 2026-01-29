// Module declarations for proper TypeScript resolution

declare module 'react' {
  import * as React from 'react';
  export = React;
  export as namespace React;
  
  export const useState: <T>(initialState: T | (() => T)) => [T, (value: T | ((prev: T) => T)) => void];
  export const useEffect: (effect: () => void | (() => void), deps?: any[]) => void;
  export const useCallback: <T extends (...args: any[]) => any>(callback: T, deps: any[]) => T;
  export const useMemo: <T>(factory: () => T, deps: any[]) => T;
  export const useRef: <T>(initialValue: T) => { current: T };
  export const createContext: <T>(defaultValue: T) => React.Context<T>;
  export const useContext: <T>(context: React.Context<T>) => T;
  
  export interface FormEvent<T = Element> extends React.SyntheticEvent<T> {
    preventDefault(): void;
  }
  
  export interface ChangeEvent<T = Element> extends React.SyntheticEvent<T> {
    target: EventTarget & T;
  }
  
  export interface MouseEvent<T = Element> extends React.SyntheticEvent<T> {
    preventDefault(): void;
  }
  
  export interface ReactNode {}
  export interface Component<P = {}, S = {}> {}
  export interface ComponentType<P = {}> {}
  export interface HTMLAttributes<T> {
    className?: string;
    children?: ReactNode;
    onClick?: (event: MouseEvent<T>) => void;
    [key: string]: any;
  }
  
  export interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    value?: string | number;
    onChange?: (event: ChangeEvent<T>) => void;
    placeholder?: string;
    type?: string;
    disabled?: boolean;
    id?: string;
    name?: string;
  }
  
  export interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
  }
  
  export interface LabelHTMLAttributes<T> extends HTMLAttributes<T> {
    htmlFor?: string;
  }
  
  export interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {
    value?: string;
    onChange?: (event: ChangeEvent<T>) => void;
    placeholder?: string;
    disabled?: boolean;
    rows?: number;
    cols?: number;
  }
  
  // Default export
  const React: {
    useState: typeof useState;
    useEffect: typeof useEffect;
    useCallback: typeof useCallback;
    useMemo: typeof useMemo;
    useRef: typeof useRef;
    createContext: typeof createContext;
    useContext: typeof useContext;
    Component: typeof Component;
    ReactNode: ReactNode;
    ComponentType: ComponentType;
    FormEvent: FormEvent;
    ChangeEvent: ChangeEvent;
    MouseEvent: MouseEvent;
    HTMLAttributes: HTMLAttributes<any>;
    InputHTMLAttributes: InputHTMLAttributes<any>;
    ButtonHTMLAttributes: ButtonHTMLAttributes<any>;
    LabelHTMLAttributes: LabelHTMLAttributes<any>;
    TextareaHTMLAttributes: TextareaHTMLAttributes<any>;
  };
  
  export default React;
}

declare module 'react-dom' {
  export * from 'react-dom';
  export { default } from 'react-dom';
}

declare module 'next/link' {
  import { ComponentType } from 'react';
  interface LinkProps {
    href: string;
    className?: string;
    children?: React.ReactNode;
    [key: string]: any;
  }
  const Link: ComponentType<LinkProps>;
  export default Link;
}

declare module 'next/navigation' {
  export function useRouter(): {
    push: (url: string) => void;
    replace: (url: string) => void;
    back: () => void;
    forward: () => void;
    refresh: () => void;
    prefetch: (url: string) => void;
  };
  export function usePathname(): string;
  export function useSearchParams(): URLSearchParams;
}

declare module 'lucide-react' {
  import { ComponentType } from 'react';
  interface IconProps {
    className?: string;
    size?: number | string;
    color?: string;
    strokeWidth?: number;
    [key: string]: any;
  }
  
  export const Bell: ComponentType<IconProps>;
  export const LogOut: ComponentType<IconProps>;
  export const Languages: ComponentType<IconProps>;
  export const Mic: ComponentType<IconProps>;
  export const Camera: ComponentType<IconProps>;
  export const FileAudio: ComponentType<IconProps>;
  export const Video: ComponentType<IconProps>;
  export const Stethoscope: ComponentType<IconProps>;
  export const Upload: ComponentType<IconProps>;
  export const UserCircle: ComponentType<IconProps>;
  export const MapPin: ComponentType<IconProps>;
  export const AlertTriangle: ComponentType<IconProps>;
  export const HeartPulse: ComponentType<IconProps>;
  export const ChevronRight: ComponentType<IconProps>;
  export const Download: ComponentType<IconProps>;
  export const Siren: ComponentType<IconProps>;
  export const Loader: ComponentType<IconProps>;
  export const Loader2: ComponentType<IconProps>;
  export const Send: ComponentType<IconProps>;
  export const Phone: ComponentType<IconProps>;
  export const User: ComponentType<IconProps>;
  export const Users: ComponentType<IconProps>;
  export const ClipboardList: ComponentType<IconProps>;
  export const Truck: ComponentType<IconProps>;
  export const Search: ComponentType<IconProps>;
  export const Filter: ComponentType<IconProps>;
  export const MoreHorizontal: ComponentType<IconProps>;
  export const PhoneCall: ComponentType<IconProps>;
  export const Plus: ComponentType<IconProps>;
  export const Edit: ComponentType<IconProps>;
  export const BarChart2: ComponentType<IconProps>;
  export const Pill: ComponentType<IconProps>;
  export const BookMarked: ComponentType<IconProps>;
  export const History: ComponentType<IconProps>;
  export const BrainCircuit: ComponentType<IconProps>;
  export const FileText: ComponentType<IconProps>;
  export const X: ComponentType<IconProps>;
  export const Check: ComponentType<IconProps>;
  export const ChevronDown: ComponentType<IconProps>;
  export const ChevronUp: ComponentType<IconProps>;
  export const PanelLeft: ComponentType<IconProps>;
}

declare module 'zod' {
  export interface ZodType<Output = any, Def = any, Input = Output> {
    parse(input: unknown): Output;
    safeParse(input: unknown): { success: true; data: Output } | { success: false; error: any };
    _output: Output;
  }
  
  export interface ZodString extends ZodType<string> {
    min(length: number, options?: { message?: string }): ZodString;
    max(length: number, options?: { message?: string }): ZodString;
    email(options?: { message?: string }): ZodString;
    optional(): ZodOptional<ZodString>;
  }
  
  export interface ZodOptional<T extends ZodType> extends ZodType<T['_output'] | undefined> {}
  
  export interface ZodEnum<T extends readonly [string, ...string[]]> extends ZodType<T[number]> {}
  
  export const z: {
    string(): ZodString;
    object<T extends Record<string, ZodType>>(shape: T): ZodType<{ [K in keyof T]: T[K]['_output'] }>;
    enum<T extends readonly [string, ...string[]]>(values: T): ZodEnum<T>;
    infer<T extends ZodType>(schema: T): T['_output'];
  };
  
  export type infer<T extends ZodType> = T['_output'];
  
  // Global z object
  namespace z {
    function string(): ZodString;
    function object<T extends Record<string, ZodType>>(shape: T): ZodType<{ [K in keyof T]: T[K]['_output'] }>;
    function enum<T extends readonly [string, ...string[]]>(values: T): ZodEnum<T>;
  }
  
  global {
    const z: typeof import('zod').z;
  }
}

declare module 'react-hook-form' {
  export interface UseFormReturn<T = any> {
    control: any;
    handleSubmit: (onSubmit: (data: T) => void) => (e?: React.BaseSyntheticEvent) => Promise<void>;
    setValue: (name: keyof T, value: any) => void;
    getValues: (name?: keyof T) => any;
    formState: {
      errors: Record<string, any>;
      isSubmitting: boolean;
      isValid: boolean;
    };
  }
  
  export function useForm<T = any>(options?: {
    resolver?: any;
    defaultValues?: Partial<T>;
  }): UseFormReturn<T>;
}

declare module '@hookform/resolvers/zod' {
  export function zodResolver(schema: any): any;
}

// UI Component declarations
declare module '@/components/ui/button' {
  import { ComponentType } from 'react';
  
  interface ButtonProps {
    children?: React.ReactNode;
    className?: string;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    onClick?: (event: React.MouseEvent) => void;
    [key: string]: any;
  }
  
  export const Button: ComponentType<ButtonProps>;
}

declare module '@/components/ui/card' {
  import { ComponentType } from 'react';
  
  interface CardProps {
    children?: React.ReactNode;
    className?: string;
    [key: string]: any;
  }
  
  interface CardHeaderProps {
    children?: React.ReactNode;
    className?: string;
    [key: string]: any;
  }
  
  interface CardTitleProps {
    children?: React.ReactNode;
    className?: string;
    [key: string]: any;
  }
  
  interface CardDescriptionProps {
    children?: React.ReactNode;
    className?: string;
    [key: string]: any;
  }
  
  interface CardContentProps {
    children?: React.ReactNode;
    className?: string;
    [key: string]: any;
  }
  
  interface CardFooterProps {
    children?: React.ReactNode;
    className?: string;
    [key: string]: any;
  }
  
  export const Card: ComponentType<CardProps>;
  export const CardHeader: ComponentType<CardHeaderProps>;
  export const CardTitle: ComponentType<CardTitleProps>;
  export const CardDescription: ComponentType<CardDescriptionProps>;
  export const CardContent: ComponentType<CardContentProps>;
  export const CardFooter: ComponentType<CardFooterProps>;
}

declare module '@/components/ui/input' {
  import { ComponentType } from 'react';
  
  interface InputProps {
    className?: string;
    type?: string;
    placeholder?: string;
    value?: string | number;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    id?: string;
    name?: string;
    [key: string]: any;
  }
  
  export const Input: ComponentType<InputProps>;
}

declare module '@/components/ui/label' {
  import { ComponentType } from 'react';
  
  interface LabelProps {
    children?: React.ReactNode;
    className?: string;
    htmlFor?: string;
    [key: string]: any;
  }
  
  export const Label: ComponentType<LabelProps>;
}

declare module '@/components/ui/dialog' {
  import { ComponentType } from 'react';
  
  interface DialogProps {
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    [key: string]: any;
  }
  
  interface DialogContentProps {
    children?: React.ReactNode;
    className?: string;
    [key: string]: any;
  }
  
  interface DialogHeaderProps {
    children?: React.ReactNode;
    className?: string;
    [key: string]: any;
  }
  
  interface DialogTitleProps {
    children?: React.ReactNode;
    className?: string;
    [key: string]: any;
  }
  
  interface DialogDescriptionProps {
    children?: React.ReactNode;
    className?: string;
    [key: string]: any;
  }
  
  export const Dialog: ComponentType<DialogProps>;
  export const DialogContent: ComponentType<DialogContentProps>;
  export const DialogHeader: ComponentType<DialogHeaderProps>;
  export const DialogTitle: ComponentType<DialogTitleProps>;
  export const DialogDescription: ComponentType<DialogDescriptionProps>;
  export const DialogTrigger: ComponentType<{ children?: React.ReactNode; [key: string]: any }>;
  export const DialogFooter: ComponentType<{ children?: React.ReactNode; className?: string; [key: string]: any }>;
}

// Additional UI components needed by the project
declare module '@/components/ui/form' {
  import { ComponentType } from 'react';
  
  interface FormProps {
    children?: React.ReactNode;
    [key: string]: any;
  }
  
  interface FormFieldProps {
    control?: any;
    name: string;
    render: (props: { field: any }) => React.ReactNode;
  }
  
  interface FormItemProps {
    children?: React.ReactNode;
    className?: string;
  }
  
  interface FormLabelProps {
    children?: React.ReactNode;
    className?: string;
  }
  
  interface FormControlProps {
    children?: React.ReactNode;
  }
  
  interface FormMessageProps {
    className?: string;
  }
  
  export const Form: ComponentType<FormProps>;
  export const FormField: ComponentType<FormFieldProps>;
  export const FormItem: ComponentType<FormItemProps>;
  export const FormLabel: ComponentType<FormLabelProps>;
  export const FormControl: ComponentType<FormControlProps>;
  export const FormMessage: ComponentType<FormMessageProps>;
}

declare module '@/components/ui/select' {
  import { ComponentType } from 'react';
  
  interface SelectProps {
    onValueChange?: (value: string) => void;
    defaultValue?: string;
    children?: React.ReactNode;
  }
  
  interface SelectTriggerProps {
    children?: React.ReactNode;
    className?: string;
  }
  
  interface SelectValueProps {
    placeholder?: string;
  }
  
  interface SelectContentProps {
    children?: React.ReactNode;
  }
  
  interface SelectItemProps {
    value: string;
    children?: React.ReactNode;
  }
  
  export const Select: ComponentType<SelectProps>;
  export const SelectTrigger: ComponentType<SelectTriggerProps>;
  export const SelectValue: ComponentType<SelectValueProps>;
  export const SelectContent: ComponentType<SelectContentProps>;
  export const SelectItem: ComponentType<SelectItemProps>;
}

declare module '@/hooks/use-toast' {
  interface ToastProps {
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive';
  }
  
  export function useToast(): {
    toast: (props: ToastProps) => void;
  };
}

declare module '@/lib/types' {
  export type Role = 'citizen' | 'asha' | 'clinical' | 'admin';
  export const roles: Role[];
  export const roleRoutes: Record<Role, string>;
  export const roleDisplayNames: Record<Role, string>;
}