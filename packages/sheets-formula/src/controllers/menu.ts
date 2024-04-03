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

import { UniverInstanceType } from '@univerjs/core';
import { getCurrentSheetDisabled$ } from '@univerjs/sheets';
import { PASTE_SPECIAL_MENU_ID } from '@univerjs/sheets-ui';
import type { IMenuItem } from '@univerjs/ui';
import { getMenuHiddenObservable, IClipboardInterfaceService, MenuGroup, MenuItemType, MenuPosition } from '@univerjs/ui';
import type { IAccessor } from '@wendellhu/redi';
import { Observable } from 'rxjs';

import { SheetOnlyPasteFormulaCommand } from '../commands/commands/formula-clipboard.command';
import { InsertFunctionOperation } from '../commands/operations/insert-function.operation';
import { MoreFunctionsOperation } from '../commands/operations/more-functions.operation';

export function InsertFunctionMenuItemFactory(accessor: IAccessor): IMenuItem {
    return {
        id: InsertFunctionOperation.id,
        icon: 'FunctionSingle',
        tooltip: 'formula.insert.tooltip',
        group: MenuGroup.TOOLBAR_FORMULAS_INSERT,
        type: MenuItemType.SELECTOR,
        positions: [MenuPosition.TOOLBAR_START],
        selections: [
            {
                label: 'SUM',
                value: 'SUM',
                icon: 'SumSingle',
            },
            {
                label: 'AVERAGE',
                value: 'AVERAGE',
                icon: 'AvgSingle',
            },
            {
                label: 'COUNT',
                value: 'COUNT',
                icon: 'CntSingle',
            },
            {
                label: 'MAX',
                value: 'MAX',
                icon: 'MaxSingle',
            },
            {
                label: 'MIN',
                value: 'MIN',
                icon: 'MinSingle',
            },
        ],
        hidden$: getMenuHiddenObservable(accessor, UniverInstanceType.SHEET),
        disabled$: getCurrentSheetDisabled$(accessor),
    };
}

export function MoreFunctionsMenuItemFactory(): IMenuItem {
    return {
        id: MoreFunctionsOperation.id,
        title: 'formula.insert.more',
        positions: InsertFunctionOperation.id,
        type: MenuItemType.BUTTON,
    };
}

function menuClipboardDisabledObservable(injector: IAccessor): Observable<boolean> {
    return new Observable((subscriber) => subscriber.next(!injector.get(IClipboardInterfaceService).supportClipboard));
}

export function PasteFormulaMenuItemFactory(accessor: IAccessor): IMenuItem {
    return {
        id: SheetOnlyPasteFormulaCommand.id,
        type: MenuItemType.BUTTON,
        title: 'formula.operation.pasteFormula',
        positions: [PASTE_SPECIAL_MENU_ID],
        disabled$: menuClipboardDisabledObservable(accessor),
    };
}
