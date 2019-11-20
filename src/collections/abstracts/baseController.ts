import { ResponseService } from '../../services/responseService';
import { QueryService } from '../../services/query/queryService';
import { DatabaseService } from '../../services/database/databaseService';
import { Document, Model } from 'mongoose';
import { BaseEntity } from './baseEntity';
import { Validation } from './baseValidation';
import {
  IReq,
  IRes,
  INext
} from '../../utilities/interfaces/IMiddlewareParams';
import { IParams } from '../../utilities/interfaces/IParams';

export abstract class BaseController<
  D extends Document,
  M extends BaseEntity<D>
> {
  protected readonly _res: ResponseService;
  protected readonly _queryService: QueryService;
  protected readonly _entity: M;
  protected readonly _modelDb: DatabaseService<D>;
  protected readonly _validate: (document: D) => void;
  protected readonly _names: IParams;

  constructor(model: M, validation: Validation<D>, names: IParams) {
    this._names = names;
    this._entity = model;
    this._validate = validation.validate;
    this._res = new ResponseService();
    this._queryService = new QueryService();
    this._modelDb = new DatabaseService<D>(this._entity.model as Model<D>);
  }

  public async getAll(req: IReq, res: IRes, next: INext) {
    try {
      const docs: Array<D> = await this._modelDb.findMany('');
      this._res.successFind(res, { [this._names.plural]: docs });
    } catch (e) {
      return next(e);
    }
  }

  public async create(req: IReq, res: IRes, next: INext) {
    try {
      this._validate(req.body);
      const doc: D = await this._modelDb.create('', req.body);
      this._res.successCreate(res, { [this._names.singular]: doc });
    } catch (e) {
      return next(e);
    }
  }

  public async getOne(req: IReq, res: IRes, next: INext) {
    try {
      const params = this._queryService.buildParamQuery(req.params);
      const doc: D | null = await this._modelDb.findOne('', params);
      this._res.successFind(res, { [this._names.singular]: doc });
    } catch (e) {
      return next(e);
    }
  }

  public async delete(req: IReq, res: IRes, next: INext) {
    try {
      const params = this._queryService.buildParamQuery(req.params);
      await this._modelDb.deleteOne('', params);
      this._res.successDelete(res);
    } catch (e) {
      return next(e);
    }
  }

  public async update(req: IReq, res: IRes, next: INext) {
    try {
      this._validate(req.body);
      const params = this._queryService.buildParamQuery(req.params);
      const [updated]: Array<D> = await this._modelDb.update(
        '',
        params,
        req.body
      );
      this._res.successCreate(res, { [this._names.singular]: updated });
    } catch (e) {
      return next(e);
    }
  }
}
