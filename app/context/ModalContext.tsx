"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from "react";
import AlertModal, { AlertType } from "@/app/components/AlertModal";
import ConfirmModal from "@/app/components/ConfirmModal";

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

    const resolveRef = useRef<((value: boolean) => void) | null>(null);
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: "",
        message: "",
        isDestructive: false
    });

    // Keep SweetAlert for confirm dialogs for now, or implement a separate ConfirmModal later
    const showConfirm = useCallback((title: string, message: string, isDestructive: boolean = false) => {
        return new Promise<boolean>((resolve) => {
            resolveRef.current = resolve;
            setConfirmState({
                isOpen: true,
                title,
                message,
                isDestructive
            });
        });
    }, []);

    const handleConfirm = useCallback(() => {
        if (resolveRef.current) {
            resolveRef.current(true);
            resolveRef.current = null;
        }
        setConfirmState(prev => ({ ...prev, isOpen: false }));
    }, []);

    const handleCancel = useCallback(() => {
        if (resolveRef.current) {
            resolveRef.current(false);
            resolveRef.current = null;
        }
        setConfirmState(prev => ({ ...prev, isOpen: false }));
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
            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={handleCancel}
                onConfirm={handleConfirm}
                title={confirmState.title}
                message={confirmState.message}
                isDestructive={confirmState.isDestructive}
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
