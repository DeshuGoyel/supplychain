import React from 'react';

export default function TermsPage() {
  const [content, setContent] = React.useState('');

  React.useEffect(() => {
    fetch('/api/legal/terms')
      .then(res => res.json())
      .then(data => setContent(data.data.content))
      .catch(err => console.error('Failed to fetch terms:', err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
            <div className="prose prose-blue max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                {content || 'Loading...'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
