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
            case "success": return <CheckCircle size={32} strokeWidth={3} className="text-green-600" />;
            case "error": return <XCircle size={32} strokeWidth={3} className="text-red-600" />;
            case "warning": return <AlertCircle size={32} strokeWidth={3} className="text-amber-600" />;
            case "info": return <Info size={32} strokeWidth={3} className="text-blue-600" />;
        }
    };

    const getBgColor = () => {
        switch (type) {
            case "success": return "bg-green-100";
            case "error": return "bg-red-100";
            case "warning": return "bg-amber-100";
            case "info": return "bg-blue-100";
        }
    };

    const getButtonColor = () => {
        switch (type) {
            case "success": return "bg-gradient-to-r from-green-500 to-emerald-600 hover:bg-green-600";
            case "error": return "bg-gradient-to-r from-red-500 to-rose-600 hover:bg-red-600";
            case "warning": return "bg-gradient-to-r from-amber-500 to-orange-600 hover:bg-amber-600";
            case "info": return "bg-gradient-to-r from-blue-500 to-indigo-600 hover:bg-blue-600";
        }
    };

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-sm transform transition-all duration-300 ${isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"}`}>
                <div className="p-6 flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-inner ${getBgColor()}`}>
                        {getIcon()}
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-gray-500 mb-6 leading-relaxed">
                        {message}
                    </p>

                    <button
                        onClick={handleAction}
                        className={`w-full py-3 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center ${getButtonColor()}`}
                    >
                        {actionLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
