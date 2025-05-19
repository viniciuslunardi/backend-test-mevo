import express, { Response, Request } from 'express';
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";


const storage  = multer.memoryStorage()
const upload = multer({ storage: storage })

const app = express();

const router = express.Router();

router.post('/upload', upload.single('file'), async (req: Request, res: Response ): Promise<any> => {
    
    if (req.file) {
        const stream = Readable.from(req.file.buffer);
        stream.pipe(csv({separator: ";"})).on('data', (data) =>{
            console.log(data);
        }).on("end", () => {
            console.log("processamos");
        })

        return res.json("ok");
    }  


    return res.status(422).send("file not sent");
  
});

app.use(router);

app.listen(3000, () => { console.log("server running")});
