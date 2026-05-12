import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Settings, SettingsDocument } from './settings.schema';

@Injectable()
export class SettingsService {
  constructor(@InjectModel(Settings.name) private model: Model<SettingsDocument>) {}

  async get(): Promise<SettingsDocument> {
    let doc = await this.model.findOne().lean() as unknown as SettingsDocument | null;
    if (!doc) {
      doc = await this.model.create({});
    }
    return doc;
  }

  async update(data: Partial<Settings>): Promise<SettingsDocument> {
    const doc = await this.model.findOneAndUpdate({}, { $set: data }, { new: true, upsert: true }).lean();
    return doc as unknown as SettingsDocument;
  }
}
