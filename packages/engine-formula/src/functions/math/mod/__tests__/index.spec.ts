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
import { Mod } from '..';
import { NumberValueObject, StringValueObject } from '../../../../engine/value-object/primitive-object';
import { ArrayValueObject, transformToValue, transformToValueObject } from '../../../../engine/value-object/array-value-object';
import { ErrorType } from '../../../../basics/error-type';

describe('Test mod function', () => {
    const textFunction = new Mod(FUNCTION_NAMES_MATH.MOD);

    describe('Mod', () => {
        it('Number is single cell, power is single cell', () => {
            const number = NumberValueObject.create(5);
            const power = NumberValueObject.create(2);
            const result = textFunction.calculate(number, power);
            expect(result.getValue()).toBe(1);
        });
        it('Number is single string number, power is single string number', () => {
            const number = new StringValueObject('5');
            const power = new StringValueObject('2');
            const result = textFunction.calculate(number, power);
            expect(result.getValue()).toBe(1);
        });

        it('Number is single cell, power is array', () => {
            const number = NumberValueObject.create(5);
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
                [0, ErrorType.VALUE, 0.08, 0, '#DIV/0!', '#DIV/0!'],
                ['#DIV/0!', 5, 0.32, ErrorType.VALUE, -1, ErrorType.VALUE],
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
                [1, ErrorType.VALUE, 1.23, 1, 0, 0],
                [0, 0, 0.34, ErrorType.VALUE, 1, ErrorType.VALUE],
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
                [0, ErrorType.VALUE, 0.23, 0, 0, 0],
                [0, 0, 0.34, ErrorType.VALUE, 1, ErrorType.VALUE],
                [ErrorType.NA, ErrorType.NA, ErrorType.NA, ErrorType.NA, ErrorType.NA, ErrorType.NA],
            ]);
        });
    });
});
