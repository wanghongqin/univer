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
import { getCurrentSheetDisabled$, RemoveWorksheetMergeCommand } from '@univerjs/sheets';
import type { IMenuButtonItem, IMenuSelectorItem } from '@univerjs/ui';
import { getMenuHiddenObservable, MenuGroup, MenuItemType, MenuPosition } from '@univerjs/ui';
import type { IAccessor } from '@wendellhu/redi';

import { combineLatestWith, map } from 'rxjs';
import {
    AddWorksheetMergeAllCommand,
    AddWorksheetMergeCommand,
    AddWorksheetMergeHorizontalCommand,
    AddWorksheetMergeVerticalCommand,
} from '../../commands/commands/add-worksheet-merge.command';
import { getSheetSelectionsDisabled$ } from '../utils/selections-tools';

export function CellMergeMenuItemFactory(accessor: IAccessor): IMenuSelectorItem<string> {
    const disabled$ = getCurrentSheetDisabled$(accessor);
    const selectionsHasCross$ = getSheetSelectionsDisabled$(accessor);

    return {
        id: AddWorksheetMergeCommand.id,
        icon: 'MergeAllSingle',
        tooltip: 'toolbar.mergeCell.main',
        positions: [MenuPosition.TOOLBAR_START],
        group: MenuGroup.TOOLBAR_LAYOUT,
        type: MenuItemType.SUBITEMS,
        // selections: [...MERGE_CHILDREN],
        hidden$: getMenuHiddenObservable(accessor, UniverInstanceType.SHEET),
        disabled$: disabled$.pipe(
            combineLatestWith(selectionsHasCross$),
            map(([disable, hasCross]) => disable || hasCross)
        ),
    };
}
export function CellMergeAllMenuItemFactory(accessor: IAccessor): IMenuButtonItem<string> {
    return {
        id: AddWorksheetMergeAllCommand.id,
        type: MenuItemType.BUTTON,
        title: 'merge.all',
        icon: 'MergeAllSingle',
        positions: [AddWorksheetMergeCommand.id],
    };
}
export function CellMergeVerticalMenuItemFactory(accessor: IAccessor): IMenuButtonItem<string> {
    return {
        id: AddWorksheetMergeVerticalCommand.id,
        type: MenuItemType.BUTTON,
        title: 'merge.vertical',
        icon: 'VerticalIntegrationSingle',
        positions: [AddWorksheetMergeCommand.id],
    };
}
export function CellMergeHorizontalMenuItemFactory(accessor: IAccessor): IMenuButtonItem<string> {
    return {
        id: AddWorksheetMergeHorizontalCommand.id,
        type: MenuItemType.BUTTON,
        title: 'merge.horizontal',
        icon: 'HorizontalMergeSingle',
        positions: [AddWorksheetMergeCommand.id],
    };
}
export function CellMergeCancelMenuItemFactory(accessor: IAccessor): IMenuButtonItem<string> {
    return {
        id: RemoveWorksheetMergeCommand.id,
        type: MenuItemType.BUTTON,
        title: 'merge.cancel',
        icon: 'CancelMergeSingle',
        positions: [AddWorksheetMergeCommand.id],
    };
}
