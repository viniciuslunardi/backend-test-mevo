import {
    Transaction,
    TransactionModel,
} from '../infra/db/mongo/models/transactions';

// @todo criar DTOs pra ficar mais facil de entender
export class TransactionRepository {
    async create(transaction: Partial<Transaction>) {
        return await TransactionModel.create(transaction);
    }

    async findAll() {
        // @todo paginar
        return TransactionModel.find();
    }

    async findById(id: string) {
        return TransactionModel.findById(id);
    }

    async findSuspicious() {
        return TransactionModel.find({ suspicious: true });
    }

    // @todo mais métodos
}
