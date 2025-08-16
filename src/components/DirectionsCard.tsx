import React, { useState } from "react";
import { InstructionsModal } from "./InstructionsModal";

export function DirectionsCard() {
    const [showInstructions, setShowInstructions] = useState(false);

    return (
        <>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex items-center justify-center">
                    <button
                        onClick={() => setShowInstructions(true)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Show Instructions
                    </button>
                </div>
            </div>

            <InstructionsModal
                isOpen={showInstructions}
                onClose={() => setShowInstructions(false)}
            />
        </>
    );
}
