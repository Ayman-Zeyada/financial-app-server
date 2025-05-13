import logger from './logger';

type NotificationType =
  | 'verify_email'
  | 'password_reset'
  | 'goal_achieved'
  | 'budget_exceeded'
  | 'monthly_summary';

interface EmailData {
  token?: string;
  amount?: number;
  date?: string;
  goalName?: string;
  budgetName?: string;
  month?: string;
  year?: string;
  summary?: any;
  [key: string]: any;
}

export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;

  // In a real implementation, this would send an actual email
  logger.info(
    `[Email Service] Verification email to: ${email}\nVerification URL: ${verificationUrl}`,
  );
};

export const sendPasswordResetEmail = async (email: string, token: string): Promise<void> => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

  // In a real implementation, this would send an actual email
  logger.info(`[Email Service] Password reset email to: ${email}\nReset URL: ${resetUrl}`);
};

export const sendNotificationEmail = async (
  email: string,
  type: NotificationType,
  data: EmailData,
): Promise<void> => {
  let subject = '';
  let content = '';

  switch (type) {
    case 'verify_email':
      subject = 'Verify Your Email Address';
      content = `Please verify your email by clicking this link: ${process.env.CLIENT_URL}/verify-email/${data.token}`;
      break;

    case 'password_reset':
      subject = 'Reset Your Password';
      content = `Reset your password by clicking this link: ${process.env.CLIENT_URL}/reset-password/${data.token}`;
      break;

    case 'goal_achieved':
      subject = 'Congratulations! Financial Goal Achieved';
      content = `You've reached your goal: ${data.goalName}. Current amount: $${data.amount}`;
      break;

    case 'budget_exceeded':
      subject = 'Budget Alert: Spending Limit Exceeded';
      content = `Your budget "${data.budgetName}" has been exceeded by $${data.amount} on ${data.date}`;
      break;

    case 'monthly_summary':
      subject = `Your Financial Summary for ${data.month} ${data.year}`;
      content = `Here's your monthly summary:\n${JSON.stringify(data.summary, null, 2)}`;
      break;

    default:
      subject = 'Financial App Notification';
      content = 'You have a new notification from your financial app.';
  }

  logger.info(`
    [Email Service] 
    To: ${email}
    Subject: ${subject}
    Content: ${content}
  `);

  // In production, this would actually send the email
  // return emailService.send({
  //   to: email,
  //   subject,
  //   html: content,
  // });
};

export const sendMonthlySummary = async (
  userId: number,
  email: string,
  month: string,
  year: string,
  data: any,
): Promise<void> => {
  await sendNotificationEmail(email, 'monthly_summary', {
    month,
    year,
    summary: data,
  });
  logger.info(`Sent monthly summary to user ${userId} for ${month} ${year}`);
};

export const sendBudgetAlert = async (
  userId: number,
  email: string,
  budgetName: string,
  amount: number,
): Promise<void> => {
  const date = new Date().toLocaleDateString();
  await sendNotificationEmail(email, 'budget_exceeded', {
    budgetName,
    amount,
    date,
  });
  logger.info(`Sent budget alert to user ${userId} for budget ${budgetName}`);
};

export const sendGoalAchievedNotification = async (
  userId: number,
  email: string,
  goalName: string,
  amount: number,
): Promise<void> => {
  await sendNotificationEmail(email, 'goal_achieved', {
    goalName,
    amount,
  });
  logger.info(`Sent goal achievement notification to user ${userId} for goal ${goalName}`);
};
