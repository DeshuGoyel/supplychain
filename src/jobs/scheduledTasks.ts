import cron from 'node-cron';
import { notificationService } from '../services/notificationService';
import { forecastService } from '../services/forecastService';
import { reportService } from '../services/reportService';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

class ScheduledTasks {
  constructor() {
    this.initializeJobs();
  }

  private initializeJobs() {
    console.log('Initializing scheduled tasks...');

    cron.schedule('0 8 * * *', async () => {
      await this.sendDailyDigests();
    });

    cron.schedule('0 8 * * 1', async () => {
      await this.sendWeeklyReports();
    });

    cron.schedule('0 2 * * *', async () => {
      await this.generateForecasts();
    });

    cron.schedule('0 3 * * *', async () => {
      await this.checkLowInventory();
    });

    cron.schedule('*/30 * * * *', async () => {
      await this.checkLateOrders();
    });

    cron.schedule('0 */6 * * *', async () => {
      await this.processScheduledReports();
    });

    cron.schedule('0 4 * * *', async () => {
      await this.generateReorderSuggestions();
    });

    console.log('Scheduled tasks initialized successfully');
  }

  private async sendDailyDigests() {
    console.log('Running daily digest job...');
    try {
      const companies = await prisma.company.findMany({
        where: { subscriptionStatus: 'active' },
      });

      for (const company of companies) {
        try {
          await notificationService.sendDailyDigest(company.id);
        } catch (error) {
          console.error(`Failed to send daily digest for company ${company.id}:`, error);
        }
      }
      console.log('Daily digest job completed');
    } catch (error) {
      console.error('Daily digest job error:', error);
    }
  }

  private async sendWeeklyReports() {
    console.log('Running weekly report job...');
    try {
      const companies = await prisma.company.findMany({
        where: { subscriptionStatus: 'active' },
      });

      for (const company of companies) {
        try {
          await notificationService.sendWeeklyDigest(company.id);
        } catch (error) {
          console.error(`Failed to send weekly report for company ${company.id}:`, error);
        }
      }
      console.log('Weekly report job completed');
    } catch (error) {
      console.error('Weekly report job error:', error);
    }
  }

  private async generateForecasts() {
    console.log('Running forecast generation job...');
    try {
      const companies = await prisma.company.findMany({
        where: { subscriptionStatus: 'active' },
      });

      for (const company of companies) {
        try {
          await forecastService.generateBulkForecasts(company.id, 12);
        } catch (error) {
          console.error(`Failed to generate forecasts for company ${company.id}:`, error);
        }
      }
      console.log('Forecast generation job completed');
    } catch (error) {
      console.error('Forecast generation job error:', error);
    }
  }

  private async checkLowInventory() {
    console.log('Running low inventory check job...');
    try {
      const companies = await prisma.company.findMany({
        where: { subscriptionStatus: 'active' },
      });

      for (const company of companies) {
        try {
          const lowStockItems = await prisma.inventory.findMany({
            where: {
              companyId: company.id,
              stockLevel: 'LOW',
            },
          });

          for (const item of lowStockItems) {
            await notificationService.sendLowInventoryAlert(item);
          }
        } catch (error) {
          console.error(`Failed to check low inventory for company ${company.id}:`, error);
        }
      }
      console.log('Low inventory check job completed');
    } catch (error) {
      console.error('Low inventory check job error:', error);
    }
  }

  private async checkLateOrders() {
    console.log('Running late order check job...');
    try {
      const now = new Date();
      const lateOrders = await prisma.order.findMany({
        where: {
          eta: { lt: now },
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
        include: { supplier: true },
      });

      for (const order of lateOrders) {
        const daysOverdue = Math.floor((now.getTime() - order.eta.getTime()) / (1000 * 60 * 60 * 24));

        if (daysOverdue > order.daysOverdue) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              daysOverdue,
              status: daysOverdue > 0 ? 'DELAYED' : order.status,
            },
          });

          if (daysOverdue > order.daysOverdue && daysOverdue > 0) {
            await notificationService.sendLateOrderAlert(order);
          }
        }
      }
      console.log('Late order check job completed');
    } catch (error) {
      console.error('Late order check job error:', error);
    }
  }

  private async processScheduledReports() {
    console.log('Running scheduled reports job...');
    try {
      const dueReports = await prisma.scheduledReport.findMany({
        where: {
          enabled: true,
          nextRunAt: { lte: new Date() },
        },
      });

      for (const scheduledReport of dueReports) {
        try {
          const { buffer, fileName } = await reportService.generateReport(
            scheduledReport.companyId,
            scheduledReport.reportType,
            'pdf',
            scheduledReport.filters,
            'system'
          );

          await reportService.sendReportByEmail(
            scheduledReport.email,
            scheduledReport.reportType,
            buffer,
            fileName
          );

          const now = new Date();
          let nextRunAt: Date;

          switch (scheduledReport.schedule) {
            case 'daily':
              nextRunAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
              break;
            case 'weekly':
              nextRunAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
              break;
            case 'monthly':
              nextRunAt = new Date(now);
              nextRunAt.setMonth(nextRunAt.getMonth() + 1);
              break;
            case 'quarterly':
              nextRunAt = new Date(now);
              nextRunAt.setMonth(nextRunAt.getMonth() + 3);
              break;
            default:
              nextRunAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          }

          await prisma.scheduledReport.update({
            where: { id: scheduledReport.id },
            data: {
              lastRunAt: now,
              nextRunAt,
            },
          });
        } catch (error) {
          console.error(`Failed to process scheduled report ${scheduledReport.id}:`, error);
        }
      }
      console.log('Scheduled reports job completed');
    } catch (error) {
      console.error('Scheduled reports job error:', error);
    }
  }

  private async generateReorderSuggestions() {
    console.log('Running reorder suggestions job...');
    try {
      const companies = await prisma.company.findMany({
        where: { subscriptionStatus: 'active' },
      });

      for (const company of companies) {
        try {
          await forecastService.generateReorderSuggestions(company.id);
        } catch (error) {
          console.error(`Failed to generate reorder suggestions for company ${company.id}:`, error);
        }
      }
      console.log('Reorder suggestions job completed');
    } catch (error) {
      console.error('Reorder suggestions job error:', error);
    }
  }
}

export const scheduledTasks = new ScheduledTasks();
