'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PolicyPage({ docType }: { docType: string }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const response = await fetch(`/docs/${docType.toUpperCase()}.md`);
        if (response.ok) {
          const text = await response.text();
          setContent(text);
        } else {
          setContent('# Document not found');
        }
      } catch (error) {
        console.error('Error fetching policy document:', error);
        setContent('# Error loading document');
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [docType]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-8 prose prose-slate">
      <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }} />
      <button 
        onClick={() => window.history.back()}
        className="mt-8 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
      >
        Back
      </button>
    </div>
  );
}
