import express from 'express';
import multer from 'multer';
import TransactionController from '../controllers/transactions.controller';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const controller = new TransactionController();

router.post(
    '/process',
    upload.single('file'),
    async (req, res, next) => {
        try {
            await controller.processTransactions(req, res);
        } catch (err) {
            next(err);
        }
    },
);

export default router;
