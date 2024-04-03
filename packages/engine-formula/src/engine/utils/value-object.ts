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

import type { BaseReferenceObject, FunctionVariantType } from '../reference-object/base-reference-object';
import type { ArrayValueObject } from '../value-object/array-value-object';
import type { BaseValueObject } from '../value-object/base-value-object';
import { NumberValueObject } from '../value-object/primitive-object';

export function convertTonNumber(valueObject: BaseValueObject) {
    const currentValue = valueObject.getValue();
    let result = 0;
    if (currentValue) {
        result = 1;
    }
    return NumberValueObject.create(result);
}

export function isSingleValueObject(valueObject: FunctionVariantType) {
    if (valueObject.isArray() && (valueObject as ArrayValueObject).getRowCount() === 1 && (valueObject as ArrayValueObject).getColumnCount() === 1) {
        return true;
    }

    if (valueObject.isReferenceObject()) {
        if ((valueObject as BaseReferenceObject).isCell()) {
            return true;
        }

        if ((valueObject as BaseReferenceObject).getRowCount() === 1 && (valueObject as BaseReferenceObject).getColumnCount() === 1) {
            return true;
        }

        return false;
    }

    valueObject = valueObject as BaseValueObject;

    if (valueObject.isString() || valueObject.isNumber() || valueObject.isBoolean() || valueObject.isError() || valueObject.isNull()) {
        return true;
    }

    return false;
}
