'use client';

import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Database, 
  Layout, 
  Server, 
  CreditCard, 
  FileText,
  ShieldCheck
} from 'lucide-react';
import Card from '@/components/Common/Card';

const ProgressPage = () => {
  const milestones = [
    {
      title: 'Backend Infrastructure',
      status: 'COMPLETED',
      progress: 100,
      icon: Server,
      tasks: [
        'Rate limiting middleware',
        'Request logging system',
        'Global error handling',
        'CORS configuration',
        'Input validation (Zod)',
      ]
    },
    {
      title: 'Frontend Screens',
      status: 'COMPLETED',
      progress: 100,
      icon: Layout,
      tasks: [
        'Main Dashboard with KPIs',
        'Inventory Management',
        'Supplier Performance',
        'Demand Planning',
        'Shipment Tracking',
      ]
    },
    {
      title: 'Database Schema',
      status: 'COMPLETED',
      progress: 100,
      icon: Database,
      tasks: [
        'PostgreSQL Migration',
        'Location & Shipment Models',
        'Purchase Order Models',
        'KPI & Forecast Models',
        'Audit Logging Schema',
      ]
    },
    {
      title: 'Production Launch',
      status: 'IN_PROGRESS',
      progress: 80,
      icon: TrendingUp,
      tasks: [
        'Railway Backend Deployment',
        'Vercel Frontend Deployment',
        'Production Seed Scripts',
        'Health Check Verification',
        'Monitoring Setup (Pending)',
      ]
    },
    {
      title: 'Operations & Support',
      status: 'IN_PROGRESS',
      progress: 40,
      icon: FileText,
      tasks: [
        'Terms of Service',
        'Privacy Policy',
        'FAQ Documentation',
        'Support Email System',
        'Help Center UI',
      ]
    },
    {
      title: 'Monetization (Stripe)',
      status: 'IN_PROGRESS',
      progress: 20,
      icon: CreditCard,
      tasks: [
        'Subscription Data Models',
        'Stripe Checkout flow',
        'Webhook handling',
        'Customer portal',
        'Billing history UI',
      ]
    },
    {
      title: 'Enterprise Features',
      status: 'TODO',
      progress: 0,
      icon: ShieldCheck,
      tasks: [
        'SSO/SAML Integration',
        'Advanced RBAC',
        'White-label configuration',
        'Audit log export',
        'Custom API Access',
      ]
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-medium">Completed</span>;
      case 'IN_PROGRESS':
        return <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-medium">In Progress</span>;
      case 'TODO':
        return <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full text-xs font-medium">Coming Soon</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Roadmap</h1>
          <p className="text-gray-500 mt-1">Status of the Supply Chain AI Control Assistant implementation</p>
        </div>
        <div className="mt-4 md:mt-0 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md flex items-center space-x-3">
          <div className="text-3xl font-bold">85%</div>
          <div className="text-sm border-l border-blue-400 pl-3">
            <p className="font-semibold">Overall</p>
            <p>Completion</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {milestones.map((milestone) => (
          <Card key={milestone.title} className="h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-slate-100 rounded-lg">
                <milestone.icon className="h-6 w-6 text-slate-700" />
              </div>
              {getStatusBadge(milestone.status)}
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">{milestone.title}</h3>
            
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Progress</span>
                <span className="font-semibold">{milestone.progress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${milestone.progress === 100 ? 'bg-green-500' : milestone.progress > 0 ? 'bg-blue-500' : 'bg-gray-300'}`} 
                  style={{ width: `${milestone.progress}%` }}
                ></div>
              </div>
            </div>

            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Key Deliverables</h4>
            <ul className="space-y-2">
              {milestone.tasks.map((task, i) => (
                <li key={i} className="flex items-start space-x-2 text-sm text-gray-600">
                  {milestone.status === 'COMPLETED' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <div className="h-4 w-4 border-2 border-gray-200 rounded-full mt-0.5 flex-shrink-0"></div>
                  )}
                  <span>{task}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card title="Detailed Next Steps" className="mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-500" />
              Immediate Priorities (Left)
            </h4>
            <ul className="space-y-4">
              <li className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <p className="font-bold text-blue-900">Stripe Integration</p>
                <p className="text-sm text-blue-700 mt-1">Finish checkout flow and webhook listeners to enable subscription billing.</p>
              </li>
              <li className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <p className="font-bold text-blue-900">Email System</p>
                <p className="text-sm text-blue-700 mt-1">Connect SendGrid and implement templates for welcome, low stock, and delay alerts.</p>
              </li>
              <li className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <p className="font-bold text-blue-900">Monitoring & Logging</p>
                <p className="text-sm text-blue-700 mt-1">Set up Sentry and production log aggregation for better system visibility.</p>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
              Recent Achievements (Done)
            </h4>
            <ul className="space-y-4">
              <li className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <p className="font-bold text-green-900">Full API Coverage</p>
                <p className="text-sm text-green-700 mt-1">Implemented over 40 RESTful endpoints covering the entire supply chain domain.</p>
              </li>
              <li className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <p className="font-bold text-green-900">Interactive Analytics</p>
                <p className="text-sm text-green-700 mt-1">Added 5 comprehensive analytics dashboards with Recharts integration.</p>
              </li>
              <li className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <p className="font-bold text-green-900">Security Core</p>
                <p className="text-sm text-green-700 mt-1">JWT authentication with role-based access control and rate limiting.</p>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProgressPage;
