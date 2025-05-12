import logger from './logger';

export const sendVerificationEmail = async (
  email: string,
  token: string
): Promise<void> => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
  
  // In a real implementation, this would send an actual email
  logger.info(
    `[Email Service] Verification email to: ${email}\nVerification URL: ${verificationUrl}`
  );
};

export const sendPasswordResetEmail = async (
  email: string,
  token: string
): Promise<void> => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
  
  // In a real implementation, this would send an actual email
  logger.info(
    `[Email Service] Password reset email to: ${email}\nReset URL: ${resetUrl}`
  );
};