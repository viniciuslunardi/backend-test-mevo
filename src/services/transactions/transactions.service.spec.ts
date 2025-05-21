import TransactionService from './transactions.service';
import { TransactionRepository } from '../../repositories/mongo/transactions/transaction.repository';
import { InvalidSummaryRepository } from '../../repositories/mongo/invalidSummary/invalidSummary.repository';
import { InvalidTransactionReasons } from '../../types/transaction.types';

jest.mock('../../repositories/mongo/transactions/transaction.repository');
jest.mock('../../repositories/mongo/invalidSummary/invalidSummary.repository');

const mockTransactionRepo = TransactionRepository as jest.MockedClass<
    typeof TransactionRepository
>;
const mockInvalidSummaryRepo = InvalidSummaryRepository as jest.MockedClass<
    typeof InvalidSummaryRepository
>;

function createCSVBuffer(rows: string[]): Buffer {
    const header = 'from;to;amount';
    return Buffer.from([header, ...rows].join('\n'));
}

describe('TransactionService', () => {
    let service: TransactionService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new TransactionService();
    });

    it('should process a valid transaction', async () => {
        const csv = createCSVBuffer(['1;2;1000']);
        (mockTransactionRepo.prototype.create as jest.Mock).mockResolvedValue(
            {},
        );
        (
            mockInvalidSummaryRepo.prototype.create as jest.Mock
        ).mockResolvedValue({});

        const result = await service.processTransaction(csv, 'file.csv');
        expect(result.valid).toHaveLength(1);
        expect(result.invalid).toHaveLength(0);
        expect(result.valid[0].transactionData).toEqual({
            from: 1,
            to: 2,
            amount: 1000,
        });
        expect(result.valid[0].suspicious).toBe(false);
        expect(mockTransactionRepo.prototype.create).toHaveBeenCalledTimes(1);
    });

    it('should mark transaction as suspicious if amount >= 5000000', async () => {
        const csv = createCSVBuffer(['1;2;5000000']);
        (mockTransactionRepo.prototype.create as jest.Mock).mockResolvedValue(
            {},
        );

        const result = await service.processTransaction(csv, 'file.csv');
        expect(result.valid).toHaveLength(1);
        expect(result.valid[0].suspicious).toBe(true);
    });

    it('should mark transaction as invalid if amount is negative', async () => {
        const csv = createCSVBuffer(['1;2;-100']);
        (
            mockInvalidSummaryRepo.prototype.create as jest.Mock
        ).mockResolvedValue({});

        const result = await service.processTransaction(csv, 'file.csv');
        expect(result.valid).toHaveLength(0);
        expect(result.invalid).toHaveLength(1);
        expect(result.invalid[0].reason).toBe(
            InvalidTransactionReasons.NEGATIVE_AMOUT,
        );
        expect(mockInvalidSummaryRepo.prototype.create).toHaveBeenCalledTimes(
            1,
        );
    });

    it('should mark transaction as invalid if from, to, or amount is not a number', async () => {
        const csv = createCSVBuffer(['a;2;100', '1;b;100', '1;2;c']);
        (
            mockInvalidSummaryRepo.prototype.create as jest.Mock
        ).mockResolvedValue({});

        const result = await service.processTransaction(csv, 'file.csv');
        expect(result.valid).toHaveLength(0);
        expect(result.invalid).toHaveLength(3);
        result.invalid.forEach((inv) =>
            expect(inv.reason).toBe(InvalidTransactionReasons.INVALID_TYPE),
        );
        expect(mockInvalidSummaryRepo.prototype.create).toHaveBeenCalledTimes(
            3,
        );
    });

    it('should mark duplicated transactions as invalid', async () => {
        const csv = createCSVBuffer(['1;2;100', '1;2;100']);
        (mockTransactionRepo.prototype.create as jest.Mock).mockResolvedValue(
            {},
        );
        (
            mockInvalidSummaryRepo.prototype.create as jest.Mock
        ).mockResolvedValue({});

        const result = await service.processTransaction(csv, 'file.csv');
        expect(result.valid).toHaveLength(1);
        expect(result.invalid).toHaveLength(1);
        expect(result.invalid[0].reason).toBe(
            InvalidTransactionReasons.DUPLICATED,
        );
        expect(mockTransactionRepo.prototype.create).toHaveBeenCalledTimes(1);
        expect(mockInvalidSummaryRepo.prototype.create).toHaveBeenCalledTimes(
            1,
        );
    });

    it('should process a mix of valid, invalid, and suspicious transactions', async () => {
        const csv = createCSVBuffer([
            '1;2;100', // valid
            '1;2;100', // duplicated
            '1;2;-10', // negative
            'a;2;100', // invalid type
            '1;2;5000000', // suspicious
        ]);
        (mockTransactionRepo.prototype.create as jest.Mock).mockResolvedValue(
            {},
        );
        (
            mockInvalidSummaryRepo.prototype.create as jest.Mock
        ).mockResolvedValue({});

        const result = await service.processTransaction(csv, 'file.csv');
        expect(result.valid).toHaveLength(2);
        expect(result.invalid).toHaveLength(3);

        expect(
            result.valid.find((v) => v.transactionData.amount === 5000000)
                ?.suspicious,
        ).toBe(true);
        expect(result.invalid.map((i) => i.reason)).toEqual(
            expect.arrayContaining([
                InvalidTransactionReasons.DUPLICATED,
                InvalidTransactionReasons.NEGATIVE_AMOUT,
                InvalidTransactionReasons.INVALID_TYPE,
            ]),
        );
    });

    it('should throw if persistData fails', async () => {
        const csv = createCSVBuffer(['1;2;100']);
        (mockTransactionRepo.prototype.create as jest.Mock).mockRejectedValue(
            new Error('DB error'),
        );
        await expect(
            service.processTransaction(csv, 'file.csv'),
        ).rejects.toThrow('DB error');
    });
});
