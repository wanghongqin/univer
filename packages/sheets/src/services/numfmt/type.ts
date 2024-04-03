/**
 * Copyright 2023-present DreamNum Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { ICellData, IObjectMatrixPrimitiveType, IRange, Nullable, ObjectMatrix, RefAlias } from '@univerjs/core';
import { LifecycleStages, runOnLifecycle } from '@univerjs/core';
import { createIdentifier } from '@wendellhu/redi';
import type { Observable } from 'rxjs';

// eslint-disable-next-line ts/consistent-type-definitions
export type INumfmtItem = {
    i: string;
};

export type FormatType =
    | 'currency'
    | 'date'
    | 'datetime'
    | 'error'
    | 'fraction'
    | 'general'
    | 'grouped'
    | 'number'
    | 'percent'
    | 'scientific'
    | 'text'
    | 'time'
    | 'unknown';

export interface INumfmtItemWithCache {
    // when change parameters or pattern, the cache is cleared follow mutation execute
    _cache?: {
        result: ICellData;
        parameters: number; // The parameter that was last calculated
    };
    pattern: string;
    type: FormatType;
}
export type IRefItem = INumfmtItem & { count: number; type: FormatType; pattern: string };

export interface INumfmtService {
    getValue(
        unitId: string,
        subUnitId: string,
        row: number,
        col: number,
        model?: ObjectMatrix<INumfmtItem>
    ): Nullable<INumfmtItemWithCache>;
    getModel(unitId: string, subUnitId: string): Nullable<ObjectMatrix<INumfmtItem>>;
    setValues(
        unitId: string,
        subUnitId: string,
        values: Array<{ ranges: IRange[]; pattern: string; type: FormatType }>
    ): void;
    deleteValues(unitId: string, subUnitId: string, values: IRange[]): void;
    getRefModel(unitId: string): Nullable<RefAlias<IRefItem, 'i' | 'pattern'>>;
    modelReplace$: Observable<string>;
    serialTimeToTimestamp: (v: number, is1900?: boolean) => number;
}

export interface ISnapshot {
    model: Record<string, IObjectMatrixPrimitiveType<INumfmtItem>>;
    refModel: IRefItem[];
}

export const INumfmtService = createIdentifier<INumfmtService>('INumfmtService');
runOnLifecycle(LifecycleStages.Rendered, INumfmtService);
