import csv from 'csv-parser';
import { Readable } from 'stream';
import { FileData, ProcessedData, TransactionData, InvalidTransactionReasons } from "../types/transaction.types";
import logger from '../shared/logger';

const SUSPICIOUS_TRESHOLD = 5000000 // @todo -- config file

export default class TransactionService {
  constructor() {}

  public async processTransaction(bufferFile: Buffer): Promise<ProcessedData> {
        const processedData: ProcessedData = { valid: [], invalid: []};
        const transactionValues = new Set<string>() 
        
        const stream = Readable.from(bufferFile);
        
        // @todo - ver se tem alguma forma melhor de fazer isso
        return new Promise((resolve, reject) => {
            stream.pipe(csv({separator: ";"})).on('data', (data:  FileData ) => {
                try {
                    const from = parseInt(data.from); // @todo conversão deixando passar "NaN"
                    const to = parseInt(data.to);
                    const amount = parseInt(data.amount);

                    const transactionData: TransactionData = { from, to, amount };

                    if (isNaN(to) || isNaN(from) || isNaN(amount)) {
                        processedData.invalid.push({ transactionData, reason: InvalidTransactionReasons.INVALID_TYPE});
                        return;
                    }
                
                    if (amount < 0) {
                        processedData.invalid.push({transactionData, reason: InvalidTransactionReasons.NEGATIVE_AMOUT});
                        return;
                    }

                    const duplicated = transactionValues.has(`from:${transactionData.from}-amount:${transactionData.amount}-to:${transactionData.to}`);

                    if (duplicated) {
                        processedData.invalid.push({ transactionData, reason: InvalidTransactionReasons.DUPLICATED});
                        return;
                    }

                    const suspicious = amount >= SUSPICIOUS_TRESHOLD;
                    
                    processedData.valid.push({transactionData, suspicious });
                    transactionValues.add(`from:${transactionData.from}-amount:${transactionData.amount}-to:${transactionData.to}`);
                    } catch (err) {
                        // @todo - melhorar tratamentos de erro
                        logger.error("@error processing transaction:", data);
                    }
                    })
                .on('error', (err) => { 
                    logger.error("@error streaming file: ", err);
                    reject(err);

                })
                .on("end", () => {
                    // @todo - salvar num banco de dados 
                    resolve(processedData);
            });
        })
    }   
}