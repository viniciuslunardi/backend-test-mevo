import { ObjectId } from 'mongodb';
import { prop, index, getModelForClass } from '@typegoose/typegoose';
import { TimeStamps, Base } from '@typegoose/typegoose/lib/defaultClasses';


@index({ suspicious: 1 })
export class Transaction extends TimeStamps implements Base<ObjectId> {
    public _id!: ObjectId;
    public id!: string;

    @prop({ required: true })
    public from: number;

    @prop({ required: true })
    public to: number;

    @prop({ required: true })
    public amount: number;

    @prop({ required: true })
    public suspicious: boolean;
}

export const TransactionModel = getModelForClass(Transaction);
