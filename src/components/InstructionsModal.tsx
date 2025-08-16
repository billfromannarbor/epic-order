import React, { useState, useEffect } from "react";

interface InstructionsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function InstructionsModal({ isOpen, onClose }: InstructionsModalProps) {
    const [instructions, setInstructions] = useState<string>("");

    useEffect(() => {
        if (isOpen) {
            // Fetch instructions from the public file
            fetch("/instructions.txt")
                .then(response => response.text())
                .then(text => setInstructions(text))
                .catch(error => {
                    console.error("Error loading instructions:", error);
                    setInstructions("Instructions could not be loaded. Please try again.");
                });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="relative max-w-2xl w-full mx-4 max-h-[80vh] bg-white rounded-2xl shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-900">Game Instructions</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close instructions"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700">
                        {instructions}
                    </pre>
                </div>

                {/* Footer */}
                <div className="flex justify-end p-6 border-t">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Got it!
                    </button>
                </div>
            </div>
        </div>
    );
}
