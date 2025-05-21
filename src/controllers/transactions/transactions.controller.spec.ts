import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import TransactionController from './transactions.controller';
import TransactionService from '../../services/transactions/transactions.service';
import logger from '../../shared/logger';

jest.mock('../../services/transactions/transactions.service');
jest.mock('../../shared/logger');

describe('TransactionController', () => {
    let controller: TransactionController;
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let statusMock: jest.Mock;
    let sendMock: jest.Mock;

    beforeEach(() => {
        controller = new TransactionController();
        statusMock = jest.fn().mockReturnThis();
        sendMock = jest.fn().mockReturnThis();
        mockRes = {
            status: statusMock,
            send: sendMock,
        };
        jest.clearAllMocks();
    });

    it('should return 400 if file is not sent', async () => {
        mockReq = {};
        await controller.processTransactions(
            mockReq as Request,
            mockRes as Response,
        );
        expect(statusMock).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
        expect(sendMock).toHaveBeenCalledWith({
            message: 'File was not sent.',
        });
    });

    it('should return 415 if file mimetype is not csv', async () => {
        mockReq = {
            file: {
                mimetype: 'application/json',
            } as any,
        };
        await controller.processTransactions(
            mockReq as Request,
            mockRes as Response,
        );
        expect(statusMock).toHaveBeenCalledWith(
            StatusCodes.UNSUPPORTED_MEDIA_TYPE,
        );
        expect(sendMock).toHaveBeenCalledWith({
            message: 'Unsupported file type. Only CSV files are allowed.',
        });
    });

    it('should process file and return valid/invalid transactions', async () => {
        const valid = [{ from: 20123, to: 2151321, amount: 12315 }];
        const invalid = [{ from: 20123, to: 123, amount: -12315 }];
        (
            TransactionService.prototype.processTransaction as jest.Mock
        ).mockResolvedValue({
            valid,
            invalid,
        });

        mockReq = {
            file: {
                mimetype: 'text/csv',
                buffer: Buffer.from('test'),
                originalname: 'test.csv',
            } as any,
        };

        await controller.processTransactions(
            mockReq as Request,
            mockRes as Response,
        );

        expect(
            TransactionService.prototype.processTransaction,
        ).toHaveBeenCalledWith(
            mockReq.file?.buffer,
            mockReq.file?.originalname,
        );
        expect(statusMock).toHaveBeenCalledWith(StatusCodes.OK);
        expect(sendMock).toHaveBeenCalledWith({
            validTransactionsProcessed: valid.length,
            invalidTransactionsProcessed: invalid.length,
            invalidTransactionsData: invalid,
        });
        expect(logger.info).toHaveBeenCalledWith('Processing file...');
    });

    it('should handle errors and return 500', async () => {
        (
            TransactionService.prototype.processTransaction as jest.Mock
        ).mockRejectedValue(new Error('fail'));

        mockReq = {
            file: {
                mimetype: 'text/csv',
                buffer: Buffer.from('test'),
                originalname: 'test.csv',
            } as any,
        };

        await controller.processTransactions(
            mockReq as Request,
            mockRes as Response,
        );

        expect(statusMock).toHaveBeenCalledWith(
            StatusCodes.INTERNAL_SERVER_ERROR,
        );
        expect(sendMock).toHaveBeenCalledWith({
            message: 'Server unable to process request',
        });
        expect(logger.error).toHaveBeenCalled();
    });
});
