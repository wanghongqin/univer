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

import type { ICommand } from '@univerjs/core';
import { CommandType, ICommandService, IUniverInstanceService, LocaleService } from '@univerjs/core';
import { SelectionManagerService, SetColHiddenCommand, SetRowHiddenCommand } from '@univerjs/sheets';
import { IConfirmService } from '@univerjs/ui';
import type { IAccessor } from '@wendellhu/redi';

import { isAllColumnsCovered, isAllRowsCovered } from './utils/selection-utils';

export const HideRowConfirmCommand: ICommand = {
    id: 'sheet.command.hide-row-confirm',
    type: CommandType.COMMAND,
    handler: async (accessor: IAccessor) => {
        const selectionManagerService = accessor.get(SelectionManagerService);

        const ranges = selectionManagerService.getSelections()?.map((s) => s.range);
        if (!ranges?.length) {
            return false;
        }

        const commandService = accessor.get(ICommandService);
        const univerInstanceService = accessor.get(IUniverInstanceService);
        const workbook = univerInstanceService.getCurrentUniverSheetInstance();
        const worksheet = workbook.getActiveSheet();
        const allRowRanges = worksheet.getVisibleRows();

        if (isAllRowsCovered(allRowRanges, ranges)) {
            const confirmService = accessor.get(IConfirmService);
            const localeService = accessor.get(LocaleService);

            await confirmService.confirm({
                id: 'sheet.confirm.hide-row',
                title: {
                    title: localeService.t('info.problem'),
                },
                children: { title: localeService.t('rightClick.hideAllRowsAlert') },
                cancelText: localeService.t('button.cancel'),
                confirmText: localeService.t('button.confirm'),
            });

            return false;
        }

        await commandService.executeCommand(SetRowHiddenCommand.id);
        return true;
    },
};

export const HideColConfirmCommand: ICommand = {
    id: 'sheet.command.hide-col-confirm',
    type: CommandType.COMMAND,
    handler: async (accessor: IAccessor) => {
        const selectionManagerService = accessor.get(SelectionManagerService);

        const ranges = selectionManagerService.getSelections()?.map((s) => s.range);
        if (!ranges?.length) {
            return false;
        }

        const commandService = accessor.get(ICommandService);
        const univerInstanceService = accessor.get(IUniverInstanceService);
        const workbook = univerInstanceService.getCurrentUniverSheetInstance();
        const worksheet = workbook.getActiveSheet();
        const allColumnRanges = worksheet.getVisibleCols();

        if (isAllColumnsCovered(allColumnRanges, ranges)) {
            const confirmService = accessor.get(IConfirmService);
            const localeService = accessor.get(LocaleService);

            await confirmService.confirm({
                id: 'sheet.confirm.hide-col',
                title: {
                    title: localeService.t('info.problem'),
                },
                children: { title: localeService.t('rightClick.hideAllColumnsAlert') },
                cancelText: localeService.t('button.cancel'),
                confirmText: localeService.t('button.confirm'),
            });

            return false;
        }

        await commandService.executeCommand(SetColHiddenCommand.id);
        return true;
    },
};
