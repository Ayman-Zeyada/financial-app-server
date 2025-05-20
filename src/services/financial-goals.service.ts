import { FinancialGoal, Transaction, User } from '../models';
import { Op } from 'sequelize';
import { sendGoalAchievedNotification } from '../utils/email.utils';
import logger from '../utils/logger';
import webhookService from '../services/webhook.service';
import socketService from '../services/socket.service';
import { WebhookEvent } from '../models/webhook.model';

class FinancialGoalsService {
  public async calculateGoalProgress(goalId: number): Promise<{
    goal: FinancialGoal;
    progress: {
      currentAmount: number;
      targetAmount: number;
      percentage: number;
      remaining: number;
      isAchieved: boolean;
      estimatedCompletion?: Date;
    };
  }> {
    const goal = await FinancialGoal.findByPk(goalId);
    if (!goal) {
      throw new Error('Financial goal not found');
    }

    const currentAmount = Number(goal.currentAmount);
    const targetAmount = Number(goal.targetAmount);

    const percentage = (currentAmount / targetAmount) * 100;

    const remaining = Math.max(targetAmount - currentAmount, 0);

    const isAchieved = currentAmount >= targetAmount;

    let estimatedCompletion: Date | undefined;

    if (!isAchieved && percentage > 0) {
      try {
        const userId = goal.userId;
        const now = new Date();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const transactions = await Transaction.findAll({
          where: {
            userId,
            type: 'EXPENSE',
            description: {
              [Op.like]: `%${goal.name}%`,
            },
            date: {
              [Op.between]: [threeMonthsAgo, now],
            },
          },
        });

        if (transactions.length > 0) {
          const totalContribution = transactions.reduce(
            (sum, transaction) => sum + Number(transaction.amount),
            0,
          );

          const monthlyAverage = totalContribution / 3;

          if (monthlyAverage > 0) {
            const monthsNeeded = remaining / monthlyAverage;

            estimatedCompletion = new Date();
            estimatedCompletion.setMonth(estimatedCompletion.getMonth() + Math.ceil(monthsNeeded));
          }
        }
      } catch (error) {
        logger.error('Error calculating estimated completion date:', error);
      }
    }

    return {
      goal,
      progress: {
        currentAmount,
        targetAmount,
        percentage,
        remaining,
        isAchieved,
        estimatedCompletion,
      },
    };
  }

  public async updateGoalProgress(
    goalId: number,
    amount: number,
  ): Promise<{
    goal: FinancialGoal;
    progress: any;
    wasAchieved: boolean;
  }> {
    const goal = await FinancialGoal.findByPk(goalId);
    if (!goal) {
      throw new Error('Financial goal not found');
    }

    const wasAchievedBefore = Number(goal.currentAmount) >= Number(goal.targetAmount);

    goal.currentAmount = Number(goal.currentAmount) + amount;
    await goal.save();

    const isAchievedNow = Number(goal.currentAmount) >= Number(goal.targetAmount);
    const wasAchieved = !wasAchievedBefore && isAchievedNow;

    if (wasAchieved) {
      try {
        const user = await User.findByPk(goal.userId);
        if (user && user.email) {
          await sendGoalAchievedNotification(
            user.id,
            user.email,
            goal.name,
            Number(goal.currentAmount),
          );
        }

        webhookService
          .triggerWebhook(WebhookEvent.GOAL_ACHIEVED, goal.userId, {
            goalId: goal.id,
            goalName: goal.name,
            targetAmount: Number(goal.targetAmount),
            currentAmount: Number(goal.currentAmount),
            targetDate: goal.targetDate,
            category: goal.category,
          })
          .catch((err) => logger.error(`Error triggering webhook: ${err}`));

        if (socketService.isUserConnected(goal.userId)) {
          socketService.emitGoalAchieved(goal.userId, {
            goalId: goal.id,
            goalName: goal.name,
            targetAmount: Number(goal.targetAmount),
            currentAmount: Number(goal.currentAmount),
            targetDate: goal.targetDate,
            category: goal.category,
          });
        }
      } catch (error) {
        logger.error('Error sending goal achievement notification:', error);
      }
    }

    const progress = await this.calculateGoalProgress(goalId);

    return {
      goal,
      progress: progress.progress,
      wasAchieved,
    };
  }

  public async checkGoalsProgress(userId: number): Promise<void> {
    try {
      const goals = await FinancialGoal.findAll({
        where: {
          userId,

          targetDate: {
            [Op.gte]: new Date(),
          },
        },
      });

      for (const goal of goals) {
        const progress = await this.calculateGoalProgress(goal.id);

        if (progress.progress.isAchieved && !goal.notificationSent) {
          goal.notificationSent = true;
          await goal.save();

          const user = await User.findByPk(userId);
          if (user && user.email) {
            await sendGoalAchievedNotification(
              userId,
              user.email,
              goal.name,
              Number(goal.currentAmount),
            );
          }
        }
      }
    } catch (error) {
      logger.error(`Error checking goals progress for user ${userId}:`, error);
    }
  }
}

export const financialGoalsService = new FinancialGoalsService();
