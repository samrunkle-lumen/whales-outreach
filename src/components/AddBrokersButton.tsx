"use client";

import { useState } from "react";
import { AddBrokersModal } from "./AddBrokersModal";

export function AddBrokersButton() {
  const [showModal, setShowModal] = useState(false);

  const handleSuccess = () => {
    // Reload the page to show new data
    // Note: In a production app, you'd want to use a more sophisticated state management approach
    window.location.reload();
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center justify-center px-6 py-3 bg-[#1A1A1A] text-white font-medium text-sm hover:bg-[#333] transition-colors"
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        Add Brokers
      </button>

      {showModal && (
        <AddBrokersModal
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
