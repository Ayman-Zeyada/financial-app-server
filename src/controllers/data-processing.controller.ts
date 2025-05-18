import { Request, Response, NextFunction } from 'express';
import { dataProcessingService } from '../services/data-processing.service';
import { ApiError } from '../middlewares/errorHandler';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger';

const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    const dir = path.join(__dirname, '../../uploads/imports');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req: any, file: any, cb: any) => {
    const userId = req.user?.userId || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `import_${userId}_${timestamp}${ext}`);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype === 'text/csv' || file.mimetype === 'application/json') {
    cb(null, true);
  } else {
    cb(new Error('Only CSV and JSON files are allowed!'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

export const importTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      const error = new Error('Not authenticated') as ApiError;
      error.statusCode = 401;
      throw error;
    }

    if (!req.file) {
      const error = new Error('No file uploaded') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    const filePath = req.file.path;
    const fileExt = path.extname(filePath).toLowerCase();

    let result;
    if (fileExt === '.csv') {
      result = await dataProcessingService.importTransactionsFromCSV(req.user.userId, filePath);
    } else if (fileExt === '.json') {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      result = await dataProcessingService.importFromJSON(req.user.userId, data, 'transactions');
    } else {
      const error = new Error('Unsupported file format') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    res.status(200).json({
      status: 'success',
      message: result.message,
      data: {
        imported: result.imported,
        errors: result.errors,
      },
    });
  } catch (error) {
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        logger.error(`Failed to delete file ${req.file.path}:`, e);
      }
    }
    next(error);
  }
};

export const importCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      const error = new Error('Not authenticated') as ApiError;
      error.statusCode = 401;
      throw error;
    }

    if (!req.file) {
      const error = new Error('No file uploaded') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    const filePath = req.file.path;
    const fileExt = path.extname(filePath).toLowerCase();

    let result;
    if (fileExt === '.csv') {
      result = await dataProcessingService.importCategoriesFromCSV(req.user.userId, filePath);
    } else if (fileExt === '.json') {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      result = await dataProcessingService.importFromJSON(req.user.userId, data, 'categories');
    } else {
      const error = new Error('Unsupported file format') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    res.status(200).json({
      status: 'success',
      message: result.message,
      data: {
        imported: result.imported,
        errors: result.errors,
      },
    });
  } catch (error) {
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        logger.error(`Failed to delete file ${req.file.path}:`, e);
      }
    }
    next(error);
  }
};

export const importBudgets = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      const error = new Error('Not authenticated') as ApiError;
      error.statusCode = 401;
      throw error;
    }

    if (!req.file) {
      const error = new Error('No file uploaded') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    const filePath = req.file.path;
    const fileExt = path.extname(filePath).toLowerCase();

    let result;
    if (fileExt === '.csv') {
      result = await dataProcessingService.importBudgetsFromCSV(req.user.userId, filePath);
    } else if (fileExt === '.json') {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      result = await dataProcessingService.importFromJSON(req.user.userId, data, 'budgets');
    } else {
      const error = new Error('Unsupported file format') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    res.status(200).json({
      status: 'success',
      message: result.message,
      data: {
        imported: result.imported,
        errors: result.errors,
      },
    });
  } catch (error) {
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        logger.error(`Failed to delete file ${req.file.path}:`, e);
      }
    }
    next(error);
  }
};

export const importFinancialGoals = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      const error = new Error('Not authenticated') as ApiError;
      error.statusCode = 401;
      throw error;
    }

    if (!req.file) {
      const error = new Error('No file uploaded') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    const filePath = req.file.path;
    const fileExt = path.extname(filePath).toLowerCase();

    let result;
    if (fileExt === '.csv') {
      result = await dataProcessingService.importFinancialGoalsFromCSV(req.user.userId, filePath);
    } else if (fileExt === '.json') {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      result = await dataProcessingService.importFromJSON(req.user.userId, data, 'goals');
    } else {
      const error = new Error('Unsupported file format') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    res.status(200).json({
      status: 'success',
      message: result.message,
      data: {
        imported: result.imported,
        errors: result.errors,
      },
    });
  } catch (error) {
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        logger.error(`Failed to delete file ${req.file.path}:`, e);
      }
    }
    next(error);
  }
};

export const exportTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      const error = new Error('Not authenticated') as ApiError;
      error.statusCode = 401;
      throw error;
    }

    const { startDate, endDate, type, categoryId, format = 'csv' } = req.query;

    const filters: any = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (type) filters.type = type;
    if (categoryId) filters.categoryId = categoryId;

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const fileName = `transactions_${req.user.userId}_${timestamp}.${format}`;
    const filePath = path.join(__dirname, '../../exports', fileName);

    const result = await dataProcessingService.exportTransactionsToCSV(
      req.user.userId,
      filters,
      filePath
    );

    if (req.query.download === 'true') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      res.send(result.data);
    } else {
      res.status(200).json({
        status: 'success',
        message: `Exported transactions to ${fileName}`,
        data: {
          filePath: fileName,
          downloadUrl: `/api/data/download/${fileName}`,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

export const exportCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      const error = new Error('Not authenticated') as ApiError;
      error.statusCode = 401;
      throw error;
    }

    const { format = 'csv' } = req.query;

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const fileName = `categories_${req.user.userId}_${timestamp}.${format}`;
    const filePath = path.join(__dirname, '../../exports', fileName);

    const result = await dataProcessingService.exportCategoriesToCSV(req.user.userId, filePath);

    if (req.query.download === 'true') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      res.send(result.data);
    } else {
      res.status(200).json({
        status: 'success',
        message: `Exported categories to ${fileName}`,
        data: {
          filePath: fileName,
          downloadUrl: `/api/data/download/${fileName}`,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

export const exportBudgets = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      const error = new Error('Not authenticated') as ApiError;
      error.statusCode = 401;
      throw error;
    }

    const { format = 'csv' } = req.query;

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const fileName = `budgets_${req.user.userId}_${timestamp}.${format}`;
    const filePath = path.join(__dirname, '../../exports', fileName);

    const result = await dataProcessingService.exportBudgetsToCSV(req.user.userId, filePath);

    if (req.query.download === 'true') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      res.send(result.data);
    } else {
      res.status(200).json({
        status: 'success',
        message: `Exported budgets to ${fileName}`,
        data: {
          filePath: fileName,
          downloadUrl: `/api/data/download/${fileName}`,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

export const exportFinancialGoals = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      const error = new Error('Not authenticated') as ApiError;
      error.statusCode = 401;
      throw error;
    }

    const { format = 'csv' } = req.query;

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const fileName = `goals_${req.user.userId}_${timestamp}.${format}`;
    const filePath = path.join(__dirname, '../../exports', fileName);

    const result = await dataProcessingService.exportFinancialGoalsToCSV(req.user.userId, filePath);

    if (req.query.download === 'true') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      res.send(result.data);
    } else {
      res.status(200).json({
        status: 'success',
        message: `Exported financial goals to ${fileName}`,
        data: {
          filePath: fileName,
          downloadUrl: `/api/data/download/${fileName}`,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

export const downloadFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      const error = new Error('Not authenticated') as ApiError;
      error.statusCode = 401;
      throw error;
    }

    const { filename } = req.params;
    
    const userId = req.user.userId;
    if (!filename.includes(`_${userId}_`)) {
      const error = new Error('Unauthorized access to file') as ApiError;
      error.statusCode = 403;
      throw error;
    }

    const filePath = path.join(__dirname, '../../exports', filename);

    if (!fs.existsSync(filePath)) {
      const error = new Error('File not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    const fileExt = path.extname(filePath).toLowerCase();
    const contentType = fileExt === '.csv' ? 'text/csv' : 'application/json';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

export const validateImportFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      const error = new Error('Not authenticated') as ApiError;
      error.statusCode = 401;
      throw error;
    }

    if (!req.file) {
      const error = new Error('No file uploaded') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    const filePath = req.file.path;
    const fileExt = path.extname(filePath).toLowerCase();
    const dataType = req.body.dataType || 'transactions';

    let validationResult;
    if (fileExt === '.csv') {
      const csvData = fs.readFileSync(filePath, 'utf8');
      
      switch(dataType) {
        case 'transactions':
          validationResult = await dataProcessingService.validateTransactionCSV(csvData);
          break;
        case 'categories':
          validationResult = await dataProcessingService.validateCategoryCSV(csvData);
          break;
        case 'budgets':
          validationResult = await dataProcessingService.validateBudgetCSV(csvData);
          break;
        case 'goals':
          validationResult = await dataProcessingService.validateGoalCSV(csvData);
          break;
        default:
          validationResult = { 
            valid: false, 
            errors: ['Invalid data type. Must be one of: transactions, categories, budgets, goals'] 
          };
      }
    } else if (fileExt === '.json') {
      const jsonData = fs.readFileSync(filePath, 'utf8');
      validationResult = dataProcessingService.validateJSONImport(
        jsonData,
        dataType as 'transactions' | 'categories' | 'budgets' | 'goals'
      );
    } else {
      const error = new Error('Unsupported file format') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    res.status(200).json({
      status: 'success',
      data: {
        valid: validationResult.valid,
        errors: validationResult.errors,
      },
    });
  } catch (error) {
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        logger.error(`Failed to delete file ${req.file.path}:`, e);
      }
    }
    next(error);
  }
};