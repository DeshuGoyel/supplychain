'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

interface LegalDocumentProps {
  type: string;
  title: string;
}

interface LegalDocumentData {
  type: string;
  title: string;
  content: string;
  effectiveDate: string;
  uptime?: string;
}

export default function LegalDocument({ type, title }: LegalDocumentProps) {
  const [document, setDocument] = useState<LegalDocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/legal/${type}`
        );

        if (response.data.success) {
          setDocument(response.data.data);
        }
      } catch (err) {
        setError('Failed to load document');
        console.error('Error fetching legal document:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [type]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading {title}...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <p className="text-gray-600">{error || 'Document not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8 md:p-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{document.title}</h1>
          <p className="text-sm text-gray-500">
            Effective Date: {new Date(document.effectiveDate).toLocaleDateString()}
          </p>
          {document.uptime && (
            <p className="text-sm text-green-600 mt-1">
              Uptime Guarantee: {document.uptime}
            </p>
          )}
        </div>

        <div className="prose prose-lg max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ ...props }) => (
                <h1 className="text-3xl font-bold mt-8 mb-4 text-gray-900" {...props} />
              ),
              h2: ({ ...props }) => (
                <h2 className="text-2xl font-semibold mt-6 mb-3 text-gray-800" {...props} />
              ),
              h3: ({ ...props }) => (
                <h3 className="text-xl font-semibold mt-4 mb-2 text-gray-800" {...props} />
              ),
              p: ({ ...props }) => (
                <p className="mb-4 text-gray-700 leading-relaxed" {...props} />
              ),
              ul: ({ ...props }) => (
                <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700" {...props} />
              ),
              ol: ({ ...props }) => (
                <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700" {...props} />
              ),
              li: ({ ...props }) => (
                <li className="ml-4" {...props} />
              ),
              table: ({ ...props }) => (
                <div className="overflow-x-auto my-6">
                  <table className="min-w-full divide-y divide-gray-200" {...props} />
                </div>
              ),
              thead: ({ ...props }) => (
                <thead className="bg-gray-50" {...props} />
              ),
              th: ({ ...props }) => (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" {...props} />
              ),
              td: ({ ...props }) => (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700" {...props} />
              ),
              strong: ({ ...props }) => (
                <strong className="font-bold text-gray-900" {...props} />
              ),
              hr: ({ ...props }) => (
                <hr className="my-8 border-gray-300" {...props} />
              ),
            }}
          >
            {document.content}
          </ReactMarkdown>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <button
              onClick={() => window.print()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Print / Save as PDF
            </button>
            <a
              href="/"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
