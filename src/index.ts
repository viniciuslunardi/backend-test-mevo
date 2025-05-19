import express, { Response, Request } from 'express';
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";

interface FileData {
    from: string;
    to: string;
    amount: string;
}

interface TransactionData {
    from: number;
    to: number;
    amount: number;
}

enum InvalidTransactionReasons {
    NEGATIVE_AMOUT = "Transação com valor negativo",
    DUPLICATED = "Transação duplicada",
    INVALID_TYPE = "Transação com valores inválidos, devem ser apenas valores numéricos"
}

interface ProcessedData {
    valid: Array<{transactionData: TransactionData,  suspicious?: Boolean}>,
    invalid: Array<{reason: InvalidTransactionReasons, transactionData: TransactionData}>
}

const SUSPICIOUS_TRESHOLD = 5000000; // considera suspeitas se maior ou igual a R$50.000

const storage  = multer.memoryStorage()
const upload = multer({ storage: storage })

const app = express();

const router = express.Router();

router.post('/process-transactions', upload.single('file'), async (req: Request, res: Response ): Promise<any> => {
    try {
        //@todo valir o tipo de arquivo que vamos processar e receber -- deve ser só csv

        const processedData: ProcessedData = { valid: [], invalid: []};
        const transactionValues = new Set<string>()
        
        if (!req.file) return res.status(422).send("file not sent");

        const stream = Readable.from(req.file.buffer);
        stream.pipe(csv({separator: ";"})).on('data', (data:  FileData ) => {
            try {
                const from = parseInt(data.from);
                const to = parseInt(data.to);
                const amount = parseInt(data.amount);

                const transactionData: TransactionData = { from, to, amount };
              
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
                    console.error("@error processing transaction:", data);
                }
                })
            .on('error', (err) => { 
                console.error("@error streaming file: ", err);
            })
            .on("end", () => {
                // @todo - salvar num banco de dados 
                return res.status(200).send({ validTransactionsProcessed: processedData.valid.length, invalidTransactionsProcessed: processedData.invalid.length, invalidTransactionsData: processedData.invalid})
        });
     } catch (err) {
        console.error(err);
        //@todo use https-status-codes
        return res.status(500).send("Server error");
     }
});

app.use(router);

app.listen(3000, () => { console.log("server running")});
