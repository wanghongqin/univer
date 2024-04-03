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

import { describe, expect, it } from 'vitest';

import { FUNCTION_NAMES_MATH } from '../../function-names';
import { Power } from '..';
import { NumberValueObject, StringValueObject } from '../../../../engine/value-object/primitive-object';
import { ArrayValueObject, transformToValue, transformToValueObject } from '../../../../engine/value-object/array-value-object';
import { ErrorType } from '../../../../basics/error-type';

describe('Test power function', () => {
    const textFunction = new Power(FUNCTION_NAMES_MATH.POWER);

    describe('Power', () => {
        it('Number is single cell, power is single cell', () => {
            const number = NumberValueObject.create(5);
            const power = NumberValueObject.create(2);
            const result = textFunction.calculate(number, power);
            expect(result.getValue()).toBe(25);
        });
        it('Number is single string number, power is single string number', () => {
            const number = new StringValueObject('5');
            const power = new StringValueObject('2');
            const result = textFunction.calculate(number, power);
            expect(result.getValue()).toBe(25);
        });

        it('Number is single cell, power is array', () => {
            const number = NumberValueObject.create(2);
            const power = ArrayValueObject.create({
                calculateValueList: transformToValueObject([
                    [1, ' ', 1.23, true, false, null],
                    [0, '100', '2.34', 'test', -3, ErrorType.VALUE],
                ]),
                rowCount: 2,
                columnCount: 6,
                unitId: '',
                sheetId: '',
                row: 0,
                column: 0,
            });
            const result = textFunction.calculate(number, power);
            expect(transformToValue(result.getArrayValue())).toStrictEqual([
                [2, ErrorType.VALUE, 2.3456698984637576, 2, 1, 1],
                [1, 1.2676506002282294e+30, 5.063026375881119, ErrorType.VALUE, 0.125, ErrorType.VALUE],
            ]);
        });

        it('Number is array, power is single cell', () => {
            const number = ArrayValueObject.create({
                calculateValueList: transformToValueObject([
                    [1, ' ', 1.23, true, false, null],
                    [0, '100', '2.34', 'test', -3, ErrorType.VALUE],
                ]),
                rowCount: 2,
                columnCount: 6,
                unitId: '',
                sheetId: '',
                row: 0,
                column: 0,
            });
            const power = NumberValueObject.create(2);
            const result = textFunction.calculate(number, power);
            expect(transformToValue(result.getArrayValue())).toStrictEqual([
                [1, ErrorType.VALUE, 1.5128999999999999, 1, 0, 0],
                [0, 10000, 5.4755999999999991, ErrorType.VALUE, 9, ErrorType.VALUE],
            ]);
        });

        it('Number is array, power is array', () => {
            const number = ArrayValueObject.create({
                calculateValueList: transformToValueObject([
                    [1, ' ', 1.23, true, false, null],
                    [0, '100', '2.34', 'test', -3, ErrorType.VALUE],
                ]),
                rowCount: 2,
                columnCount: 6,
                unitId: '',
                sheetId: '',
                row: 0,
                column: 0,
            });
            const power = ArrayValueObject.create({
                calculateValueList: transformToValueObject([
                    [1],
                    [2],
                    [3],
                ]),
                rowCount: 3,
                columnCount: 1,
                unitId: '',
                sheetId: '',
                row: 0,
                column: 0,
            });
            const result = textFunction.calculate(number, power);
            expect(transformToValue(result.getArrayValue())).toStrictEqual([
                [1, ErrorType.VALUE, 1.23, 1, 0, 0],
                [0, 10000, 5.4755999999999991, ErrorType.VALUE, 9, ErrorType.VALUE],
                [ErrorType.NA, ErrorType.NA, ErrorType.NA, ErrorType.NA, ErrorType.NA, ErrorType.NA],
            ]);
        });
    });
});
