"use client";

import React, { createContext, useContext, useCallback, ReactNode } from "react";
import Swal, { SweetAlertIcon } from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const MySwal = withReactContent(Swal);

// Define AlertType to match previous usage or mapping
export type AlertType = SweetAlertIcon;

interface ModalContextType {
    showAlert: (title: string, message: string, type?: AlertType, onAction?: () => void) => void;
    showConfirm: (title: string, message: string, isDestructive?: boolean) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
    const { t } = useLanguage();

    const showAlert = useCallback((title: string, message: string, type: AlertType = "success", onAction?: () => void) => {
        MySwal.fire({
            title: title,
            text: message,
            icon: type,
            confirmButtonText: t.common?.ok || "OK",
            confirmButtonColor: type === 'error' ? '#EF4444' : '#4F46E5', // Red or Indigo
        }).then(() => {
            if (onAction) onAction();
        });
    }, [t]);

    const showConfirm = useCallback((title: string, message: string, isDestructive: boolean = false) => {
        return MySwal.fire({
            title: title,
            text: message,
            icon: isDestructive ? 'warning' : 'question',
            showCancelButton: true,
            confirmButtonText: t.common?.confirm || "Confirm",
            cancelButtonText: t.common?.cancel || "Cancel",
            confirmButtonColor: isDestructive ? '#EF4444' : '#4F46E5',
            cancelButtonColor: '#9CA3AF',
        }).then((result) => {
            return result.isConfirmed;
        });
    }, [t]);

    return (
        <ModalContext.Provider value={{ showAlert, showConfirm }}>
            {children}
        </ModalContext.Provider>
    );
}

export function useModal() {
    const context = useContext(ModalContext);
    if (context === undefined) {
        throw new Error("useModal must be used within a ModalProvider");
    }
    return context;
}
