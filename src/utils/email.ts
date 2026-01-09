import sgMail from '@sendgrid/mail';

const sendGridApiKey = process.env.SENDGRID_API_KEY;

if (sendGridApiKey) {
  sgMail.setApiKey(sendGridApiKey);
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || process.env.FROM_EMAIL || 'noreply@supplychain.ai';
const FROM_NAME = process.env.SENDGRID_FROM_NAME || process.env.FROM_NAME || 'Supply Chain AI';

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Send email
export const sendEmail = async (template: EmailTemplate): Promise<void> => {
  if (!sendGridApiKey) {
    console.warn('SENDGRID_API_KEY not set, email not sent:', template.subject);
    return;
  }

  try {
    const mailData: any = {
      to: template.to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      subject: template.subject,
      html: template.html
    };
    
    if (template.text) {
      mailData.text = template.text;
    }
    
    await sgMail.send(mailData);
    console.log(`Email sent to ${template.to}: ${template.subject}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Email templates
export const emailTemplates = {
  welcome: (name: string, companyName: string) => ({
    subject: `Welcome to Supply Chain AI, ${name}!`,
    html: `
      <h1>Welcome to Supply Chain AI!</h1>
      <p>Hi ${name},</p>
      <p>Thank you for signing up with ${companyName}. We're excited to have you on board!</p>
      <p>Your 14-day free trial has started. No credit card required.</p>
      <h2>Get Started:</h2>
      <ul>
        <li>Import your inventory data</li>
        <li>Connect with suppliers</li>
        <li>Set up demand forecasting</li>
        <li>View real-time analytics</li>
      </ul>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <p>Best regards,<br>The Supply Chain AI Team</p>
    `,
    text: `Welcome to Supply Chain AI! Your 14-day free trial has started.`
  }),

  trialStarted: (name: string, trialEndDate: string) => ({
    subject: 'Your 14-Day Free Trial Has Started',
    html: `
      <h1>Your Free Trial is Active!</h1>
      <p>Hi ${name},</p>
      <p>Your 14-day free trial is now active and will end on ${trialEndDate}.</p>
      <p>During your trial, you have full access to all Starter plan features:</p>
      <ul>
        <li>1,000 API calls/month</li>
        <li>1GB storage</li>
        <li>1 user</li>
        <li>10 reports/month</li>
      </ul>
      <p>Upgrade anytime to unlock more features!</p>
      <p>Best regards,<br>The Supply Chain AI Team</p>
    `,
    text: `Your 14-day free trial is active until ${trialEndDate}.`
  }),

  trialExpiringSoon: (name: string, daysLeft: number) => ({
    subject: `Your Trial Expires in ${daysLeft} Days`,
    html: `
      <h1>Your Trial is Ending Soon</h1>
      <p>Hi ${name},</p>
      <p>Your free trial will end in ${daysLeft} days.</p>
      <p>To continue using Supply Chain AI without interruption, please upgrade to a paid plan:</p>
      <ul>
        <li><strong>Starter</strong> - $99/month</li>
        <li><strong>Growth</strong> - $299/month (most popular)</li>
        <li><strong>Enterprise</strong> - Custom pricing</li>
      </ul>
      <p><a href="${process.env.FRONTEND_URL}/settings/billing">Upgrade Now</a></p>
      <p>Best regards,<br>The Supply Chain AI Team</p>
    `,
    text: `Your trial expires in ${daysLeft} days. Upgrade to continue using Supply Chain AI.`
  }),

  trialExpired: (name: string) => ({
    subject: 'Your Trial Has Expired',
    html: `
      <h1>Your Trial Has Ended</h1>
      <p>Hi ${name},</p>
      <p>Your 14-day free trial has ended. We hope you enjoyed using Supply Chain AI!</p>
      <p>To continue accessing your account and data, please subscribe to a plan:</p>
      <ul>
        <li><strong>Starter</strong> - $99/month</li>
        <li><strong>Growth</strong> - $299/month</li>
        <li><strong>Enterprise</strong> - Custom pricing</li>
      </ul>
      <p><a href="${process.env.FRONTEND_URL}/settings/billing">Subscribe Now</a></p>
      <p>Your data will be preserved for 30 days.</p>
      <p>Best regards,<br>The Supply Chain AI Team</p>
    `,
    text: 'Your trial has expired. Subscribe to continue using Supply Chain AI.'
  }),

  subscriptionConfirmed: (name: string, tier: string, amount: number) => ({
    subject: 'Subscription Confirmed',
    html: `
      <h1>Welcome to ${tier}!</h1>
      <p>Hi ${name},</p>
      <p>Your subscription has been confirmed. You're now on the ${tier} plan.</p>
      <p>Amount: $${amount}/month</p>
      <p>Thank you for choosing Supply Chain AI!</p>
      <p>Best regards,<br>The Supply Chain AI Team</p>
    `,
    text: `Your ${tier} subscription has been confirmed for $${amount}/month.`
  }),

  invoiceReady: (name: string, invoiceUrl: string, amount: number) => ({
    subject: 'Your Invoice is Ready',
    html: `
      <h1>Invoice Ready</h1>
      <p>Hi ${name},</p>
      <p>Your latest invoice is ready for $${amount}.</p>
      <p><a href="${invoiceUrl}">Download Invoice PDF</a></p>
      <p>Payment will be processed automatically.</p>
      <p>Best regards,<br>The Supply Chain AI Team</p>
    `,
    text: `Your invoice for $${amount} is ready. Download at ${invoiceUrl}`
  }),

  paymentFailed: (name: string) => ({
    subject: 'Payment Failed - Action Required',
    html: `
      <h1>Payment Failed</h1>
      <p>Hi ${name},</p>
      <p>We were unable to process your payment. Please update your payment method to avoid service interruption.</p>
      <p><a href="${process.env.FRONTEND_URL}/settings/billing">Update Payment Method</a></p>
      <p>We'll retry the payment in 3 days.</p>
      <p>Best regards,<br>The Supply Chain AI Team</p>
    `,
    text: 'Payment failed. Please update your payment method.'
  }),

  cancellationConfirmation: (name: string, endDate: string) => ({
    subject: 'Subscription Cancelled',
    html: `
      <h1>Subscription Cancelled</h1>
      <p>Hi ${name},</p>
      <p>Your subscription has been cancelled. You'll continue to have access until ${endDate}.</p>
      <p>We're sorry to see you go! If you change your mind, you can resubscribe anytime.</p>
      <p>Best regards,<br>The Supply Chain AI Team</p>
    `,
    text: `Your subscription is cancelled. Access until ${endDate}.`
  }),

  referralBonus: (name: string, amount: number) => ({
    subject: `You've Earned $${amount} in Credits!`,
    html: `
      <h1>Referral Bonus!</h1>
      <p>Hi ${name},</p>
      <p>Great news! Someone signed up using your referral link.</p>
      <p>You've earned $${amount} in credits that will be applied to your next invoice.</p>
      <p>Keep sharing to earn more!</p>
      <p><a href="${process.env.FRONTEND_URL}/referral">View Referral Dashboard</a></p>
      <p>Best regards,<br>The Supply Chain AI Team</p>
    `,
    text: `You've earned $${amount} in referral credits!`
  }),

  usageWarning: (name: string, metric: string, percentage: number) => ({
    subject: `Usage Alert: ${metric} at ${percentage}%`,
    html: `
      <h1>Usage Warning</h1>
      <p>Hi ${name},</p>
      <p>Your ${metric} usage is at ${percentage}% of your plan limit.</p>
      <p>Consider upgrading to avoid service interruption.</p>
      <p><a href="${process.env.FRONTEND_URL}/settings/billing">Upgrade Plan</a></p>
      <p>Best regards,<br>The Supply Chain AI Team</p>
    `,
    text: `${metric} usage at ${percentage}%. Consider upgrading.`
  })
};
