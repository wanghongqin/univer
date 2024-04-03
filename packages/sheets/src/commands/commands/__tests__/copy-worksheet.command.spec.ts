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

import type { Univer, Worksheet } from '@univerjs/core';
import { ICommandService, IUniverInstanceService, LocaleService, RedoCommand, UndoCommand } from '@univerjs/core';
import type { Injector } from '@wendellhu/redi';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import enUS from '../../../locale/en-US';
import zhCN from '../../../locale/zh-CN';
import { InsertSheetMutation } from '../../mutations/insert-sheet.mutation';
import { RemoveSheetMutation } from '../../mutations/remove-sheet.mutation';
import { SetWorksheetActiveOperation } from '../../operations/set-worksheet-active.operation';
import { CopySheetCommand } from '../copy-worksheet.command';
import { RemoveSheetCommand } from '../remove-sheet.command';
import { SetWorksheetActivateCommand } from '../set-worksheet-activate.command';
import { createCommandTestBed } from './create-command-test-bed';

describe('Test copy worksheet commands', () => {
    let univer: Univer;
    let get: Injector['get'];
    let commandService: ICommandService;

    beforeEach(() => {
        const testBed = createCommandTestBed(undefined);
        univer = testBed.univer;
        get = testBed.get;

        commandService = get(ICommandService);
        commandService.registerCommand(CopySheetCommand);
        commandService.registerCommand(InsertSheetMutation);
        commandService.registerCommand(SetWorksheetActiveOperation);
        commandService.registerCommand(SetWorksheetActivateCommand);
        commandService.registerCommand(RemoveSheetCommand);
        commandService.registerCommand(RemoveSheetMutation);

        get(LocaleService).load({ zhCN, enUS });
    });

    afterEach(() => {
        univer.dispose();
    });

    describe('copy sheet', () => {
        describe('copy the only sheet', async () => {
            it('correct situation', async () => {
                const workbook = get(IUniverInstanceService).getCurrentUniverSheetInstance();
                if (!workbook) throw new Error('This is an error');
                function getSheetCopyPart(sheet: Worksheet) {
                    const config = sheet.getConfig();
                    const { id, name, ...rest } = config;
                    return rest;
                }

                expect(
                    await commandService.executeCommand(SetWorksheetActivateCommand.id, { subUnitId: 'sheet1' })
                ).toBeTruthy();
                expect(
                    await commandService.executeCommand(CopySheetCommand.id, {
                        unitId: 'test',
                        subUnitId: 'sheet1',
                    })
                ).toBeTruthy();

                const [oldSheet, newSheet] = workbook.getSheets();

                expect(getSheetCopyPart(newSheet)).toEqual(getSheetCopyPart(oldSheet));

                // undo;
                expect(await commandService.executeCommand(UndoCommand.id)).toBeTruthy();
                expect(workbook.getSheetSize()).toBe(1);
                // redo
                expect(await commandService.executeCommand(RedoCommand.id)).toBeTruthy();
                expect(workbook.getSheetSize()).toBe(2);
                const [oldSheet2, newSheet2] = workbook.getSheets();

                expect(getSheetCopyPart(newSheet2)).toEqual(getSheetCopyPart(oldSheet2));
            });
        });
    });
});
