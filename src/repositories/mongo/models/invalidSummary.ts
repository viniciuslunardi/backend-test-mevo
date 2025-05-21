import { ObjectId } from 'mongodb';
import { prop, getModelForClass } from '@typegoose/typegoose';
import { TimeStamps, Base } from '@typegoose/typegoose/lib/defaultClasses';

export class InvalidSummary extends TimeStamps implements Base<ObjectId> {
    public _id!: ObjectId;
    public id!: string;

    @prop({ required: true })
    public summary: string;

    @prop({ required: true })
    public reason: string;

    @prop({ required: false })
    public fileName: string;
}
export const InvalidSummaryModel = getModelForClass(InvalidSummary);
