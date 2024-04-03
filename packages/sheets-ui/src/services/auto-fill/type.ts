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

import type { Direction, ICellData, IMutationInfo, IRange, Nullable } from '@univerjs/core';

export enum AutoFillHookType {
    Append = 'APPEND',
    Default = 'DEFAULT',
    Only = 'ONLY',
}

export interface IAutoFillLocation {
    source: IRange;
    target: IRange;
    unitId: string;
    subUnitId: string;
}
export interface ISheetAutoFillHook {
    id: string;
    priority?: number;
    type?: AutoFillHookType;
    disable?: (location: IAutoFillLocation, direction: Direction, applyType: APPLY_TYPE) => boolean;
    onBeforeFillData?(location: IAutoFillLocation, direction: Direction): boolean | void;
    onFillData?(
        location: IAutoFillLocation,
        direction: Direction,
        applyType: APPLY_TYPE
    ): {
        undos: IMutationInfo[];
        redos: IMutationInfo[];
    };
    onAfterFillData?(location: IAutoFillLocation, direction: Direction, applyType: APPLY_TYPE): boolean | void;
}

export enum DATA_TYPE {
    NUMBER = 'number',
    DATE = 'date',
    EXTEND_NUMBER = 'extendNumber',
    CHN_NUMBER = 'chnNumber',
    CHN_WEEK2 = 'chnWeek2',
    CHN_WEEK3 = 'chnWeek3',
    LOOP_SERIES = 'loopSeries',
    FORMULA = 'formula',
    OTHER = 'other',
}

export interface ICopyDataPiece {
    [key: string]: ICopyDataInType[];
}

export interface ICopyDataInType {
    data: Array<Nullable<ICellData>>;
    index: ICopyDataInTypeIndexInfo;
}

export type ICopyDataInTypeIndexInfo = number[];

export interface IAutoFillRule {
    type: string;
    match: (cellData: Nullable<ICellData>) => boolean;
    isContinue: (prev: IRuleConfirmedData, cur: Nullable<ICellData>) => boolean;
    applyFunctions?: APPLY_FUNCTIONS;
    priority: number;
}

export interface IMutations {
    redos: IMutationInfo[];
    undos: IMutationInfo[];
}

export interface IRuleConfirmedData {
    type?: string;
    cellData: Nullable<ICellData>;
}

export type APPLY_FUNCTIONS = {
    [key in APPLY_TYPE]?: (
        dataWithIndex: ICopyDataInType,
        len: number,
        direction: Direction,
        copyDataPiece: ICopyDataPiece
    ) => Array<Nullable<ICellData>>;
};

export enum APPLY_TYPE {
    COPY = '0',
    SERIES = '1',
    ONLY_FORMAT = '2',
    NO_FORMAT = '3',
}
