import { Transaction, Category, User, Budget, FinancialGoal } from '../models';
import { Op } from 'sequelize';
import { Parser } from 'json2csv';
import fs from 'fs';
import path from 'path';
import csv from 'csvtojson';
import logger from '../utils/logger';
import { CategoryType } from '../models/category.model';
import { TransactionType } from '../models/transaction.model';

export interface ImportResult {
  success: boolean;
  message: string;
  imported: number;
  errors: string[];
  data?: any[];
}

class DataProcessingService {
  public async exportTransactionsToCSV(
    userId: number,
    filters: any = {},
    filePath?: string
  ): Promise<{ filePath: string; data: string }> {
    try {
      const where: any = {
        userId,
      };

      if (filters.startDate && filters.endDate) {
        where.date = {
          [Op.between]: [new Date(filters.startDate), new Date(filters.endDate)],
        };
      } else if (filters.startDate) {
        where.date = {
          [Op.gte]: new Date(filters.startDate),
        };
      } else if (filters.endDate) {
        where.date = {
          [Op.lte]: new Date(filters.endDate),
        };
      }

      if (filters.type) {
        where.type = filters.type;
      }

      if (filters.categoryId) {
        where.categoryId = filters.categoryId;
      }

      const transactions = await Transaction.findAll({
        where,
        include: [
          {
            model: Category,
            attributes: ['id', 'name', 'type'],
          },
        ],
        order: [['date', 'DESC']],
      });

      const formattedData = transactions.map((transaction: any) => {
        return {
          id: transaction.id,
          amount: transaction.amount,
          description: transaction.description,
          date: transaction.date.toISOString().split('T')[0],
          type: transaction.type,
          category: transaction.Category ? transaction.Category.name : '',
          categoryId: transaction.categoryId,
          recurring: transaction.recurring ? 'Yes' : 'No',
          recurringInterval: transaction.recurringInterval || '',
        };
      });

      const fields = [
        'id',
        'amount',
        'description',
        'date',
        'type',
        'category',
        'categoryId',
        'recurring',
        'recurringInterval',
      ];

      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(formattedData);

      if (filePath) {
        const directory = path.dirname(filePath);
        if (!fs.existsSync(directory)) {
          fs.mkdirSync(directory, { recursive: true });
        }
        fs.writeFileSync(filePath, csv);
        logger.info(`Exported ${formattedData.length} transactions to ${filePath}`);
      } else {
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        filePath = path.join(
          __dirname,
          '../../exports',
          `transactions_${userId}_${timestamp}.csv`
        );
        
        const directory = path.dirname(filePath);
        if (!fs.existsSync(directory)) {
          fs.mkdirSync(directory, { recursive: true });
        }
        
        fs.writeFileSync(filePath, csv);
        logger.info(`Exported ${formattedData.length} transactions to ${filePath}`);
      }

      return { filePath, data: csv };
    } catch (error) {
      logger.error('Error exporting transactions to CSV:', error);
      throw error;
    }
  }

  public async exportCategoriesToCSV(
    userId: number,
    filePath?: string
  ): Promise<{ filePath: string; data: string }> {
    try {
      const categories = await Category.findAll({
        where: { userId },
        order: [['name', 'ASC']],
      });

      const formattedData = categories.map((category: any) => {
        return {
          id: category.id,
          name: category.name,
          description: category.description || '',
          type: category.type,
          color: category.color,
          icon: category.icon || '',
        };
      });

      const fields = ['id', 'name', 'description', 'type', 'color', 'icon'];
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(formattedData);

      if (filePath) {
        const directory = path.dirname(filePath);
        if (!fs.existsSync(directory)) {
          fs.mkdirSync(directory, { recursive: true });
        }
        fs.writeFileSync(filePath, csv);
        logger.info(`Exported ${formattedData.length} categories to ${filePath}`);
      } else {
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        filePath = path.join(
          __dirname,
          '../../exports',
          `categories_${userId}_${timestamp}.csv`
        );
        
        const directory = path.dirname(filePath);
        if (!fs.existsSync(directory)) {
          fs.mkdirSync(directory, { recursive: true });
        }
        
        fs.writeFileSync(filePath, csv);
        logger.info(`Exported ${formattedData.length} categories to ${filePath}`);
      }

      return { filePath, data: csv };
    } catch (error) {
      logger.error('Error exporting categories to CSV:', error);
      throw error;
    }
  }

  public async exportBudgetsToCSV(
    userId: number,
    filePath?: string
  ): Promise<{ filePath: string; data: string }> {
    try {
      const budgets = await Budget.findAll({
        where: { userId },
        include: [
          {
            model: Category,
            attributes: ['id', 'name'],
            required: false,
          },
        ],
        order: [['name', 'ASC']],
      });

      const formattedData = budgets.map((budget: any) => {
        return {
          id: budget.id,
          name: budget.name,
          amount: budget.amount,
          period: budget.period,
          startDate: budget.startDate.toISOString().split('T')[0],
          endDate: budget.endDate ? budget.endDate.toISOString().split('T')[0] : '',
          category: budget.Category ? budget.Category.name : '',
          categoryId: budget.categoryId || '',
        };
      });

      const fields = [
        'id',
        'name',
        'amount',
        'period',
        'startDate',
        'endDate',
        'category',
        'categoryId',
      ];
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(formattedData);

      if (filePath) {
        const directory = path.dirname(filePath);
        if (!fs.existsSync(directory)) {
          fs.mkdirSync(directory, { recursive: true });
        }
        fs.writeFileSync(filePath, csv);
        logger.info(`Exported ${formattedData.length} budgets to ${filePath}`);
      } else {
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        filePath = path.join(
          __dirname,
          '../../exports',
          `budgets_${userId}_${timestamp}.csv`
        );
        
        const directory = path.dirname(filePath);
        if (!fs.existsSync(directory)) {
          fs.mkdirSync(directory, { recursive: true });
        }
        
        fs.writeFileSync(filePath, csv);
        logger.info(`Exported ${formattedData.length} budgets to ${filePath}`);
      }

      return { filePath, data: csv };
    } catch (error) {
      logger.error('Error exporting budgets to CSV:', error);
      throw error;
    }
  }

  public async exportFinancialGoalsToCSV(
    userId: number,
    filePath?: string
  ): Promise<{ filePath: string; data: string }> {
    try {
      const goals = await FinancialGoal.findAll({
        where: { userId },
        order: [['targetDate', 'ASC']],
      });

      const formattedData = goals.map((goal: any) => {
        return {
          id: goal.id,
          name: goal.name,
          targetAmount: goal.targetAmount,
          currentAmount: goal.currentAmount,
          targetDate: goal.targetDate.toISOString().split('T')[0],
          description: goal.description || '',
          category: goal.category || '',
        };
      });

      const fields = [
        'id',
        'name',
        'targetAmount',
        'currentAmount',
        'targetDate',
        'description',
        'category',
      ];
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(formattedData);

      if (filePath) {
        const directory = path.dirname(filePath);
        if (!fs.existsSync(directory)) {
          fs.mkdirSync(directory, { recursive: true });
        }
        fs.writeFileSync(filePath, csv);
        logger.info(`Exported ${formattedData.length} financial goals to ${filePath}`);
      } else {
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        filePath = path.join(
          __dirname,
          '../../exports',
          `goals_${userId}_${timestamp}.csv`
        );
        
        const directory = path.dirname(filePath);
        if (!fs.existsSync(directory)) {
          fs.mkdirSync(directory, { recursive: true });
        }
        
        fs.writeFileSync(filePath, csv);
        logger.info(`Exported ${formattedData.length} financial goals to ${filePath}`);
      }

      return { filePath, data: csv };
    } catch (error) {
      logger.error('Error exporting financial goals to CSV:', error);
      throw error;
    }
  }

  public async importTransactionsFromCSV(userId: number, filePath: string): Promise<ImportResult> {
    try {
      const result: ImportResult = {
        success: false,
        message: '',
        imported: 0,
        errors: [],
        data: [],
      };

      const user = await User.findByPk(userId);
      if (!user) {
        result.message = 'User not found';
        return result;
      }

      if (!fs.existsSync(filePath)) {
        result.message = 'File not found';
        return result;
      }

      const jsonArray = await csv().fromFile(filePath);
      
      const categories = await Category.findAll({
        where: { userId },
        attributes: ['id', 'name', 'type'],
      });
      
      const categoryMap = categories.reduce((acc: Record<string, any>, category: any) => {
        acc[category.id] = category;
        acc[category.name.toLowerCase()] = category;
        return acc;
      }, {});

      const transactionsToCreate = [];
      const validTransactionTypes = Object.values(TransactionType);

      for (let i = 0; i < jsonArray.length; i++) {
        const row = jsonArray[i];
        try {
          if (!row.amount || isNaN(parseFloat(row.amount))) {
            result.errors.push(`Row ${i + 1}: Invalid amount`);
            continue;
          }

          if (!row.description) {
            result.errors.push(`Row ${i + 1}: Missing description`);
            continue;
          }

          if (!row.date || isNaN(new Date(row.date).getTime())) {
            result.errors.push(`Row ${i + 1}: Invalid date`);
            continue;
          }

          if (!row.type || !validTransactionTypes.includes(row.type)) {
            result.errors.push(`Row ${i + 1}: Invalid transaction type`);
            continue;
          }

          let categoryId;
          if (row.categoryId && categoryMap[row.categoryId]) {
            categoryId = parseInt(row.categoryId);
          } else if (row.category && categoryMap[row.category.toLowerCase()]) {
            categoryId = categoryMap[row.category.toLowerCase()].id;
          } else {
            result.errors.push(`Row ${i + 1}: Category not found`);
            continue;
          }

          if (categoryMap[categoryId] && categoryMap[categoryId].type !== row.type) {
            result.errors.push(
              `Row ${i + 1}: Transaction type (${row.type}) doesn't match category type (${categoryMap[categoryId].type})`
            );
            continue;
          }

          let recurring = false;
          let recurringInterval: string | undefined = undefined;
          if (typeof row.recurring === 'string') {
            recurring = row.recurring.toLowerCase() === 'yes' || row.recurring === 'true' || row.recurring === '1';
          } else if (typeof row.recurring === 'boolean') {
            recurring = row.recurring;
          }
          
          if (row.recurringInterval) {
            recurringInterval = row.recurringInterval;
          }

          transactionsToCreate.push({
            userId,
            amount: parseFloat(row.amount),
            description: row.description,
            date: new Date(row.date),
            type: row.type,
            categoryId,
            recurring,
            recurringInterval,
          });
        } catch (error) {
          result.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : error}`);
        }
      }

      if (transactionsToCreate.length > 0) {
        const imported = await Transaction.bulkCreate(transactionsToCreate);
        result.imported = imported.length;
        result.data = imported;
        result.success = true;
        result.message = `Successfully imported ${imported.length} transactions`;
      } else {
        result.message = 'No valid transactions found to import';
      }

      return result;
    } catch (error) {
      logger.error('Error importing transactions from CSV:', error);
      throw error;
    }
  }

  public async importCategoriesFromCSV(userId: number, filePath: string): Promise<ImportResult> {
    try {
      const result: ImportResult = {
        success: false,
        message: '',
        imported: 0,
        errors: [],
        data: [],
      };

      const user = await User.findByPk(userId);
      if (!user) {
        result.message = 'User not found';
        return result;
      }

      if (!fs.existsSync(filePath)) {
        result.message = 'File not found';
        return result;
      }

      const jsonArray = await csv().fromFile(filePath);
      
      const existingCategories = await Category.findAll({
        where: { userId },
        attributes: ['name'],
      });
      
      const existingCategoryNames = new Set(
        existingCategories.map((cat: any) => cat.name.toLowerCase())
      );

      const categoriesToCreate = [];
      const validCategoryTypes = Object.values(CategoryType);

      for (let i = 0; i < jsonArray.length; i++) {
        const row = jsonArray[i];
        try {
          if (!row.name) {
            result.errors.push(`Row ${i + 1}: Missing name`);
            continue;
          }

          if (!row.type || !validCategoryTypes.includes(row.type)) {
            result.errors.push(`Row ${i + 1}: Invalid category type`);
            continue;
          }

          if (existingCategoryNames.has(row.name.toLowerCase())) {
            result.errors.push(`Row ${i + 1}: Category with name "${row.name}" already exists`);
            continue;
          }

          if (row.color && !/^#[0-9A-F]{6}$/i.test(row.color)) {
            result.errors.push(`Row ${i + 1}: Invalid color format. Must be a valid hex color (e.g., #RRGGBB)`);
            continue;
          }

          categoriesToCreate.push({
            userId,
            name: row.name,
            description: row.description || '',
            type: row.type,
            color: row.color || '#000000',
            icon: row.icon || null,
          });

          existingCategoryNames.add(row.name.toLowerCase());
        } catch (error) {
          result.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : error}`);
        }
      }

      if (categoriesToCreate.length > 0) {
        const imported = await Category.bulkCreate(categoriesToCreate);
        result.imported = imported.length;
        result.data = imported;
        result.success = true;
        result.message = `Successfully imported ${imported.length} categories`;
      } else {
        result.message = 'No valid categories found to import';
      }

      return result;
    } catch (error) {
      logger.error('Error importing categories from CSV:', error);
      throw error;
    }
  }

  public async importBudgetsFromCSV(userId: number, filePath: string): Promise<ImportResult> {
    try {
      const result: ImportResult = {
        success: false,
        message: '',
        imported: 0,
        errors: [],
        data: [],
      };

      const user = await User.findByPk(userId);
      if (!user) {
        result.message = 'User not found';
        return result;
      }

      if (!fs.existsSync(filePath)) {
        result.message = 'File not found';
        return result;
      }

      const jsonArray = await csv().fromFile(filePath);
      
      const categories = await Category.findAll({
        where: { userId },
        attributes: ['id', 'name', 'type'],
      });
      
      const categoryMap = categories.reduce((acc: Record<string, any>, category: any) => {
        acc[category.id] = category;
        acc[category.name.toLowerCase()] = category;
        return acc;
      }, {});

      const budgetsToCreate = [];
      const validPeriods = ['daily', 'weekly', 'monthly', 'yearly'];

      for (let i = 0; i < jsonArray.length; i++) {
        const row = jsonArray[i];
        try {
          if (!row.name) {
            result.errors.push(`Row ${i + 1}: Missing name`);
            continue;
          }

          if (!row.amount || isNaN(parseFloat(row.amount))) {
            result.errors.push(`Row ${i + 1}: Invalid amount`);
            continue;
          }

          if (!row.period || !validPeriods.includes(row.period)) {
            result.errors.push(`Row ${i + 1}: Invalid period`);
            continue;
          }

          if (!row.startDate || isNaN(new Date(row.startDate).getTime())) {
            result.errors.push(`Row ${i + 1}: Invalid start date`);
            continue;
          }

          let endDate;
          if (row.endDate) {
            if (isNaN(new Date(row.endDate).getTime())) {
              result.errors.push(`Row ${i + 1}: Invalid end date`);
              continue;
            }
            endDate = new Date(row.endDate);
            
            if (endDate <= new Date(row.startDate)) {
              result.errors.push(`Row ${i + 1}: End date must be after start date`);
              continue;
            }
          }

          let categoryId;
          if (row.categoryId && categoryMap[row.categoryId]) {
            categoryId = parseInt(row.categoryId);
          } else if (row.category && categoryMap[row.category.toLowerCase()]) {
            categoryId = categoryMap[row.category.toLowerCase()].id;
          }

          if (categoryId && categoryMap[categoryId] && categoryMap[categoryId].type !== 'EXPENSE') {
            result.errors.push(
              `Row ${i + 1}: Budgets can only be created for expense categories`
            );
            continue;
          }

          budgetsToCreate.push({
            userId,
            name: row.name,
            amount: parseFloat(row.amount),
            period: row.period,
            startDate: new Date(row.startDate),
            endDate: endDate,
            categoryId: categoryId,
          });
        } catch (error) {
          result.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : error}`);
        }
      }

      if (budgetsToCreate.length > 0) {
        const imported = await Budget.bulkCreate(budgetsToCreate);
        result.imported = imported.length;
        result.data = imported;
        result.success = true;
        result.message = `Successfully imported ${imported.length} budgets`;
      } else {
        result.message = 'No valid budgets found to import';
      }

      return result;
    } catch (error) {
      logger.error('Error importing budgets from CSV:', error);
      throw error;
    }
  }

  public async importFinancialGoalsFromCSV(userId: number, filePath: string): Promise<ImportResult> {
    try {
      const result: ImportResult = {
        success: false,
        message: '',
        imported: 0,
        errors: [],
        data: [],
      };

      const user = await User.findByPk(userId);
      if (!user) {
        result.message = 'User not found';
        return result;
      }

      if (!fs.existsSync(filePath)) {
        result.message = 'File not found';
        return result;
      }

      const jsonArray = await csv().fromFile(filePath);
      
      const goalsToCreate = [];

      for (let i = 0; i < jsonArray.length; i++) {
        const row = jsonArray[i];
        try {
          if (!row.name) {
            result.errors.push(`Row ${i + 1}: Missing name`);
            continue;
          }

          if (!row.targetAmount || isNaN(parseFloat(row.targetAmount))) {
            result.errors.push(`Row ${i + 1}: Invalid target amount`);
            continue;
          }

          let currentAmount = 0;
          if (row.currentAmount) {
            if (isNaN(parseFloat(row.currentAmount))) {
              result.errors.push(`Row ${i + 1}: Invalid current amount`);
              continue;
            }
            currentAmount = parseFloat(row.currentAmount);
            
            if (currentAmount < 0) {
              result.errors.push(`Row ${i + 1}: Current amount cannot be negative`);
              continue;
            }
          }

          if (!row.targetDate || isNaN(new Date(row.targetDate).getTime())) {
            result.errors.push(`Row ${i + 1}: Invalid target date`);
            continue;
          }

          const targetDate = new Date(row.targetDate);
          if (targetDate <= new Date()) {
            result.errors.push(`Row ${i + 1}: Target date must be in the future`);
            continue;
          }

          goalsToCreate.push({
            userId,
            name: row.name,
            targetAmount: parseFloat(row.targetAmount),
            currentAmount: currentAmount,
            targetDate: targetDate,
            description: row.description || '',
            category: row.category || null,
            notificationSent: false,
          });
        } catch (error) {
          result.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : error}`);
        }
      }

      if (goalsToCreate.length > 0) {
        const imported = await FinancialGoal.bulkCreate(goalsToCreate);
        result.imported = imported.length;
        result.data = imported;
        result.success = true;
        result.message = `Successfully imported ${imported.length} financial goals`;
      } else {
        result.message = 'No valid financial goals found to import';
      }

      return result;
    } catch (error) {
      logger.error('Error importing financial goals from CSV:', error);
      throw error;
    }
  }

  public async validateTransactionCSV(csvString: string): Promise<{
    valid: boolean;
    errors: string[];
    data?: any[];
  }> {
    try {
      const tempFilePath = path.join(__dirname, '../../temp', `temp_${Date.now()}.csv`);
      const directory = path.dirname(tempFilePath);
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
      
      fs.writeFileSync(tempFilePath, csvString);
      
      const jsonArray = await csv().fromFile(tempFilePath);
      
      fs.unlinkSync(tempFilePath);
      
      const errors: string[] = [];
      const validTransactionTypes = Object.values(TransactionType);
      
      const requiredFields = ['amount', 'description', 'date', 'type'];
      
      const headers = Object.keys(jsonArray[0] || {});
      const missingFields = requiredFields.filter(field => !headers.includes(field));
      
      if (missingFields.length > 0) {
        errors.push(`Missing required fields: ${missingFields.join(', ')}`);
        return { valid: false, errors };
      }
      
      jsonArray.forEach((row, i) => {
        if (!row.amount || isNaN(parseFloat(row.amount))) {
          errors.push(`Row ${i + 1}: Invalid amount`);
        }
        
        if (!row.description) {
          errors.push(`Row ${i + 1}: Missing description`);
        }
        
        if (!row.date || isNaN(new Date(row.date).getTime())) {
          errors.push(`Row ${i + 1}: Invalid date`);
        }
        
        if (!row.type || !validTransactionTypes.includes(row.type)) {
          errors.push(`Row ${i + 1}: Invalid transaction type (must be INCOME, EXPENSE, or TRANSFER)`);
        }
        
        if (row.categoryId && isNaN(parseInt(row.categoryId))) {
          errors.push(`Row ${i + 1}: Category ID must be a number`);
        }
      });
      
      return {
        valid: errors.length === 0,
        errors,
        data: errors.length === 0 ? jsonArray : undefined,
      };
    } catch (error) {
      logger.error('Error validating transaction CSV:', error);
      return {
        valid: false,
        errors: ['Failed to parse CSV file: ' + (error instanceof Error ? error.message : error)],
      };
    }
  }

  public async validateCategoryCSV(csvString: string): Promise<{
    valid: boolean;
    errors: string[];
    data?: any[];
  }> {
    try {
      const tempFilePath = path.join(__dirname, '../../temp', `temp_${Date.now()}.csv`);
      const directory = path.dirname(tempFilePath);
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
      
      fs.writeFileSync(tempFilePath, csvString);
      
      const jsonArray = await csv().fromFile(tempFilePath);
      
      fs.unlinkSync(tempFilePath);
      
      const errors: string[] = [];
      const validCategoryTypes = Object.values(CategoryType);
      
      const requiredFields = ['name', 'type'];
      
      const headers = Object.keys(jsonArray[0] || {});
      const missingFields = requiredFields.filter(field => !headers.includes(field));
      
      if (missingFields.length > 0) {
        errors.push(`Missing required fields: ${missingFields.join(', ')}`);
        return { valid: false, errors };
      }
      
      jsonArray.forEach((row, i) => {
        if (!row.name) {
          errors.push(`Row ${i + 1}: Missing name`);
        }
        
        if (!row.type || !validCategoryTypes.includes(row.type)) {
          errors.push(`Row ${i + 1}: Invalid category type (must be INCOME or EXPENSE)`);
        }
        
        if (row.color && !/^#[0-9A-F]{6}$/i.test(row.color)) {
          errors.push(`Row ${i + 1}: Invalid color format. Must be a valid hex color (e.g., #RRGGBB)`);
        }
      });
      
      return {
        valid: errors.length === 0,
        errors,
        data: errors.length === 0 ? jsonArray : undefined,
      };
    } catch (error) {
      logger.error('Error validating category CSV:', error);
      return {
        valid: false,
        errors: ['Failed to parse CSV file: ' + (error instanceof Error ? error.message : error)],
      };
    }
  }

  public async validateBudgetCSV(csvString: string): Promise<{
    valid: boolean;
    errors: string[];
    data?: any[];
  }> {
    try {
      const tempFilePath = path.join(__dirname, '../../temp', `temp_${Date.now()}.csv`);
      const directory = path.dirname(tempFilePath);
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
      
      fs.writeFileSync(tempFilePath, csvString);
      
      const jsonArray = await csv().fromFile(tempFilePath);
      
      fs.unlinkSync(tempFilePath);
      
      const errors: string[] = [];
      const validPeriods = ['daily', 'weekly', 'monthly', 'yearly'];
      
      const requiredFields = ['name', 'amount', 'period', 'startDate'];
      
      const headers = Object.keys(jsonArray[0] || {});
      const missingFields = requiredFields.filter(field => !headers.includes(field));
      
      if (missingFields.length > 0) {
        errors.push(`Missing required fields: ${missingFields.join(', ')}`);
        return { valid: false, errors };
      }
      
      jsonArray.forEach((row, i) => {
        if (!row.name) {
          errors.push(`Row ${i + 1}: Missing name`);
        }
        
        if (!row.amount || isNaN(parseFloat(row.amount))) {
          errors.push(`Row ${i + 1}: Invalid amount`);
        }
        
        if (!row.period || !validPeriods.includes(row.period)) {
          errors.push(`Row ${i + 1}: Invalid period (must be daily, weekly, monthly, or yearly)`);
        }
        
        if (!row.startDate || isNaN(new Date(row.startDate).getTime())) {
          errors.push(`Row ${i + 1}: Invalid start date`);
        }
        
        if (row.endDate && isNaN(new Date(row.endDate).getTime())) {
          errors.push(`Row ${i + 1}: Invalid end date`);
        }
        
        if (row.categoryId && isNaN(parseInt(row.categoryId))) {
          errors.push(`Row ${i + 1}: Category ID must be a number`);
        }
      });
      
      return {
        valid: errors.length === 0,
        errors,
        data: errors.length === 0 ? jsonArray : undefined,
      };
    } catch (error) {
      logger.error('Error validating budget CSV:', error);
      return {
        valid: false,
        errors: ['Failed to parse CSV file: ' + (error instanceof Error ? error.message : error)],
      };
    }
  }

  public async validateGoalCSV(csvString: string): Promise<{
    valid: boolean;
    errors: string[];
    data?: any[];
  }> {
    try {
      const tempFilePath = path.join(__dirname, '../../temp', `temp_${Date.now()}.csv`);
      const directory = path.dirname(tempFilePath);
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
      
      fs.writeFileSync(tempFilePath, csvString);
      
      const jsonArray = await csv().fromFile(tempFilePath);
      
      fs.unlinkSync(tempFilePath);
      
      const errors: string[] = [];
      
      const requiredFields = ['name', 'targetAmount', 'targetDate'];
      
      const headers = Object.keys(jsonArray[0] || {});
      const missingFields = requiredFields.filter(field => !headers.includes(field));
      
      if (missingFields.length > 0) {
        errors.push(`Missing required fields: ${missingFields.join(', ')}`);
        return { valid: false, errors };
      }
      
      jsonArray.forEach((row, i) => {
        if (!row.name) {
          errors.push(`Row ${i + 1}: Missing name`);
        }
        
        if (!row.targetAmount || isNaN(parseFloat(row.targetAmount))) {
          errors.push(`Row ${i + 1}: Invalid target amount`);
        }
        
        if (row.currentAmount && isNaN(parseFloat(row.currentAmount))) {
          errors.push(`Row ${i + 1}: Invalid current amount`);
        }
        
        if (!row.targetDate || isNaN(new Date(row.targetDate).getTime())) {
          errors.push(`Row ${i + 1}: Invalid target date`);
        } else {
          const targetDate = new Date(row.targetDate);
          if (targetDate <= new Date()) {
            errors.push(`Row ${i + 1}: Target date must be in the future`);
          }
        }
      });
      
      return {
        valid: errors.length === 0,
        errors,
        data: errors.length === 0 ? jsonArray : undefined,
      };
    } catch (error) {
      logger.error('Error validating goal CSV:', error);
      return {
        valid: false,
        errors: ['Failed to parse CSV file: ' + (error instanceof Error ? error.message : error)],
      };
    }
  }

  public validateJSONImport(
    jsonString: string,
    dataType: 'transactions' | 'categories' | 'budgets' | 'goals'
  ): {
    valid: boolean;
    errors: string[];
    data?: any[];
  } {
    try {
      let data;
      try {
        data = JSON.parse(jsonString);
      } catch (error) {
        return {
          valid: false,
          errors: ['Invalid JSON format: ' + (error instanceof Error ? error.message : error)],
        };
      }
      
      if (!Array.isArray(data)) {
        return {
          valid: false,
          errors: ['Data must be an array'],
        };
      }
      
      const errors: string[] = [];
      
      switch (dataType) {
        case 'transactions':
          return this.validateTransactionsJSON(data);
        case 'categories':
          return this.validateCategoriesJSON(data);
        case 'budgets':
          return this.validateBudgetsJSON(data);
        case 'goals':
          return this.validateGoalsJSON(data);
        default:
          return {
            valid: false,
            errors: ['Invalid data type'],
          };
      }
    } catch (error) {
      logger.error(`Error validating ${dataType} JSON:`, error);
      return {
        valid: false,
        errors: ['Failed to validate JSON: ' + (error instanceof Error ? error.message : error)],
      };
    }
  }

  private validateTransactionsJSON(data: any[]): {
    valid: boolean;
    errors: string[];
    data?: any[];
  } {
    const errors: string[] = [];
    const validTransactionTypes = Object.values(TransactionType);
    
    data.forEach((item, i) => {
      if (!item.amount || isNaN(parseFloat(item.amount))) {
        errors.push(`Item ${i + 1}: Invalid amount`);
      }
      
      if (!item.description) {
        errors.push(`Item ${i + 1}: Missing description`);
      }
      
      if (!item.date || isNaN(new Date(item.date).getTime())) {
        errors.push(`Item ${i + 1}: Invalid date`);
      }
      
      if (!item.type || !validTransactionTypes.includes(item.type)) {
        errors.push(`Item ${i + 1}: Invalid transaction type (must be INCOME, EXPENSE, or TRANSFER)`);
      }
      
      if (!item.categoryId) {
        errors.push(`Item ${i + 1}: Missing categoryId`);
      } else if (isNaN(parseInt(item.categoryId))) {
        errors.push(`Item ${i + 1}: categoryId must be a number`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors,
      data: errors.length === 0 ? data : undefined,
    };
  }

  private validateCategoriesJSON(data: any[]): {
    valid: boolean;
    errors: string[];
    data?: any[];
  } {
    const errors: string[] = [];
    const validCategoryTypes = Object.values(CategoryType);
    
    data.forEach((item, i) => {
      if (!item.name) {
        errors.push(`Item ${i + 1}: Missing name`);
      }
      
      if (!item.type || !validCategoryTypes.includes(item.type)) {
        errors.push(`Item ${i + 1}: Invalid category type (must be INCOME or EXPENSE)`);
      }
      
      if (item.color && !/^#[0-9A-F]{6}$/i.test(item.color)) {
        errors.push(`Item ${i + 1}: Invalid color format. Must be a valid hex color (e.g., #RRGGBB)`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors,
      data: errors.length === 0 ? data : undefined,
    };
  }

  private validateBudgetsJSON(data: any[]): {
    valid: boolean;
    errors: string[];
    data?: any[];
  } {
    const errors: string[] = [];
    const validPeriods = ['daily', 'weekly', 'monthly', 'yearly'];
    
    data.forEach((item, i) => {
      if (!item.name) {
        errors.push(`Item ${i + 1}: Missing name`);
      }
      
      if (!item.amount || isNaN(parseFloat(item.amount))) {
        errors.push(`Item ${i + 1}: Invalid amount`);
      }
      
      if (!item.period || !validPeriods.includes(item.period)) {
        errors.push(`Item ${i + 1}: Invalid period (must be daily, weekly, monthly, or yearly)`);
      }
      
      if (!item.startDate || isNaN(new Date(item.startDate).getTime())) {
        errors.push(`Item ${i + 1}: Invalid startDate`);
      }
      
      if (item.endDate && isNaN(new Date(item.endDate).getTime())) {
        errors.push(`Item ${i + 1}: Invalid endDate`);
      }
      
      if (item.categoryId && isNaN(parseInt(item.categoryId))) {
        errors.push(`Item ${i + 1}: categoryId must be a number`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors,
      data: errors.length === 0 ? data : undefined,
    };
  }

  private validateGoalsJSON(data: any[]): {
    valid: boolean;
    errors: string[];
    data?: any[];
  } {
    const errors: string[] = [];
    
    data.forEach((item, i) => {
      if (!item.name) {
        errors.push(`Item ${i + 1}: Missing name`);
      }
      
      if (!item.targetAmount || isNaN(parseFloat(item.targetAmount))) {
        errors.push(`Item ${i + 1}: Invalid targetAmount`);
      }
      
      if (item.currentAmount && isNaN(parseFloat(item.currentAmount))) {
        errors.push(`Item ${i + 1}: Invalid currentAmount`);
      }
      
      if (!item.targetDate || isNaN(new Date(item.targetDate).getTime())) {
        errors.push(`Item ${i + 1}: Invalid targetDate`);
      } else {
        const targetDate = new Date(item.targetDate);
        if (targetDate <= new Date()) {
          errors.push(`Item ${i + 1}: Target date must be in the future`);
        }
      }
    });
    
    return {
      valid: errors.length === 0,
      errors,
      data: errors.length === 0 ? data : undefined,
    };
  }

  public async importFromJSON(
    userId: number,
    data: any[],
    dataType: 'transactions' | 'categories' | 'budgets' | 'goals'
  ): Promise<ImportResult> {
    try {
      const result: ImportResult = {
        success: false,
        message: '',
        imported: 0,
        errors: [],
      };

      const user = await User.findByPk(userId);
      if (!user) {
        result.message = 'User not found';
        return result;
      }

      switch (dataType) {
        case 'transactions':
          return await this.importTransactionsFromJSON(userId, data);
        case 'categories':
          return await this.importCategoriesFromJSON(userId, data);
        case 'budgets':
          return await this.importBudgetsFromJSON(userId, data);
        case 'goals':
          return await this.importGoalsFromJSON(userId, data);
        default:
          result.message = 'Invalid data type';
          return result;
      }
    } catch (error) {
      logger.error(`Error importing ${dataType} from JSON:`, error);
      throw error;
    }
  }

  private async importTransactionsFromJSON(userId: number, data: any[]): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      message: '',
      imported: 0,
      errors: [],
      data: [],
    };

    const categories = await Category.findAll({
      where: { userId },
      attributes: ['id', 'type'],
    });
    
    const categoryMap = categories.reduce((acc: Record<number, any>, category: any) => {
      acc[category.id] = category;
      return acc;
    }, {});

    const transactionsToCreate = [];
    const validTransactionTypes = Object.values(TransactionType);

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      try {
        if (!item.amount || isNaN(parseFloat(item.amount))) {
          result.errors.push(`Item ${i + 1}: Invalid amount`);
          continue;
        }

        if (!item.description) {
          result.errors.push(`Item ${i + 1}: Missing description`);
          continue;
        }

        if (!item.date || isNaN(new Date(item.date).getTime())) {
          result.errors.push(`Item ${i + 1}: Invalid date`);
          continue;
        }

        if (!item.type || !validTransactionTypes.includes(item.type)) {
          result.errors.push(`Item ${i + 1}: Invalid transaction type`);
          continue;
        }

        if (!item.categoryId) {
          result.errors.push(`Item ${i + 1}: Missing categoryId`);
          continue;
        }

        const categoryId = parseInt(item.categoryId);
        
        if (!categoryMap[categoryId]) {
          result.errors.push(`Item ${i + 1}: Category not found or does not belong to user`);
          continue;
        }

        if (categoryMap[categoryId].type !== item.type) {
          result.errors.push(
            `Item ${i + 1}: Transaction type (${item.type}) doesn't match category type (${categoryMap[categoryId].type})`
          );
          continue;
        }

        transactionsToCreate.push({
          userId,
          amount: parseFloat(item.amount),
          description: item.description,
          date: new Date(item.date),
          type: item.type,
          categoryId,
          recurring: Boolean(item.recurring),
          recurringInterval: item.recurringInterval || null,
        });
      } catch (error) {
        result.errors.push(`Item ${i + 1}: ${error instanceof Error ? error.message : error}`);
      }
    }

    if (transactionsToCreate.length > 0) {
      const imported = await Transaction.bulkCreate(transactionsToCreate);
      result.imported = imported.length;
      result.data = imported;
      result.success = true;
      result.message = `Successfully imported ${imported.length} transactions`;
    } else {
      result.message = 'No valid transactions found to import';
    }

    return result;
  }

  private async importCategoriesFromJSON(userId: number, data: any[]): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      message: '',
      imported: 0,
      errors: [],
      data: [],
    };

    const existingCategories = await Category.findAll({
      where: { userId },
      attributes: ['name'],
    });
    
    const existingCategoryNames = new Set(
      existingCategories.map((cat: any) => cat.name.toLowerCase())
    );

    const categoriesToCreate = [];
    const validCategoryTypes = Object.values(CategoryType);

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      try {
        if (!item.name) {
          result.errors.push(`Item ${i + 1}: Missing name`);
          continue;
        }

        if (!item.type || !validCategoryTypes.includes(item.type)) {
          result.errors.push(`Item ${i + 1}: Invalid category type`);
          continue;
        }

        if (existingCategoryNames.has(item.name.toLowerCase())) {
          result.errors.push(`Item ${i + 1}: Category with name "${item.name}" already exists`);
          continue;
        }

        if (item.color && !/^#[0-9A-F]{6}$/i.test(item.color)) {
          result.errors.push(`Item ${i + 1}: Invalid color format. Must be a valid hex color (e.g., #RRGGBB)`);
          continue;
        }

        categoriesToCreate.push({
          userId,
          name: item.name,
          description: item.description || '',
          type: item.type,
          color: item.color || '#000000',
          icon: item.icon || null,
        });

        existingCategoryNames.add(item.name.toLowerCase());
      } catch (error) {
        result.errors.push(`Item ${i + 1}: ${error instanceof Error ? error.message : error}`);
      }
    }

    if (categoriesToCreate.length > 0) {
      const imported = await Category.bulkCreate(categoriesToCreate);
      result.imported = imported.length;
      result.data = imported;
      result.success = true;
      result.message = `Successfully imported ${imported.length} categories`;
    } else {
      result.message = 'No valid categories found to import';
    }

    return result;
  }

  private async importBudgetsFromJSON(userId: number, data: any[]): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      message: '',
      imported: 0,
      errors: [],
      data: [],
    };

    const categories = await Category.findAll({
      where: { userId },
      attributes: ['id', 'type'],
    });
    
    const categoryMap = categories.reduce((acc: Record<number, any>, category: any) => {
      acc[category.id] = category;
      return acc;
    }, {});

    const budgetsToCreate = [];
    const validPeriods = ['daily', 'weekly', 'monthly', 'yearly'];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      try {
        if (!item.name) {
          result.errors.push(`Item ${i + 1}: Missing name`);
          continue;
        }

        if (!item.amount || isNaN(parseFloat(item.amount))) {
          result.errors.push(`Item ${i + 1}: Invalid amount`);
          continue;
        }

        if (!item.period || !validPeriods.includes(item.period)) {
          result.errors.push(`Item ${i + 1}: Invalid period`);
          continue;
        }

        if (!item.startDate || isNaN(new Date(item.startDate).getTime())) {
          result.errors.push(`Item ${i + 1}: Invalid start date`);
          continue;
        }

        let endDate;
        if (item.endDate) {
          if (isNaN(new Date(item.endDate).getTime())) {
            result.errors.push(`Item ${i + 1}: Invalid end date`);
            continue;
          }
          endDate = new Date(item.endDate);
          
          if (endDate <= new Date(item.startDate)) {
            result.errors.push(`Item ${i + 1}: End date must be after start date`);
            continue;
          }
        }

        let categoryId;
        if (item.categoryId) {
          categoryId = parseInt(item.categoryId);
          
          if (!categoryMap[categoryId]) {
            result.errors.push(`Item ${i + 1}: Category not found or does not belong to user`);
            continue;
          }

          if (categoryMap[categoryId].type !== 'EXPENSE') {
            result.errors.push(
              `Item ${i + 1}: Budgets can only be created for expense categories`
            );
            continue;
          }
        }

        budgetsToCreate.push({
          userId,
          name: item.name,
          amount: parseFloat(item.amount),
          period: item.period,
          startDate: new Date(item.startDate),
          endDate: endDate,
          categoryId: categoryId,
        });
      } catch (error) {
        result.errors.push(`Item ${i + 1}: ${error instanceof Error ? error.message : error}`);
      }
    }

    if (budgetsToCreate.length > 0) {
      const imported = await Budget.bulkCreate(budgetsToCreate);
      result.imported = imported.length;
      result.data = imported;
      result.success = true;
      result.message = `Successfully imported ${imported.length} budgets`;
    } else {
      result.message = 'No valid budgets found to import';
    }

    return result;
  }

  private async importGoalsFromJSON(userId: number, data: any[]): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      message: '',
      imported: 0,
      errors: [],
      data: [],
    };

    const goalsToCreate = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      try {
        if (!item.name) {
          result.errors.push(`Item ${i + 1}: Missing name`);
          continue;
        }

        if (!item.targetAmount || isNaN(parseFloat(item.targetAmount))) {
          result.errors.push(`Item ${i + 1}: Invalid target amount`);
          continue;
        }

        let currentAmount = 0;
        if (item.currentAmount !== undefined) {
          if (isNaN(parseFloat(item.currentAmount))) {
            result.errors.push(`Item ${i + 1}: Invalid current amount`);
            continue;
          }
          currentAmount = parseFloat(item.currentAmount);
          
          if (currentAmount < 0) {
            result.errors.push(`Item ${i + 1}: Current amount cannot be negative`);
            continue;
          }
        }

        if (!item.targetDate || isNaN(new Date(item.targetDate).getTime())) {
          result.errors.push(`Item ${i + 1}: Invalid target date`);
          continue;
        }

        const targetDate = new Date(item.targetDate);
        if (targetDate <= new Date()) {
          result.errors.push(`Item ${i + 1}: Target date must be in the future`);
          continue;
        }

        goalsToCreate.push({
          userId,
          name: item.name,
          targetAmount: parseFloat(item.targetAmount),
          currentAmount: currentAmount,
          targetDate: targetDate,
          description: item.description || '',
          category: item.category || undefined,
          notificationSent: false,
        });
      } catch (error) {
        result.errors.push(`Item ${i + 1}: ${error instanceof Error ? error.message : error}`);
      }
    }

    if (goalsToCreate.length > 0) {
      const imported = await FinancialGoal.bulkCreate(goalsToCreate);
      result.imported = imported.length;
      result.data = imported;
      result.success = true;
      result.message = `Successfully imported ${imported.length} financial goals`;
    } else {
      result.message = 'No valid financial goals found to import';
    }

    return result;
  }
}

export const dataProcessingService = new DataProcessingService();