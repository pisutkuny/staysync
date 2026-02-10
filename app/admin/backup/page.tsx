'use client';

import { useState } from 'react';
import { Download, Upload, Database, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export default function BackupPage() {
    const [downloading, setDownloading] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [backupFile, setBackupFile] = useState<File | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [backupPreview, setBackupPreview] = useState<any>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleDownloadBackup = async () => {
        try {
            setDownloading(true);
            setMessage(null);

            const response = await fetch('/api/backup/export', {
                method: 'POST'
            });

            if (!response.ok) throw new Error('Backup export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `staysync-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setMessage({ type: 'success', text: '✅ Backup downloaded successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: '❌ Backup export failed' });
        } finally {
            setDownloading(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setBackupFile(file);
            const text = await file.text();
            const backup = JSON.parse(text);
            setBackupPreview(backup);
            setShowConfirm(true);
            setMessage(null);
        } catch (error) {
            setMessage({ type: 'error', text: '❌ Invalid backup file format' });
            setBackupFile(null);
        }
    };

    const handleRestore = async () => {
        if (!backupFile || !backupPreview) return;

        try {
            setRestoring(true);
            setMessage(null);

            const text = await backupFile.text();
            const backup = JSON.parse(text);

            const response = await fetch('/api/backup/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ backup })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Restore failed');
            }

            setMessage({ type: 'success', text: '✅ Database restored successfully!' });
            setShowConfirm(false);
            setBackupFile(null);
            setBackupPreview(null);

            // Refresh page after 2 seconds
            setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
            setMessage({
                type: 'error',
                text: `❌ Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        } finally {
            setRestoring(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Database className="text-indigo-600" size={32} />
                    Database Backup & Restore
                </h1>
                <p className="text-gray-600 mt-2">
                    สำรองและกู้คืนข้อมูลระบบ StaySync
                </p>
            </div>

            {/* Alert Messages */}
            {message && (
                <div className={`mb-6 p-4 rounded-lg border-2 ${message.type === 'success'
                        ? 'bg-green-50 border-green-500 text-green-900'
                        : 'bg-red-50 border-red-500 text-red-900'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Download Backup Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-start gap-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                        <Download className="text-blue-600" size={24} />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            Download Backup
                        </h2>
                        <p className="text-gray-600 mb-4">
                            สำรองข้อมูลทั้งหมดออกเป็นไฟล์ JSON
                        </p>
                        <button
                            onClick={handleDownloadBackup}
                            disabled={downloading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {downloading ? (
                                <>
                                    <RefreshCw className="animate-spin" size={20} />
                                    Generating Backup...
                                </>
                            ) : (
                                <>
                                    <Download size={20} />
                                    Download Backup
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Upload Restore Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-start gap-4">
                    <div className="bg-red-100 p-3 rounded-lg">
                        <Upload className="text-red-600" size={24} />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            Restore from Backup
                        </h2>
                        <p className="text-gray-600 mb-4">
                            กู้คืนข้อมูลจากไฟล์ Backup
                        </p>

                        <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-4 mb-4 flex gap-3">
                            <AlertCircle className="text-yellow-700 flex-shrink-0" size={20} />
                            <div className="text-sm text-yellow-900">
                                <strong>⚠️ คำเตือน:</strong> การกู้คืนข้อมูลจะ<strong>ลบข้อมูลเดิมทั้งหมด</strong>และแทนที่ด้วยข้อมูลจาก backup
                            </div>
                        </div>

                        <input
                            type="file"
                            accept=".json"
                            onChange={handleFileSelect}
                            className="mb-4 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none p-2"
                        />

                        {backupFile && (
                            <div className="text-sm text-gray-600 mb-4">
                                📄 Selected: <strong>{backupFile.name}</strong>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirm && backupPreview && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => !restoring && setShowConfirm(false)}>
                    <div className="bg-white rounded-xl p-6 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-900">
                            <AlertCircle className="text-yellow-600" />
                            Confirm Restore
                        </h2>

                        <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-4 mb-6">
                            <strong className="text-gray-900">⚠️ คุณแน่ใจหรือไม่?</strong>
                            <p className="text-gray-800 mt-1">
                                การดำเนินการนี้จะลบข้อมูลปัจจุบันทั้งหมดและแทนที่ด้วยข้อมูลจาก backup
                            </p>
                        </div>

                        <div className="bg-gray-100 rounded-lg p-4 mb-6">
                            <h3 className="font-bold text-gray-900 mb-3">Backup Information</h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-gray-600">Export Date:</span>
                                    <div className="font-semibold">{new Date(backupPreview.metadata.exportDate).toLocaleString()}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Total Records:</span>
                                    <div className="font-semibold">{backupPreview.metadata.totalRecords}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Users:</span>
                                    <div className="font-semibold">{backupPreview.data.users?.length || 0}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Rooms:</span>
                                    <div className="font-semibold">{backupPreview.data.rooms?.length || 0}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Residents:</span>
                                    <div className="font-semibold">{backupPreview.data.residents?.length || 0}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Billing:</span>
                                    <div className="font-semibold">{backupPreview.data.billing?.length || 0}</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                disabled={restoring}
                                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRestore}
                                disabled={restoring}
                                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {restoring ? (
                                    <>
                                        <RefreshCw className="animate-spin" size={20} />
                                        Restoring...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={20} />
                                        Confirm Restore
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
