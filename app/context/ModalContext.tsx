"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import AlertModal, { AlertType } from "@/app/components/AlertModal";
import ConfirmModal from "@/app/components/ConfirmModal";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ModalContextType {
    showAlert: (title: string, message: string, type?: AlertType, onAction?: () => void) => void;
    showConfirm: (title: string, message: string, isDestructive?: boolean) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
    const { t } = useLanguage();

    // Alert State
    const [alertState, setAlertState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: AlertType;
        onAction?: () => void;
    }>({
        isOpen: false,
        title: "",
        message: "",
        type: "success",
    });

    // Confirm State
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        isDestructive: boolean;
        resolve: ((value: boolean) => void) | null;
    }>({
        isOpen: false,
        title: "",
        message: "",
        isDestructive: false,
        resolve: null,
    });

    const showAlert = useCallback((title: string, message: string, type: AlertType = "success", onAction?: () => void) => {
        setAlertState({
            isOpen: true,
            title,
            message,
            type,
            onAction,
        });
    }, []);

    const showConfirm = useCallback((title: string, message: string, isDestructive: boolean = false) => {
        return new Promise<boolean>((resolve) => {
            setConfirmState({
                isOpen: true,
                title,
                message,
                isDestructive,
                resolve,
            });
        });
    }, []);

    const handleAlertClose = () => {
        setAlertState((prev) => ({ ...prev, isOpen: false }));
        if (alertState.onAction) {
            // Optional: execute action on close if not explicitly executed? 
            // Usually alert just closes. Action is for "OK" button.
            // But if user clicks backdrop, maybe we shouldn't trigger action?
            // Current AlertModal calls onAction OR onClose. 
            // Here we just close.
        }
    };

    const handleConfirmClose = (result: boolean) => {
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        if (confirmState.resolve) {
            confirmState.resolve(result);
        }
    };

    return (
        <ModalContext.Provider value={{ showAlert, showConfirm }}>
            {children}
            <AlertModal
                isOpen={alertState.isOpen}
                onClose={handleAlertClose}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
                onAction={() => {
                    handleAlertClose();
                    if (alertState.onAction) alertState.onAction();
                }}
                actionLabel={t.common?.ok || "OK"}
            />
            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={() => handleConfirmClose(false)}
                onConfirm={() => handleConfirmClose(true)}
                title={confirmState.title}
                message={confirmState.message}
                isDestructive={confirmState.isDestructive}
                confirmLabel={t.common?.confirm || "Confirm"}
                cancelLabel={t.common?.cancel || "Cancel"}
            />
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
