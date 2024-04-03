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

import type { ICellData, ICommand, IMutationInfo, IObjectMatrixPrimitiveType, IRange } from '@univerjs/core';
import {
    BooleanNumber,
    CommandType,
    Dimension,
    ICommandService,
    ILogService,
    IUndoRedoService,
    IUniverInstanceService,
    Range,
    sequenceExecute,
} from '@univerjs/core';
import type { IAccessor } from '@wendellhu/redi';

import type {
    IInsertRangeMutationParams,
    IInsertRowMutationParams,
    IRemoveRowsMutationParams,
} from '../../basics/interfaces/mutation-interface';
import { SelectionManagerService } from '../../services/selection-manager.service';
import { SheetInterceptorService } from '../../services/sheet-interceptor/sheet-interceptor.service';
import { InsertRowMutation, InsertRowMutationUndoFactory } from '../mutations/insert-row-col.mutation';
import { RemoveRowMutation } from '../mutations/remove-row-col.mutation';
import { getInsertRangeMutations } from '../utils/handle-range-mutation';
import { followSelectionOperation } from './utils/selection-utils';

export interface InsertRangeMoveDownCommandParams {
    range: IRange;
}

export const InsertRangeMoveDownCommandId = 'sheet.command.insert-range-move-down';
/**
 * The command to insert range.
 */
export const InsertRangeMoveDownCommand: ICommand = {
    type: CommandType.COMMAND,
    id: 'sheet.command.insert-range-move-down',

    handler: async (accessor: IAccessor, params?: InsertRangeMoveDownCommandParams) => {
        const commandService = accessor.get(ICommandService);
        const undoRedoService = accessor.get(IUndoRedoService);
        const univerInstanceService = accessor.get(IUniverInstanceService);
        const logService = accessor.get(ILogService);
        const selectionManagerService = accessor.get(SelectionManagerService);
        const sheetInterceptorService = accessor.get(SheetInterceptorService);

        if (selectionManagerService.isOverlapping()) {
            // TODO@Dushusir: use Dialog after Dialog component completed
            logService.error('Cannot use that command on overlapping selections.');
            return false;
        }

        const unitId = univerInstanceService.getCurrentUniverSheetInstance().getUnitId();
        const subUnitId = univerInstanceService
            .getCurrentUniverSheetInstance()

            .getActiveSheet()
            .getSheetId();
        let range = params?.range;
        if (!range) {
            range = selectionManagerService.getLast()?.range;
        }
        if (!range) return false;

        const workbook = univerInstanceService.getUniverSheetInstance(unitId);
        if (!workbook) return false;
        const worksheet = workbook.getSheetBySheetId(subUnitId);
        if (!worksheet) return false;

        const redoMutations: IMutationInfo[] = [];
        const undoMutations: IMutationInfo[] = [];

        const cellMatrix = worksheet.getCellMatrix();
        const dataRange = cellMatrix.getDataRange();
        const moveSlice = cellMatrix.getSlice(dataRange.startRow, dataRange.endRow, range.startColumn, range.endColumn);
        const sliceMaxRow = moveSlice.getDataRange().endRow;
        const insertRowCount = Math.max(sliceMaxRow + (range.endRow - range.startRow + 1) - dataRange.endRow, 0);

        if (insertRowCount > 0) {
            const anchorRow = range.startRow - 1;
            const height = worksheet.getRowHeight(anchorRow);

            const insertRowParams: IInsertRowMutationParams = {
                unitId,
                subUnitId,
                range: {
                    startRow: dataRange.endRow + 1,
                    endRow: dataRange.endRow + insertRowCount,
                    startColumn: dataRange.startColumn,
                    endColumn: dataRange.endColumn,
                },
                rowInfo: new Array(insertRowCount).fill(undefined).map(() => ({
                    h: height,
                    hd: BooleanNumber.FALSE,
                })),
            };

            redoMutations.push({
                id: InsertRowMutation.id,
                params: insertRowParams,
            });

            const undoRowInsertionParams: IRemoveRowsMutationParams = InsertRowMutationUndoFactory(
                accessor,
                insertRowParams
            );

            undoMutations.push({ id: RemoveRowMutation.id, params: undoRowInsertionParams });
        }

        // to keep style.
        const cellValue: IObjectMatrixPrimitiveType<ICellData> = {};
        Range.foreach(range, (row, col) => {
            const cell = worksheet.getCell(row, col);
            if (!cell) {
                return;
            }
            if (!cellValue[row]) {
                cellValue[row] = {};
            }
            cellValue[row][col] = { s: cell.s };
        });
        const insertRangeMutationParams: IInsertRangeMutationParams = {
            range,
            subUnitId,
            unitId,
            shiftDimension: Dimension.ROWS,
            cellValue,
        };

        const { redo: insertRangeRedo, undo: insertRangeUndo } = getInsertRangeMutations(
            accessor,
            insertRangeMutationParams
        );

        redoMutations.push(...insertRangeRedo);

        undoMutations.push(...insertRangeUndo);

        const sheetInterceptor = sheetInterceptorService.onCommandExecute({
            id: InsertRangeMoveDownCommand.id,
            params: { range } as InsertRangeMoveDownCommandParams,
        });
        redoMutations.push(...sheetInterceptor.redos);
        redoMutations.push(followSelectionOperation(range, workbook, worksheet));
        undoMutations.push(...sheetInterceptor.undos);

        // execute do mutations and add undo mutations to undo stack if completed
        const result = sequenceExecute(redoMutations, commandService);
        if (result) {
            undoRedoService.pushUndoRedo({
                unitID: unitId,
                undoMutations: undoMutations.reverse(),
                redoMutations,
            });

            return true;
        }

        return false;
    },
    // all subsequent mutations should succeed inorder to make the whole process succeed
    // Promise.all([]).then(() => true),
};
