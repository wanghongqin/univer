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

import type { Univer } from '@univerjs/core';
import {
    DisposableCollection,
    ICommandService,
    IUniverInstanceService,
    RANGE_TYPE,
    toDisposable,
    UniverPermissionService,
} from '@univerjs/core';
import {
    NORMAL_SELECTION_PLUGIN_NAME,
    SelectionManagerService,
    SetBoldCommand,
    SetRangeValuesMutation,
    SetStyleCommand,
    SheetPermissionService,
} from '@univerjs/sheets';
import { Injector } from '@wendellhu/redi';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { BoldMenuItemFactory } from '../menu';
import { createMenuTestBed } from './create-menu-test-bed';

describe('Test menu items', () => {
    let univer: Univer;
    let get: Injector['get'];
    let commandService: ICommandService;
    let disposableCollection: DisposableCollection;

    beforeEach(() => {
        const testBed = createMenuTestBed();

        univer = testBed.univer;
        get = testBed.get;

        commandService = get(ICommandService);
        commandService.registerCommand(SetBoldCommand);
        commandService.registerCommand(SetStyleCommand);
        commandService.registerCommand(SetRangeValuesMutation);

        disposableCollection = new DisposableCollection();
    });

    afterEach(() => {
        univer.dispose();

        disposableCollection.dispose();
    });

    it('Test bold menu item', async () => {
        let activated = false;
        let disabled = false;
        const sheetPermissionService = get(SheetPermissionService);
        const univerPermissionService = get(UniverPermissionService);
        const univerInstanceService = get(IUniverInstanceService);
        const workbook = univerInstanceService.getCurrentUniverSheetInstance();
        const worksheet = workbook.getActiveSheet();
        const menuItem = get(Injector).invoke(BoldMenuItemFactory);
        disposableCollection.add(toDisposable(menuItem.activated$!.subscribe((v: boolean) => (activated = v))));
        disposableCollection.add(toDisposable(menuItem.disabled$!.subscribe((v: boolean) => (disabled = v))));
        expect(activated).toBeFalsy();
        expect(disabled).toBeFalsy();

        const selectionManager = get(SelectionManagerService);
        selectionManager.setCurrentSelection({
            pluginName: NORMAL_SELECTION_PLUGIN_NAME,
            unitId: 'test',
            sheetId: 'sheet1',
        });
        selectionManager.add([
            {
                range: { startRow: 0, startColumn: 0, endColumn: 0, endRow: 0, rangeType: RANGE_TYPE.NORMAL },
                primary: {
                    startRow: 0,
                    startColumn: 0,
                    endColumn: 0,
                    endRow: 0,
                    actualRow: 0,
                    actualColumn: 0,
                    isMerged: false,
                    isMergedMainCell: false,
                },
                style: null,
            },
        ]);

        expect(await commandService.executeCommand(SetBoldCommand.id)).toBeTruthy();
        expect(activated).toBe(true);

        expect(sheetPermissionService.getSheetEditable(workbook.getUnitId(), worksheet.getSheetId())).toBe(true);
        sheetPermissionService.setSheetEditable(false, workbook.getUnitId(), worksheet.getSheetId());
        expect(sheetPermissionService.getSheetEditable()).toBe(false);
        sheetPermissionService.setSheetEditable(true, workbook.getUnitId(), worksheet.getSheetId());
        univerPermissionService.setEditable(workbook.getUnitId(), false);
        expect(sheetPermissionService.getSheetEditable()).toBe(false);
        expect(univerPermissionService.getEditable()).toBe(false);
        univerPermissionService.setEditable(workbook.getUnitId(), true);
        expect(univerPermissionService.getEditable()).toBe(true);
        expect(sheetPermissionService.getSheetEditable()).toBe(true);
    });
});
