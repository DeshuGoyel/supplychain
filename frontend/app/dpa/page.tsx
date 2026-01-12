'use client';

import React from 'react';

export default function DPAPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-8">
          <div className="prose max-w-none">
            <h1 className="text-3xl font-bold mb-6">Data Processing Agreement</h1>
            <div className="text-sm text-gray-600 mb-6">
              <p><strong>Effective Date:</strong> January 12, 2025</p>
              <p><strong>Last Updated:</strong> January 12, 2025</p>
            </div>
            
            <div className="text-sm leading-relaxed space-y-4">
              <p>
                This Data Processing Agreement ("DPA") forms part of the Terms of Service between Supply Chain AI ("Processor" or "we") and the customer ("Controller" or "you") who uses our Supply Chain AI Control Assistant platform.
              </p>
              
              <h2 className="text-xl font-semibold mt-8 mb-4">Key Points</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>We act as a processor of your personal data</li>
                <li>We implement appropriate technical and organizational security measures</li>
                <li>We only process data on documented instructions</li>
                <li>We assist with data subject rights requests</li>
                <li>We maintain records of processing activities</li>
                <li>We delete or return data upon termination</li>
              </ul>
              
              <p className="mt-8 text-sm text-gray-600">
                For the complete DPA, please refer to our documentation or contact our Data Protection Officer at dpo@supplychainai.com.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}