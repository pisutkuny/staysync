"use client";

import { CheckCircle, AlertCircle, Info, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

export type AlertType = "success" | "error" | "info" | "warning";

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: AlertType;
    actionLabel?: string;
    onAction?: () => void;
}

export default function AlertModal({
    isOpen,
    onClose,
    title,
    message,
    type = "success",
    actionLabel = "OK",
    onAction
}: AlertModalProps) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShow(true);
        } else {
            const timer = setTimeout(() => setShow(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!show && !isOpen) return null;

    const handleAction = () => {
        if (onAction) {
            onAction();
        } else {
            onClose();
        }
    };

    const getIcon = () => {
        switch (type) {
            case "success": return (
                <div className="relative">
                    <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75"></div>
                    <div className="relative bg-green-50 rounded-full p-4">
                        <CheckCircle size={48} className="text-green-500" strokeWidth={2.5} />
                    </div>
                </div>
            );
            case "error": return (
                <div className="relative">
                    <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-75"></div>
                    <div className="relative bg-red-50 rounded-full p-4">
                        <XCircle size={48} className="text-red-500" strokeWidth={2.5} />
                    </div>
                </div>
            );
            case "warning": return (
                <div className="relative">
                    <div className="absolute inset-0 bg-amber-100 rounded-full animate-ping opacity-75"></div>
                    <div className="relative bg-amber-50 rounded-full p-4">
                        <AlertCircle size={48} className="text-amber-500" strokeWidth={2.5} />
                    </div>
                </div>
            );
            case "info": return (
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                    <div className="relative bg-blue-50 rounded-full p-4">
                        <Info size={48} className="text-blue-500" strokeWidth={2.5} />
                    </div>
                </div>
            );
        }
    };

    const getButtonColor = () => {
        switch (type) {
            case "success": return "bg-[#00C853] hover:bg-[#00BFA5] text-white shadow-green-200";
            case "error": return "bg-[#D50000] hover:bg-[#C62828] text-white shadow-red-200";
            case "warning": return "bg-[#FFAB00] hover:bg-[#FF9100] text-white shadow-amber-200";
            case "info": return "bg-[#2962FF] hover:bg-[#2979FF] text-white shadow-blue-200";
        }
    };

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}>
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={`relative bg-white rounded-[24px] shadow-2xl w-full max-w-[360px] transform transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${show ? "scale-100 translate-y-0 opacity-100" : "scale-90 translate-y-8 opacity-0"}`}>
                <div className="p-8 flex flex-col items-center text-center">
                    <div className="mb-6">
                        {getIcon()}
                    </div>

                    <h3 className="text-2xl font-bold text-gray-800 mb-2 font-display tracking-tight">{title}</h3>
                    <p className="text-gray-500 mb-8 text-[15px] leading-relaxed font-medium">
                        {message}
                    </p>

                    <button
                        onClick={handleAction}
                        className={`w-full py-3.5 rounded-xl font-bold shadow-lg transition-all transform active:scale-95 ${getButtonColor()}`}
                    >
                        {actionLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
