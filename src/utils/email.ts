import sgMail from '@sendgrid/mail';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@supplychain-ai.com';

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Email template functions
export const emailTemplates = {
  welcome: (userName: string, companyName: string): Omit<EmailTemplate, 'to'> => ({
    subject: 'Welcome to Supply Chain AI Control Assistant! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3B82F6;">Welcome to Supply Chain AI!</h1>
        <p>Hi ${userName},</p>
        <p>Thank you for signing up! We're excited to have ${companyName} on board.</p>
        <p>Your 14-day free trial has started. Here's what you can do:</p>
        <ul>
          <li>Monitor your inventory in real-time</li>
          <li>Track purchase orders and shipments</li>
          <li>Get AI-powered demand forecasts</li>
          <li>Analyze supplier performance</li>
        </ul>
        <p><a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Go to Dashboard</a></p>
        <p>Need help? Reply to this email or visit our <a href="${process.env.FRONTEND_URL}/help">help center</a>.</p>
        <p>Best regards,<br>The Supply Chain AI Team</p>
      </div>
    `,
  }),

  trialStarted: (userName: string, trialEndDate: Date): Omit<EmailTemplate, 'to'> => ({
    subject: '14-Day Free Trial Activated! ✨',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3B82F6;">Your Free Trial is Active!</h1>
        <p>Hi ${userName},</p>
        <p>Your 14-day free trial is now active and expires on <strong>${trialEndDate.toLocaleDateString()}</strong>.</p>
        <p>During your trial, you have full access to all Starter plan features:</p>
        <ul>
          <li>1,000 API calls per month</li>
          <li>1 GB storage</li>
          <li>1 user seat</li>
          <li>10 reports per month</li>
        </ul>
        <p><a href="${process.env.FRONTEND_URL}/pricing" style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Pricing Plans</a></p>
      </div>
    `,
  }),

  trialExpiring: (userName: string, daysLeft: number): Omit<EmailTemplate, 'to'> => ({
    subject: `⏰ Your Trial Expires in ${daysLeft} Days`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #F59E0B;">Your Trial is Ending Soon</h1>
        <p>Hi ${userName},</p>
        <p>Your free trial will expire in <strong>${daysLeft} days</strong>. Don't lose access to your supply chain insights!</p>
        <p>Upgrade now to continue using:</p>
        <ul>
          <li>Real-time inventory tracking</li>
          <li>AI-powered demand forecasting</li>
          <li>Supplier performance analytics</li>
          <li>And much more...</li>
        </ul>
        <p><a href="${process.env.FRONTEND_URL}/settings/billing" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Upgrade Now</a></p>
        <p>Questions? We're here to help!</p>
      </div>
    `,
  }),

  trialExpired: (userName: string): Omit<EmailTemplate, 'to'> => ({
    subject: 'Your Trial Has Ended - Upgrade to Continue',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #EF4444;">Your Trial Has Ended</h1>
        <p>Hi ${userName},</p>
        <p>Your 14-day free trial has expired. To continue using Supply Chain AI Control Assistant, please upgrade to a paid plan.</p>
        <p>Choose the plan that's right for you:</p>
        <ul>
          <li><strong>Starter</strong> - $99/month - Perfect for small teams</li>
          <li><strong>Growth</strong> - $299/month - For growing businesses</li>
          <li><strong>Enterprise</strong> - Custom pricing - For large organizations</li>
        </ul>
        <p><a href="${process.env.FRONTEND_URL}/pricing" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Pricing</a></p>
      </div>
    `,
  }),

  subscriptionConfirmed: (userName: string, tier: string, amount: number): Omit<EmailTemplate, 'to'> => ({
    subject: '🎉 Subscription Confirmed - Welcome Aboard!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10B981;">Subscription Confirmed!</h1>
        <p>Hi ${userName},</p>
        <p>Thank you for subscribing to the <strong>${tier}</strong> plan at <strong>$${amount}/month</strong>.</p>
        <p>Your subscription is now active and you have full access to all features.</p>
        <p><a href="${process.env.FRONTEND_URL}/settings/billing" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Manage Subscription</a></p>
        <p>Thank you for choosing Supply Chain AI!</p>
      </div>
    `,
  }),

  invoiceReady: (userName: string, amount: number, invoiceUrl: string): Omit<EmailTemplate, 'to'> => ({
    subject: 'Your Invoice is Ready',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3B82F6;">New Invoice</h1>
        <p>Hi ${userName},</p>
        <p>Your invoice for <strong>$${amount}</strong> is ready.</p>
        <p><a href="${invoiceUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Download Invoice</a></p>
      </div>
    `,
  }),

  paymentFailed: (userName: string, amount: number): Omit<EmailTemplate, 'to'> => ({
    subject: '⚠️ Payment Failed - Action Required',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #EF4444;">Payment Failed</h1>
        <p>Hi ${userName},</p>
        <p>We were unable to process your payment of <strong>$${amount}</strong>.</p>
        <p>Please update your payment method to avoid service interruption.</p>
        <p><a href="${process.env.FRONTEND_URL}/settings/billing" style="background-color: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Update Payment Method</a></p>
      </div>
    `,
  }),

  featureAnnouncement: (title: string, description: string): Omit<EmailTemplate, 'to'> => ({
    subject: `🚀 New Feature: ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3B82F6;">New Feature Alert!</h1>
        <h2>${title}</h2>
        <p>${description}</p>
        <p><a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Try It Now</a></p>
      </div>
    `,
  }),

  referralBonus: (userName: string, creditAmount: number): Omit<EmailTemplate, 'to'> => ({
    subject: '🎁 You Earned a Referral Bonus!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10B981;">Congratulations!</h1>
        <p>Hi ${userName},</p>
        <p>You've earned <strong>$${creditAmount}</strong> in referral credits!</p>
        <p>Your referral has successfully signed up and your account has been credited.</p>
        <p><a href="${process.env.FRONTEND_URL}/referral" style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Share Your Link</a></p>
      </div>
    `,
  }),

  usageWarning: (userName: string, metric: string, percentage: number): Omit<EmailTemplate, 'to'> => ({
    subject: `⚠️ Usage Alert: ${metric} at ${percentage}%`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #F59E0B;">Usage Alert</h1>
        <p>Hi ${userName},</p>
        <p>Your <strong>${metric}</strong> usage is at <strong>${percentage}%</strong> of your plan limit.</p>
        <p>Consider upgrading to avoid service interruption.</p>
        <p><a href="${process.env.FRONTEND_URL}/settings/usage" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Usage</a></p>
      </div>
    `,
  }),
};

export async function sendEmail(template: EmailTemplate): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('SendGrid not configured, skipping email:', template.subject);
    return;
  }

  try {
    await sgMail.send({
      from: FROM_EMAIL,
      to: template.to,
      subject: template.subject,
      html: template.html,
      text: template.text || template.html.replace(/<[^>]*>/g, ''),
    });
    console.log('Email sent successfully:', template.subject);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
