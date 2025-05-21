import { InvalidSummary, InvalidSummaryModel } from "../infra/db/mongo/models/invalidSummary";
import { InvalidTransactionReasons } from "../types/transaction.types";

export class InvalidSummaryRepository {
    async create(transaction: Partial<InvalidSummary>) {
        return await InvalidSummaryModel.create(transaction);
    }

    async findAll() {
        // @todo paginar
        return InvalidSummaryModel.find();
    }

    async findById(id: string) {
        return InvalidSummaryModel.findById(id);
    }

    async findByReason(reason: InvalidTransactionReasons) {
     return InvalidSummaryModel.find({ reason });
    }

    // @todo mais métodos
}
