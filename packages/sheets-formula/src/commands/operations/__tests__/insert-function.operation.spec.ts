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

import type { ICellData, Nullable, Univer } from '@univerjs/core';
import { ICommandService, IUniverInstanceService, RANGE_TYPE, RedoCommand, UndoCommand } from '@univerjs/core';
import {
    NORMAL_SELECTION_PLUGIN_NAME,
    SelectionManagerService,
    SetRangeValuesCommand,
    SetRangeValuesMutation,
    SetSelectionsOperation,
} from '@univerjs/sheets';
import type { Injector } from '@wendellhu/redi';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { InsertFunctionCommand } from '../../commands/insert-function.command';
import type { IInsertFunctionOperationParams } from '../insert-function.operation';
import {
    InsertFunctionOperation,
    isMultiRowsColumnsRange,
    isNumberCell,
    isSingleCell,
} from '../insert-function.operation';
import { createCommandTestBed } from './create-command-test-bed';

describe('Test insert function operation', () => {
    let univer: Univer;
    let get: Injector['get'];
    let commandService: ICommandService;

    beforeEach(() => {
        const testBed = createCommandTestBed();
        univer = testBed.univer;
        get = testBed.get;

        commandService = get(ICommandService);
        commandService.registerCommand(InsertFunctionOperation);
        commandService.registerCommand(InsertFunctionCommand);
        commandService.registerCommand(SetRangeValuesCommand);
        commandService.registerCommand(SetRangeValuesMutation);
        commandService.registerCommand(SetSelectionsOperation);
    });

    afterEach(() => {
        univer.dispose();
    });

    describe('insert function', () => {
        describe('correct situations', () => {
            it('insert function, match the data range above', async () => {
                const selectionManager = get(SelectionManagerService);
                selectionManager.setCurrentSelection({
                    pluginName: NORMAL_SELECTION_PLUGIN_NAME,
                    unitId: 'test',
                    sheetId: 'sheet1',
                });
                // B3
                selectionManager.add([
                    {
                        range: { startRow: 2, startColumn: 1, endRow: 2, endColumn: 1, rangeType: RANGE_TYPE.NORMAL },
                        primary: null,
                        style: null,
                    },
                ]);

                function getValue(): Nullable<ICellData> {
                    return get(IUniverInstanceService)
                        .getUniverSheetInstance('test')
                        ?.getSheetBySheetId('sheet1')
                        ?.getRange(2, 1, 2, 1)
                        .getValue();
                }
                const params: IInsertFunctionOperationParams = {
                    value: 'SUM',
                };

                expect(await commandService.executeCommand(InsertFunctionOperation.id, params)).toBeTruthy();
                expect(getValue()?.f).toStrictEqual('=SUM(B2)');
                // undo
                expect(await commandService.executeCommand(UndoCommand.id)).toBeTruthy();
                expect(getValue()).toStrictEqual({});
                // redo
                expect(await commandService.executeCommand(RedoCommand.id)).toBeTruthy();
                expect(getValue()?.f).toStrictEqual('=SUM(B2)');

                // Restore the original data
                expect(await commandService.executeCommand(UndoCommand.id)).toBeTruthy();
            });

            it('insert function, match the data range left', async () => {
                const selectionManager = get(SelectionManagerService);
                selectionManager.setCurrentSelection({
                    pluginName: NORMAL_SELECTION_PLUGIN_NAME,
                    unitId: 'test',
                    sheetId: 'sheet1',
                });
                // C2
                selectionManager.add([
                    {
                        range: { startRow: 1, startColumn: 2, endRow: 1, endColumn: 2, rangeType: RANGE_TYPE.NORMAL },
                        primary: null,
                        style: null,
                    },
                ]);

                function getValue(): Nullable<ICellData> {
                    return get(IUniverInstanceService)
                        .getUniverSheetInstance('test')
                        ?.getSheetBySheetId('sheet1')
                        ?.getRange(1, 2, 1, 2)
                        .getValue();
                }
                const params: IInsertFunctionOperationParams = {
                    value: 'SUM',
                };

                expect(await commandService.executeCommand(InsertFunctionOperation.id, params)).toBeTruthy();
                expect(getValue()?.f).toStrictEqual('=SUM(B2)');
                // undo
                expect(await commandService.executeCommand(UndoCommand.id)).toBeTruthy();
                expect(getValue()).toStrictEqual({});
                // redo
                expect(await commandService.executeCommand(RedoCommand.id)).toBeTruthy();
                expect(getValue()?.f).toStrictEqual('=SUM(B2)');

                // Restore the original data
                expect(await commandService.executeCommand(UndoCommand.id)).toBeTruthy();
            });
        });

        describe('fault situations', () => {
            it('will not apply when there is no selected ranges', async () => {
                const result = await commandService.executeCommand(InsertFunctionOperation.id);
                expect(result).toBeFalsy();
            });
        });

        describe('function isNumberCell', () => {
            it('should return true when cell type is number', () => {
                const cell = { t: 2, v: 1 };
                expect(isNumberCell(cell)).toBeTruthy();
            });

            it('should return true when cell is number', () => {
                const cell = { v: 1 };
                expect(isNumberCell(cell)).toBeTruthy();
            });

            it('should return false when cell is string number', () => {
                const cell = { v: '1' };
                expect(isNumberCell(cell)).toBeFalsy();
            });

            it('should return false when cell is string', () => {
                const cell = { v: 'test' };
                expect(isNumberCell(cell)).toBeFalsy();
            });

            it('should return false when cell is null', () => {
                const cell = null;
                expect(isNumberCell(cell)).toBeFalsy();
            });

            it('should return false when cell is undefined', () => {
                const cell = undefined;
                expect(isNumberCell(cell)).toBeFalsy();
            });

            it('should return false when cell is empty object', () => {
                const cell = {};
                expect(isNumberCell(cell)).toBeFalsy();
            });
            it('should return true when cell is rich text number', () => {
                const cell = {
                    p: {
                        id: 'rich1',
                        documentStyle: {},
                        body: {
                            dataStream: '111/r/n',
                        },
                    },
                };
                expect(isNumberCell(cell)).toBeTruthy();
            });
            it('should return true when cell is rich text', () => {
                const cell = {
                    p: {
                        id: 'rich1',
                        documentStyle: {},
                        body: {
                            dataStream: 'rich/r/n',
                        },
                    },
                };
                expect(isNumberCell(cell)).toBeFalsy();
            });
        });

        describe('function isSingleCell', () => {
            it('should return true when startRow === endRow and startColumn === endColumn', () => {
                const range = { startRow: 1, startColumn: 1, endRow: 1, endColumn: 1 };
                expect(isSingleCell(range)).toBeTruthy();
            });

            it('should return false when startRow !== endRow', () => {
                const range = { startRow: 1, startColumn: 1, endRow: 2, endColumn: 1 };
                expect(isSingleCell(range)).toBeFalsy();
            });

            it('should return false when startColumn !== endColumn', () => {
                const range = { startRow: 1, startColumn: 1, endRow: 1, endColumn: 2 };
                expect(isSingleCell(range)).toBeFalsy();
            });
        });
        describe('function isMultiRowsColumnsRange', () => {
            it('should return true when startRow !== endRow and startColumn !== endColumn', () => {
                const range = { startRow: 1, startColumn: 1, endRow: 2, endColumn: 2 };
                expect(isMultiRowsColumnsRange(range)).toBeTruthy();
            });

            it('should return false when startRow === endRow', () => {
                const range = { startRow: 1, startColumn: 1, endRow: 1, endColumn: 2 };
                expect(isMultiRowsColumnsRange(range)).toBeFalsy();
            });

            it('should return false when startColumn === endColumn', () => {
                const range = { startRow: 1, startColumn: 1, endRow: 2, endColumn: 1 };
                expect(isMultiRowsColumnsRange(range)).toBeFalsy();
            });
        });
    });
});
