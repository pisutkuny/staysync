"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import AlertModal, { AlertType } from "@/app/components/AlertModal";

interface ModalContextType {
    showAlert: (title: string, message: string, type?: AlertType, onAction?: () => void) => void;
    showConfirm: (title: string, message: string, isDestructive?: boolean) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
    const [alertState, setAlertState] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "success" as AlertType,
        onAction: undefined as (() => void) | undefined
    });

    const showAlert = useCallback((title: string, message: string, type: AlertType = "success", onAction?: () => void) => {
        setAlertState({
            isOpen: true,
            title,
            message,
            type,
            onAction
        });
    }, []);

    const closeAlert = useCallback(() => {
        setAlertState(prev => ({ ...prev, isOpen: false }));
        if (alertState.onAction) {
            // Execute action after closing if defined (optional, depending on UX preference)
            // For now, we rely on the button click inside modal to trigger action
        }
    }, [alertState.onAction]);

    // Keep SweetAlert for confirm dialogs for now, or implement a separate ConfirmModal later
    const showConfirm = useCallback(async (title: string, message: string, isDestructive: boolean = false) => {
        const Swal = (await import("sweetalert2")).default;
        return Swal.fire({
            title: title,
            text: message,
            icon: isDestructive ? 'warning' : 'question',
            showCancelButton: true,
            confirmButtonText: "Confirm",
            cancelButtonText: "Cancel",
            confirmButtonColor: isDestructive ? '#EF4444' : '#4F46E5',
        }).then((result) => {
            return result.isConfirmed;
        });
    }, []);

    return (
        <ModalContext.Provider value={{ showAlert, showConfirm }}>
            {children}
            <AlertModal
                isOpen={alertState.isOpen}
                onClose={closeAlert}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
                onAction={() => {
                    closeAlert();
                    if (alertState.onAction) alertState.onAction();
                }}
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
