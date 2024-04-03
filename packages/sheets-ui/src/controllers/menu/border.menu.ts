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

import { ICommandService, UniverInstanceType } from '@univerjs/core';
import type { IBorderInfo } from '@univerjs/sheets';
import { BorderStyleManagerService, getCurrentSheetDisabled$, SetBorderBasicCommand } from '@univerjs/sheets';
import type { IMenuSelectorItem } from '@univerjs/ui';
import { getMenuHiddenObservable, MenuGroup, MenuItemType, MenuPosition } from '@univerjs/ui';
import type { IAccessor } from '@wendellhu/redi';
import { Observable } from 'rxjs';

import { BORDER_LINE_CHILDREN, BORDER_PANEL_COMPONENT } from '../../components/border-panel/interface';

export function CellBorderSelectorMenuItemFactory(accessor: IAccessor): IMenuSelectorItem<IBorderInfo, IBorderInfo> {
    // const permissionService = accessor.get(IPermissionService);

    const borderStyleManagerService = accessor.get(BorderStyleManagerService);

    const disabled$ = getCurrentSheetDisabled$(accessor);

    return {
        id: SetBorderBasicCommand.id,
        icon: new Observable<string>((subscriber) => {
            const defaultIcon = 'AllBorderSingle';
            const borderManager = accessor.get(BorderStyleManagerService);

            const disposable = accessor.get(ICommandService).onCommandExecuted((c) => {
                const id = c.id;
                if (id !== SetBorderBasicCommand.id) {
                    return;
                }

                const { type } = borderManager.getBorderInfo();

                const item = BORDER_LINE_CHILDREN.find((item) => item.value === type);

                const icon = item?.icon ?? defaultIcon;

                subscriber.next(icon);
            });

            subscriber.next(defaultIcon);

            return disposable.dispose;
        }),
        group: MenuGroup.TOOLBAR_FORMAT,
        tooltip: 'toolbar.border.main',
        positions: [MenuPosition.TOOLBAR_START],
        type: MenuItemType.BUTTON_SELECTOR,
        selections: [
            {
                label: {
                    name: BORDER_PANEL_COMPONENT,
                    hoverable: false,
                },
                value$: borderStyleManagerService.borderInfo$,
            },
        ],
        value$: borderStyleManagerService.borderInfo$,
        hidden$: getMenuHiddenObservable(accessor, UniverInstanceType.SHEET),
        disabled$,
    };
}
