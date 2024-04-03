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
import type { BaseValueObject } from '../../../engine/value-object/base-value-object';
import { ErrorValueObject } from '../../../engine/value-object/base-value-object';
import { NumberValueObject } from '../../../engine/value-object/primitive-object';
import { BaseFunction } from '../../base-function';

export class Acot extends BaseFunction {
    override calculate(variant: BaseValueObject) {
        if (variant == null) {
            return ErrorValueObject.create(ErrorType.NA);
        }

        if (variant.isString()) {
            variant = variant.convertToNumberObjectValue();
        }

        if (variant.isError()) {
            return variant;
        }

        if ((variant as BaseValueObject).isArray()) {
            return (variant as BaseValueObject).map((currentValue) => {
                if (currentValue.isError()) {
                    return currentValue;
                }
                return acot(currentValue as BaseValueObject);
            });
        }

        return acot(variant as BaseValueObject);
    }
}

function acot(num: BaseValueObject) {
    let currentValue = num.getValue();

    if (num.isBoolean()) {
        currentValue = currentValue ? 1 : 0;
    }

    if (!Number.isFinite(currentValue)) {
        return ErrorValueObject.create(ErrorType.VALUE);
    }

    const result = Math.atan(1 / Number(currentValue));

    if (Number.isNaN(result)) {
        return ErrorValueObject.create(ErrorType.VALUE);
    }

    return NumberValueObject.create(result);
}
