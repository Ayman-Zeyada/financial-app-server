import { processRecurringTransactions } from '../controllers/transaction.controller';
import { checkBudgetAlerts } from '../controllers/budget.controller';
import { generateMonthlySummaryReports } from '../controllers/report.controller';
import logger from '../utils/logger';

class FinancialScheduler {
  private dailySchedule: NodeJS.Timeout | null = null;
  private monthlySchedule: NodeJS.Timeout | null = null;

  public start(): void {
    this.startDailyTasks();
    this.startMonthlyTasks();
    logger.info('Financial scheduler started');
  }

  public stop(): void {
    if (this.dailySchedule) {
      clearInterval(this.dailySchedule);
      this.dailySchedule = null;
    }

    if (this.monthlySchedule) {
      clearInterval(this.monthlySchedule);
      this.monthlySchedule = null;
    }

    logger.info('Financial scheduler stopped');
  }

  private startDailyTasks(): void {
    this.runDailyTasks();

    const calculateNextRun = () => {
      const now = new Date();
      const nextRun = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1, // tomorrow
        0, // hour
        1, // minute
        0, // second
      );
      return nextRun.getTime() - now.getTime();
    };

    const initialDelay = calculateNextRun();
    setTimeout(() => {
      this.runDailyTasks();

      this.dailySchedule = setInterval(
        () => {
          this.runDailyTasks();
        },
        24 * 60 * 60 * 1000,
      ); // 24 hours
    }, initialDelay);
  }

  private startMonthlyTasks(): void {
    const calculateNextMonthlyRun = () => {
      const now = new Date();
      const nextRun = new Date(
        now.getFullYear(),
        now.getMonth() + 1, // next month
        1, // 1st day
        0, // hour
        10, // minute
        0, // second
      );
      return nextRun.getTime() - now.getTime();
    };

    const initialDelay = calculateNextMonthlyRun();
    setTimeout(() => {
      this.runMonthlyTasks();

      this.monthlySchedule = setInterval(
        () => {
          const now = new Date();
          if (now.getDate() === 1) {
            this.runMonthlyTasks();
          }
        },
        24 * 60 * 60 * 1000,
      ); // 24 hours
    }, initialDelay);
  }

  private async runDailyTasks(): Promise<void> {
    try {
      logger.info('Running daily financial tasks');

      await processRecurringTransactions();
      logger.info('Processed recurring transactions');

      await checkBudgetAlerts();
      logger.info('Checked budget alerts');
    } catch (error) {
      logger.error('Error running daily financial tasks', error);
    }
  }

  private async runMonthlyTasks(): Promise<void> {
    try {
      logger.info('Running monthly financial tasks');

      await generateMonthlySummaryReports();
      logger.info('Generated monthly summary reports');
    } catch (error) {
      logger.error('Error running monthly financial tasks', error);
    }
  }

  public async triggerRecurringTransactions(): Promise<void> {
    try {
      await processRecurringTransactions();
      logger.info('Manually triggered recurring transactions');
    } catch (error) {
      logger.error('Error triggering recurring transactions', error);
      throw error;
    }
  }

  public async triggerBudgetAlerts(): Promise<void> {
    try {
      await checkBudgetAlerts();
      logger.info('Manually triggered budget alerts');
    } catch (error) {
      logger.error('Error triggering budget alerts', error);
      throw error;
    }
  }

  public async triggerMonthlySummaryReports(): Promise<void> {
    try {
      await generateMonthlySummaryReports();
      logger.info('Manually triggered monthly summary reports');
    } catch (error) {
      logger.error('Error triggering monthly summary reports', error);
      throw error;
    }
  }
}

export const financialScheduler = new FinancialScheduler();
