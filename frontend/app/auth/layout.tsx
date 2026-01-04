import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
        <h1 className="text-center text-4xl font-extrabold text-blue-600 tracking-tight">
          SCACA
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Supply Chain AI Control Assistant
        </p>
      </div>
      <div className="flex justify-center px-4">
        {children}
      </div>
    </div>
  );
}
