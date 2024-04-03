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

import { ErrorType } from '../../../basics/error-type';
import { expandArrayValueObject } from '../../../engine/utils/array-object';
import type { ArrayValueObject } from '../../../engine/value-object/array-value-object';
import { type BaseValueObject, ErrorValueObject } from '../../../engine/value-object/base-value-object';
import { BaseFunction } from '../../base-function';

export class Iferror extends BaseFunction {
    override calculate(value: BaseValueObject, valueIfError: BaseValueObject) {
        if (value == null || valueIfError == null) {
            return ErrorValueObject.create(ErrorType.NA);
        }

        if (value.isError()) {
            return value;
        }

        if (valueIfError.isError()) {
            return valueIfError;
        }

        if (!value.isArray()) {
            return value.isError() ? valueIfError : value;
        }

        // get max row length
        const maxRowLength = Math.max(
            value.isArray() ? (value as ArrayValueObject).getRowCount() : 1,
            valueIfError.isArray() ? (valueIfError as ArrayValueObject).getRowCount() : 1
        );

        // get max column length
        const maxColumnLength = Math.max(
            value.isArray() ? (value as ArrayValueObject).getColumnCount() : 1,
            valueIfError.isArray() ? (valueIfError as ArrayValueObject).getColumnCount() : 1
        );

        const valueArray = expandArrayValueObject(maxRowLength, maxColumnLength, value);
        const valueIfErrorArray = expandArrayValueObject(maxRowLength, maxColumnLength, valueIfError);

        valueArray.iterator((value, rowIndex, columnIndex) => {
            if (value?.isError()) {
                valueArray.set(rowIndex, columnIndex, valueIfErrorArray.get(rowIndex, columnIndex));
            }
        });

        return valueArray;
    }
}
