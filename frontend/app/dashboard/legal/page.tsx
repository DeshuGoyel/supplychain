'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { CheckCircle, AlertCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface Document {
  id: string;
  type: string;
  version: string;
  title: string;
  content: string;
  effectiveDate: string;
}

export default function LegalAcceptancePage() {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [acceptances, setAcceptances] = useState<Record<string, boolean>>({});
  const [needsAcceptance, setNeedsAcceptance] = useState<string[]>([]);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [allAccepted, setAllAccepted] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      const [docsRes, acceptancesRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/legal/public`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/legal/acceptances`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setDocuments(docsRes.data.documents || []);
      setNeedsAcceptance(acceptancesRes.data.needsAcceptance || []);

      // Initialize acceptances with current status
      const initialAcceptances: Record<string, boolean> = {};
      docsRes.data.documents.forEach((doc: Document) => {
        const acceptedVersion = acceptancesRes.data.acceptances?.find(
          (a: any) => a.documentType === doc.type
        )?.version;
        initialAcceptances[doc.type] = acceptedVersion === doc.version;
      });
      setAcceptances(initialAcceptances);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load legal documents');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (docType: string, version: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/legal/accept`,
        { documentType: docType, documentVersion: version },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAcceptances(prev => ({ ...prev, [docType]: true }));
      setNeedsAcceptance(prev => prev.filter(d => d !== docType));
      toast.success(`${docType.replace(/_/g, ' ').toLowerCase()} accepted`);
    } catch (error) {
      toast.error('Failed to accept document');
    }
  };

  const handleAcceptAll = async () => {
    const pending = documents.filter(d => !acceptances[d.type]);
    for (const doc of pending) {
      await handleAccept(doc.type, doc.version);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const documentTypeLabels: Record<string, string> = {
    TERMS_OF_SERVICE: 'Terms of Service',
    PRIVACY_POLICY: 'Privacy Policy',
    COOKIE_POLICY: 'Cookie Policy',
    ACCEPTABLE_USE: 'Acceptable Use Policy',
    DPA: 'Data Processing Agreement'
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-blue-900">Action Required</h3>
            <p className="text-sm text-blue-700 mt-1">
              Please review and accept the following legal documents to continue using the platform.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {documents.map((doc) => (
          <div key={doc.id} className="bg-white border rounded-lg overflow-hidden">
            <div 
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
              onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
            >
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">{documentTypeLabels[doc.type] || doc.type}</h3>
                  <p className="text-sm text-gray-500">Version {doc.version}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {acceptances[doc.type] ? (
                  <span className="flex items-center text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Accepted
                  </span>
                ) : needsAcceptance.includes(doc.type) && (
                  <span className="flex items-center text-orange-600 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Requires acceptance
                  </span>
                )}
                {expandedDoc === doc.id ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>

            {expandedDoc === doc.id && (
              <div className="border-t px-4 py-4 bg-gray-50">
                <div 
                  className="prose prose-sm max-w-none mb-4"
                  dangerouslySetInnerHTML={{ __html: doc.content }}
                />
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => handleAccept(doc.type, doc.version)}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      acceptances[doc.type]
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                    disabled={acceptances[doc.type]}
                  >
                    {acceptances[doc.type] ? 'Accepted' : 'Accept'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {needsAcceptance.length > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleAcceptAll}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium"
          >
            Accept All Documents
          </button>
        </div>
      )}

      {needsAcceptance.length === 0 && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <h3 className="font-medium text-green-900">All documents accepted</h3>
          <p className="text-sm text-green-700 mt-1">
            Thank you for reviewing and accepting our legal documents.
          </p>
        </div>
      )}
    </div>
  );
}
