import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import Card from '@/components/Common/Card';

const ProgressSummary: React.FC = () => {
  const sections = [
    { name: 'Backend Infrastructure', progress: 100, status: 'COMPLETED' },
    { name: 'Frontend Screens', progress: 100, status: 'COMPLETED' },
    { name: 'Database Schema', progress: 100, status: 'COMPLETED' },
    { name: 'Production Launch Prep', progress: 80, status: 'IN_PROGRESS' },
    { name: 'Operations Setup', progress: 40, status: 'IN_PROGRESS' },
    { name: 'Monetization (Stripe)', progress: 20, status: 'IN_PROGRESS' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'IN_PROGRESS':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'TODO':
        return <AlertTriangle className="h-5 w-5 text-gray-400" />;
      default:
        return null;
    }
  };

  return (
    <Card title="Implementation Progress" className="h-full">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-semibold text-gray-900">Overall Completion</span>
          </div>
          <span className="text-2xl font-bold text-blue-600">85%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '85%' }}></div>
        </div>

        <div className="space-y-4 pt-2">
          {sections.map((section) => (
            <div key={section.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(section.status)}
                  <span className="text-sm font-medium text-gray-700">{section.name}</span>
                </div>
                <span className="text-xs font-semibold text-gray-500">{section.progress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${section.progress === 100 ? 'bg-green-500' : 'bg-blue-400'}`} 
                  style={{ width: `${section.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
        <div className="pt-4 border-t border-gray-100">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Remaining Tasks</h4>
          <ul className="space-y-2">
            <li className="flex items-start space-x-2 text-sm text-gray-600">
              <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0"></div>
              <span>Stripe SDK integration & webhook handling</span>
            </li>
            <li className="flex items-start space-x-2 text-sm text-gray-600">
              <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0"></div>
              <span>SendGrid email service & 5 core templates</span>
            </li>
            <li className="flex items-start space-x-2 text-sm text-gray-600">
              <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0"></div>
              <span>Complete Help documentation & Video tutorials</span>
            </li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default ProgressSummary;
