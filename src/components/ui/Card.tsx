import React from 'react';
import { cn } from '@/lib/utils';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
                                                                         className,
                                                                         children,
                                                                         ...props
                                                                     }) => {
    return (
        <div
            className={cn('rounded-lg border border-border bg-background shadow-sm', className)}
            {...props}
        >
            {children}
        </div>
    );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
                                                                               className,
                                                                               children,
                                                                               ...props
                                                                           }) => {
    return (
        <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props}>
            {children}
        </div>
    );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
                                                                                  className,
                                                                                  children,
                                                                                  ...props
                                                                              }) => {
    return (
        <h3
            className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
            {...props}
        >
            {children}
        </h3>
    );
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
                                                                                          className,
                                                                                          children,
                                                                                          ...props
                                                                                      }) => {
    return (
        <p className={cn('text-sm text-muted-foreground', className)} {...props}>
            {children}
        </p>
    );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
                                                                                className,
                                                                                children,
                                                                                ...props
                                                                            }) => {
    return (
        <div className={cn('p-6 pt-0', className)} {...props}>
            {children}
        </div>
    );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
                                                                               className,
                                                                               children,
                                                                               ...props
                                                                           }) => {
    return (
        <div className={cn('flex items-center p-6 pt-0', className)} {...props}>
            {children}
        </div>
    );
};