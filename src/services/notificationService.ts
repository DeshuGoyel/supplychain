import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class NotificationService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeEmailService();
  }

  private initializeEmailService() {
    const emailService = process.env.EMAIL_SERVICE || 'sendgrid';
    const emailHost = process.env.EMAIL_HOST || 'smtp.sendgrid.net';
    const emailPort = parseInt(process.env.EMAIL_PORT || '587');
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      console.warn('Email service credentials not configured. Email notifications will be disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    this.transporter.verify((error) => {
      if (error) {
        console.error('Email service connection failed:', error);
      } else {
        console.log('Email service connected successfully');
      }
    });
  }

  async sendEmail(to: string, subject: string, html: string, text?: string) {
    if (!this.transporter) {
      console.error('Email service not configured');
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@supplychainai.com',
        to,
        subject,
        html,
        text,
      });
      console.log('Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async checkNotificationPreferences(userId: string, companyId: string, notificationType: string): Promise<boolean> {
    const preference = await prisma.notificationPreference.findUnique({
      where: {
        userId_notificationType: {
          userId,
          notificationType,
        },
      },
    });

    if (!preference) {
      return true;
    }

    return preference.enabled && preference.email;
  }

  async logNotification(
    userId: string,
    companyId: string,
    type: string,
    email: string,
    subject: string,
    content: string,
    metadata?: any,
    status: string = 'sent'
  ) {
    await prisma.notificationLog.create({
      data: {
        userId,
        companyId,
        type,
        status,
        email,
        subject,
        content,
        metadata,
      },
    });
  }

  async sendLowInventoryAlert(inventory: any) {
    const companyId = inventory.companyId;

    const users = await prisma.user.findMany({
      where: { companyId },
    });

    for (const user of users) {
      const shouldSend = await this.checkNotificationPreferences(user.id, companyId, 'LOW_INVENTORY');
      if (!shouldSend) continue;

      const subject = `Low Stock Alert: ${inventory.sku}`;
      const html = this.getLowInventoryTemplate(inventory);

      const success = await this.sendEmail(user.email, subject, html);
      await this.logNotification(
        user.id,
        companyId,
        'LOW_INVENTORY',
        user.email,
        subject,
        html,
        { sku: inventory.sku, quantity: inventory.quantity },
        success ? 'sent' : 'failed'
      );
    }
  }

  async sendLateOrderAlert(order: any) {
    const companyId = order.companyId;

    const users = await prisma.user.findMany({
      where: { companyId },
    });

    for (const user of users) {
      const shouldSend = await this.checkNotificationPreferences(user.id, companyId, 'LATE_ORDER');
      if (!shouldSend) continue;

      const subject = `Late Order Alert: ${order.orderNumber}`;
      const html = this.getLateOrderTemplate(order);

      const success = await this.sendEmail(user.email, subject, html);
      await this.logNotification(
        user.id,
        companyId,
        'LATE_ORDER',
        user.email,
        subject,
        html,
        { orderNumber: order.orderNumber, daysOverdue: order.daysOverdue },
        success ? 'sent' : 'failed'
      );
    }
  }

  async sendSupplierAlert(supplier: any, alertType: string, details: any) {
    const companyId = supplier.companyId;

    const users = await prisma.user.findMany({
      where: { companyId },
    });

    for (const user of users) {
      const shouldSend = await this.checkNotificationPreferences(user.id, companyId, 'SUPPLIER_ALERT');
      if (!shouldSend) continue;

      const subject = `Supplier Alert: ${supplier.name}`;
      const html = this.getSupplierAlertTemplate(supplier, alertType, details);

      const success = await this.sendEmail(user.email, subject, html);
      await this.logNotification(
        user.id,
        companyId,
        'SUPPLIER_ALERT',
        user.email,
        subject,
        html,
        { supplierId: supplier.id, alertType },
        success ? 'sent' : 'failed'
      );
    }
  }

  async sendApprovalNotification(po: any, recipientEmail: string) {
    const subject = `Purchase Order Approval Required: ${po.poNumber}`;
    const html = this.getApprovalTemplate(po);

    const success = await this.sendEmail(recipientEmail, subject, html);
    await this.logNotification(
      po.companyId,
      po.companyId,
      'APPROVAL_NEEDED',
      recipientEmail,
      subject,
      html,
      { poNumber: po.poNumber, totalAmount: po.totalAmount },
      success ? 'sent' : 'failed'
    );
  }

  async sendDailyDigest(companyId: string) {
    const users = await prisma.user.findMany({
      where: { companyId },
    });

    const kpis = await prisma.kPI.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const lowStockItems = await prisma.inventory.findMany({
      where: { companyId, stockLevel: 'LOW' },
      take: 10,
    });

    const lateOrders = await prisma.order.findMany({
      where: { companyId, status: 'DELAYED' },
      take: 10,
    });

    for (const user of users) {
      const shouldSend = await this.checkNotificationPreferences(user.id, companyId, 'DAILY_DIGEST');
      if (!shouldSend) continue;

      const subject = `Daily Supply Chain Digest - ${new Date().toLocaleDateString()}`;
      const html = this.getDailyDigestTemplate(kpis, lowStockItems, lateOrders);

      const success = await this.sendEmail(user.email, subject, html);
      await this.logNotification(
        user.id,
        companyId,
        'DAILY_DIGEST',
        user.email,
        subject,
        html,
        { date: new Date().toISOString() },
        success ? 'sent' : 'failed'
      );
    }
  }

  async sendWeeklyDigest(companyId: string) {
    const users = await prisma.user.findMany({
      where: { companyId },
    });

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const kpis = await prisma.kPI.findMany({
      where: {
        companyId,
        createdAt: { gte: weekAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    const suppliers = await prisma.supplier.findMany({
      where: { companyId, status: 'ACTIVE' },
      orderBy: { performanceScore: 'desc' },
      take: 5,
    });

    for (const user of users) {
      const shouldSend = await this.checkNotificationPreferences(user.id, companyId, 'WEEKLY_REPORT');
      if (!shouldSend) continue;

      const subject = `Weekly Supply Chain Report - ${now.toLocaleDateString()}`;
      const html = this.getWeeklyDigestTemplate(kpis, suppliers);

      const success = await this.sendEmail(user.email, subject, html);
      await this.logNotification(
        user.id,
        companyId,
        'WEEKLY_REPORT',
        user.email,
        subject,
        html,
        { weekStart: weekAgo.toISOString(), weekEnd: now.toISOString() },
        success ? 'sent' : 'failed'
      );
    }
  }

  private getLowInventoryTemplate(inventory: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .alert { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; }
    .details { margin: 15px 0; padding: 15px; background: white; border: 1px solid #e5e7eb; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Low Stock Alert</h1>
    </div>
    <div class="content">
      <div class="alert">
        <strong>Inventory Level Critical</strong><br>
        The following item has dropped below its reorder point.
      </div>
      <div class="details">
        <h3>Item Details</h3>
        <p><strong>SKU:</strong> ${inventory.sku}</p>
        <p><strong>Name:</strong> ${inventory.name}</p>
        <p><strong>Current Quantity:</strong> ${inventory.quantity}</p>
        <p><strong>Reorder Point:</strong> ${inventory.reorderPoint}</p>
        <p><strong>Unit Cost:</strong> $${inventory.unitCost.toFixed(2)}</p>
        <p><strong>Location:</strong> ${inventory.location?.name || 'Unassigned'}</p>
      </div>
      <a href="${process.env.APP_URL}/inventory" class="button">View in Dashboard</a>
    </div>
    <div class="footer">
      <p>This is an automated notification from Supply Chain AI Control Assistant</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getLateOrderTemplate(order: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }
    .details { margin: 15px 0; padding: 15px; background: white; border: 1px solid #e5e7eb; }
    .button { display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📦 Late Order Alert</h1>
    </div>
    <div class="content">
      <div class="alert">
        <strong>Order Delayed</strong><br>
        The following order is overdue and requires attention.
      </div>
      <div class="details">
        <h3>Order Details</h3>
        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p><strong>Supplier:</strong> ${order.supplier?.name}</p>
        <p><strong>ETA:</strong> ${new Date(order.eta).toLocaleDateString()}</p>
        <p><strong>Days Overdue:</strong> ${order.daysOverdue}</p>
        <p><strong>Priority:</strong> ${order.priority}</p>
        <p><strong>Status:</strong> ${order.status}</p>
      </div>
      <a href="${process.env.APP_URL}/orders" class="button">View in Dashboard</a>
    </div>
    <div class="footer">
      <p>This is an automated notification from Supply Chain AI Control Assistant</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getSupplierAlertTemplate(supplier: any, alertType: string, details: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }
    .details { margin: 15px 0; padding: 15px; background: white; border: 1px solid #e5e7eb; }
    .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏭 Supplier Performance Alert</h1>
    </div>
    <div class="content">
      <div class="alert">
        <strong>${alertType}</strong><br>
        ${supplier.name} has triggered a performance alert.
      </div>
      <div class="details">
        <h3>Supplier Details</h3>
        <p><strong>Name:</strong> ${supplier.name}</p>
        <p><strong>On-Time Rate:</strong> ${supplier.onTimeRate.toFixed(1)}%</p>
        <p><strong>Quality Rate:</strong> ${supplier.qualityRate.toFixed(1)}%</p>
        <p><strong>Lead Time:</strong> ${supplier.leadTime.toFixed(1)} days</p>
        <p><strong>Performance Score:</strong> ${supplier.performanceScore.toFixed(0)}/100</p>
      </div>
      <a href="${process.env.APP_URL}/suppliers" class="button">View in Dashboard</a>
    </div>
    <div class="footer">
      <p>This is an automated notification from Supply Chain AI Control Assistant</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getApprovalTemplate(po: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #8b5cf6; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .details { margin: 15px 0; padding: 15px; background: white; border: 1px solid #e5e7eb; }
    .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 5px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✍️ Purchase Order Approval Required</h1>
    </div>
    <div class="content">
      <p>A purchase order requires your approval before it can be processed.</p>
      <div class="details">
        <h3>Order Details</h3>
        <p><strong>PO Number:</strong> ${po.poNumber}</p>
        <p><strong>Supplier:</strong> ${po.supplier?.name}</p>
        <p><strong>Total Amount:</strong> $${po.totalAmount.toFixed(2)}</p>
        <p><strong>Due Date:</strong> ${po.dueDate ? new Date(po.dueDate).toLocaleDateString() : 'Not specified'}</p>
        <p><strong>Notes:</strong> ${po.notes || 'None'}</p>
      </div>
      <a href="${process.env.APP_URL}/purchase-orders" class="button">View PO</a>
      <a href="${process.env.APP_URL}/purchase-orders/${po.id}/approve" class="button">Approve</a>
    </div>
    <div class="footer">
      <p>This is an automated notification from Supply Chain AI Control Assistant</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getDailyDigestTemplate(kpis: any[], lowStockItems: any[], lateOrders: any[]): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .section { margin: 20px 0; padding: 15px; background: white; border: 1px solid #e5e7eb; }
    .metric { display: inline-block; margin: 10px; padding: 10px; background: #eff6ff; border-radius: 5px; }
    .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .table th, .table td { padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .table th { background: #f3f4f6; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Daily Supply Chain Digest</h1>
      <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
    <div class="content">
      <div class="section">
        <h3>Key Performance Indicators</h3>
        ${kpis.map(kpi => `
          <div class="metric">
            <strong>${kpi.name}:</strong> ${kpi.value.toFixed(1)} (${kpi.status})
          </div>
        `).join('')}
      </div>
      <div class="section">
        <h3>⚠️ Low Stock Items (${lowStockItems.length})</h3>
        <table class="table">
          <thead><tr><th>SKU</th><th>Name</th><th>Qty</th></tr></thead>
          <tbody>
            ${lowStockItems.map(item => `
              <tr><td>${item.sku}</td><td>${item.name}</td><td>${item.quantity}</td></tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="section">
        <h3>📦 Late Orders (${lateOrders.length})</h3>
        <table class="table">
          <thead><tr><th>Order #</th><th>Supplier</th><th>Days Late</th></tr></thead>
          <tbody>
            ${lateOrders.map(order => `
              <tr><td>${order.orderNumber}</td><td>${order.supplier?.name}</td><td>${order.daysOverdue}</td></tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div class="footer">
      <p>This is an automated daily digest from Supply Chain AI Control Assistant</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getWeeklyDigestTemplate(kpis: any[], suppliers: any[]): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .section { margin: 20px 0; padding: 15px; background: white; border: 1px solid #e5e7eb; }
    .supplier { padding: 10px; margin: 5px 0; background: #f0fdf4; border-left: 4px solid #10b981; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📈 Weekly Supply Chain Report</h1>
      <p>Week of ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
    </div>
    <div class="content">
      <div class="section">
        <h3>Performance Summary</h3>
        ${kpis.length > 0 ? `
          <p>Average OTIF: ${(kpis.filter(k => k.name === 'OTIF').reduce((sum, k) => sum + k.value, 0) / kpis.filter(k => k.name === 'OTIF').length || 0).toFixed(1)}%</p>
          <p>Average DIO: ${(kpis.filter(k => k.name === 'DIO').reduce((sum, k) => sum + k.value, 0) / kpis.filter(k => k.name === 'DIO').length || 0).toFixed(1)} days</p>
        ` : '<p>No KPI data available for this week.</p>'}
      </div>
      <div class="section">
        <h3>🏆 Top Performing Suppliers</h3>
        ${suppliers.map((supplier, index) => `
          <div class="supplier">
            <strong>${index + 1}. ${supplier.name}</strong><br>
            Score: ${supplier.performanceScore.toFixed(0)}/100 | On-Time: ${supplier.onTimeRate.toFixed(1)}% | Quality: ${supplier.qualityRate.toFixed(1)}%
          </div>
        `).join('')}
      </div>
    </div>
    <div class="footer">
      <p>This is an automated weekly report from Supply Chain AI Control Assistant</p>
    </div>
  </div>
</body>
</html>
    `;
  }
}

export const notificationService = new NotificationService();
