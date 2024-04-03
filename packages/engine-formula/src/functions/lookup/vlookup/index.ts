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

import type { Nullable } from '@univerjs/core';
import { ErrorType } from '../../../basics/error-type';
import { createNewArray, expandArrayValueObject } from '../../../engine/utils/array-object';
import type { ArrayValueObject } from '../../../engine/value-object/array-value-object';
import type { BaseValueObject } from '../../../engine/value-object/base-value-object';
import { ErrorValueObject } from '../../../engine/value-object/base-value-object';
import { BooleanValueObject } from '../../../engine/value-object/primitive-object';
import { BaseFunction } from '../../base-function';
import { isSingleValueObject } from '../../../engine/utils/value-object';

export class Vlookup extends BaseFunction {
    override calculate(
        lookupValue: BaseValueObject,
        tableArray: BaseValueObject,
        colIndexNum: BaseValueObject,
        rangeLookup?: BaseValueObject
    ) {
        if (lookupValue == null || tableArray == null || colIndexNum == null) {
            return ErrorValueObject.create(ErrorType.NA);
        }

        if (lookupValue.isError()) {
            return lookupValue;
        }

        if (tableArray.isError()) {
            return ErrorValueObject.create(ErrorType.REF);
        }

        if (!tableArray.isArray()) {
            return ErrorValueObject.create(ErrorType.VALUE);
        }

        if (colIndexNum.isError()) {
            return ErrorValueObject.create(ErrorType.NA);
        }

        if (rangeLookup?.isError()) {
            return ErrorValueObject.create(ErrorType.NA);
        }

        rangeLookup = rangeLookup ?? BooleanValueObject.create(true);

        // When neither lookupValue nor rangeLookup is an array, but colIndexNum is an array, expansion is allowed based on the value of colIndexNum. However, if an error is encountered in subsequent matching, the first error needs to be returned (not the entire array)
        // Otherwise colIndexNum takes the first value

        if (isSingleValueObject(lookupValue) && isSingleValueObject(rangeLookup) && colIndexNum.isArray()) {
            lookupValue = lookupValue.isArray() ? (lookupValue as ArrayValueObject).getFirstCell() : lookupValue;

            const rangeLookupValue = this.getZeroOrOneByOneDefault(rangeLookup);

            if (rangeLookupValue == null) {
                return ErrorValueObject.create(ErrorType.VALUE);
            }

            let errorValue: BaseValueObject | undefined;
            const result: BaseValueObject[][] = [];

            (colIndexNum as ArrayValueObject).iterator((colIndexNumValueObject: Nullable<BaseValueObject>, rowIndex: number, columnIndex: number) => {
                if (colIndexNumValueObject === null || colIndexNumValueObject === undefined) {
                    errorValue = ErrorValueObject.create(ErrorType.VALUE);
                    return false;
                }

                const searchObject = this._handleTableArray(lookupValue, tableArray, colIndexNumValueObject, rangeLookupValue);

                if (searchObject.isError()) {
                    errorValue = searchObject;
                    return false;
                }

                if (result[rowIndex] === undefined) {
                    result[rowIndex] = [];
                }

                result[rowIndex][columnIndex] = searchObject;
            });

            if (errorValue) {
                return errorValue;
            }

            return createNewArray(result, result.length, result[0].length, this.unitId || '', this.subUnitId || '');
        }

        // max row length
        const maxRowLength = Math.max(
            lookupValue.isArray() ? (lookupValue as ArrayValueObject).getRowCount() : 1,
            rangeLookup.isArray() ? (rangeLookup as ArrayValueObject).getRowCount() : 1
        );

        // max column length
        const maxColumnLength = Math.max(
            lookupValue.isArray() ? (lookupValue as ArrayValueObject).getColumnCount() : 1,
            rangeLookup.isArray() ? (rangeLookup as ArrayValueObject).getColumnCount() : 1
        );

        const lookupValueArray = expandArrayValueObject(maxRowLength, maxColumnLength, lookupValue);
        const rangeLookupArray = expandArrayValueObject(maxRowLength, maxColumnLength, rangeLookup);

        return lookupValueArray.map((lookupValue, rowIndex, columnIndex) => {
            if (lookupValue.isError()) {
                return lookupValue;
            }

            const rangeLookupValueObject = rangeLookupArray.get(rowIndex, columnIndex);

            if (rangeLookupValueObject == null) {
                return ErrorValueObject.create(ErrorType.VALUE);
            }

            if (rangeLookupValueObject.isError()) {
                return rangeLookupValueObject;
            }

            const rangeLookupValue = this.getZeroOrOneByOneDefault(rangeLookupValueObject);

            if (rangeLookupValue == null) {
                return ErrorValueObject.create(ErrorType.VALUE);
            }

            return this._handleTableArray(lookupValue, tableArray, colIndexNum, rangeLookupValue);
        });
    }

    private _handleTableArray(lookupValue: BaseValueObject, tableArray: BaseValueObject, colIndexNum: BaseValueObject, rangeLookupValue: number) {
        const colIndexNumValue = this.getIndexNumValue(colIndexNum);

        if (colIndexNumValue instanceof ErrorValueObject) {
            return colIndexNumValue;
        }

        const searchArray = (tableArray as ArrayValueObject).slice(undefined, [0, 1]);

        if (searchArray == null) {
            return ErrorValueObject.create(ErrorType.VALUE);
        }

        const resultArray = (tableArray as ArrayValueObject).slice(undefined, [colIndexNumValue - 1, colIndexNumValue]);

        // The error reporting priority of lookupValue in Excel is higher than colIndexNum. It is required to execute the query from the first column first, and then take the value of colIndexNum column from the query result.
        // Here we will first throw the colIndexNum error to avoid unnecessary queries and improve performance.
        if (resultArray == null) {
            return ErrorValueObject.create(ErrorType.REF);
        }

        return this._handleSingleObject(lookupValue, searchArray, resultArray, rangeLookupValue);
    }

    private _handleSingleObject(
        value: BaseValueObject,
        searchArray: ArrayValueObject,
        resultArray: ArrayValueObject,
        rangeLookupValue: number
    ) {
        if (rangeLookupValue === 0) {
            return this.equalSearch(value, searchArray, resultArray);
        }

        return this.binarySearch(value, searchArray, resultArray);
    }
}
