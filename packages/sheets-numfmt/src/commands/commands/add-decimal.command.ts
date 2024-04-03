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
import { CommandType, ICommandService, IUniverInstanceService, Range } from '@univerjs/core';
import { INumfmtService, SelectionManagerService } from '@univerjs/sheets';
import type { IAccessor } from '@wendellhu/redi';

import { getDecimalFromPattern, setPatternDecimal } from '../../utils/decimal';
import type { ISetNumfmtCommandParams } from './set-numfmt.command';
import { SetNumfmtCommand } from './set-numfmt.command';

export const AddDecimalCommand: ICommand = {
    id: 'sheet.command.numfmt.add.decimal.command',
    type: CommandType.COMMAND,
    handler: async (accessor: IAccessor) => {
        const commandService = accessor.get(ICommandService);
        const selectionManagerService = accessor.get(SelectionManagerService);
        const numfmtService = accessor.get(INumfmtService);
        const univerInstanceService = accessor.get(IUniverInstanceService);

        const selections = selectionManagerService.getSelections();
        if (!selections || !selections.length) {
            return false;
        }
        const workbook = univerInstanceService.getCurrentUniverSheetInstance();
        const sheet = workbook.getActiveSheet();
        const unitId = workbook.getUnitId();
        const subUnitId = sheet.getSheetId();

        let maxDecimals = 0;
        selections.forEach((selection) => {
            Range.foreach(selection.range, (row, col) => {
                const numfmtValue = numfmtService.getValue(unitId, subUnitId, row, col);
                if (!numfmtValue) {
                    return;
                }
                const decimals = getDecimalFromPattern(numfmtValue.pattern);
                maxDecimals = decimals > maxDecimals ? decimals : maxDecimals;
            });
        });
        const decimals = maxDecimals + 1;
        const defaultPattern = setPatternDecimal(`0${decimals > 0 ? '.0' : ''}`, decimals);
        const values: ISetNumfmtCommandParams['values'] = [];

        selections.forEach((selection) => {
            Range.foreach(selection.range, (row, col) => {
                const numfmtValue = numfmtService.getValue(unitId, subUnitId, row, col);
                if (!numfmtValue) {
                    values.push({
                        row,
                        col,
                        pattern: defaultPattern,
                    });
                } else {
                    const decimals = getDecimalFromPattern(numfmtValue.pattern);
                    const pattern = setPatternDecimal(numfmtValue.pattern, decimals + 1);
                    pattern !== numfmtValue.pattern &&
                        values.push({
                            row,
                            col,
                            pattern,
                        });
                }
            });
        });
        if (values.length) {
            const result = await commandService.executeCommand(SetNumfmtCommand.id, { values });
            return result;
        }
        return false;
    },
};
