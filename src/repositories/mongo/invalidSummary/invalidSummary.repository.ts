import { InvalidSummary, InvalidSummaryModel } from '../models/invalidSummary';
import { InvalidTransactionReasons } from '../../../types/transaction.types';

export class InvalidSummaryRepository {
    async create(transaction: Partial<InvalidSummary>) {
        return await InvalidSummaryModel.create(transaction);
    }

    // @todo todos os repositories, eu daria mais atenção, trataria melhor em casos de erro, adicionaria mais funcionalidades, adicionaria testes, etc
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

    // @todo em um cenário real, aqui teriamos mais métodos
}
