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
    IInsertColMutationParams,
    IInsertRangeMutationParams,
    IRemoveColMutationParams,
} from '../../basics/interfaces/mutation-interface';
import { SelectionManagerService } from '../../services/selection-manager.service';
import { SheetInterceptorService } from '../../services/sheet-interceptor/sheet-interceptor.service';
import { InsertColMutation, InsertColMutationUndoFactory } from '../mutations/insert-row-col.mutation';
import { RemoveColMutation } from '../mutations/remove-row-col.mutation';
import { getInsertRangeMutations } from '../utils/handle-range-mutation';
import { followSelectionOperation } from './utils/selection-utils';

export interface InsertRangeMoveRightCommandParams {
    range: IRange;
}
export const InsertRangeMoveRightCommandId = 'sheet.command.insert-range-move-right';
/**
 * The command to insert range.
 */
export const InsertRangeMoveRightCommand: ICommand = {
    type: CommandType.COMMAND,
    id: InsertRangeMoveRightCommandId,

    handler: async (accessor: IAccessor, params?: InsertRangeMoveRightCommandParams) => {
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
        const subUnitId = univerInstanceService.getCurrentUniverSheetInstance().getActiveSheet().getSheetId();
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
        const moveSlice = cellMatrix.getSlice(range.startRow, range.endRow, dataRange.startColumn, dataRange.endColumn);
        const sliceMaxCol = moveSlice.getDataRange().endColumn;
        const insertColCount = Math.max(
            sliceMaxCol + (range.endColumn - range.startColumn + 1) - dataRange.endColumn,
            0
        );
        if (insertColCount > 0) {
            const anchorCol = range.startColumn - 1;
            const width = worksheet.getColumnWidth(anchorCol);

            const insertColParams: IInsertColMutationParams = {
                unitId,
                subUnitId,
                range: {
                    startRow: dataRange.startRow + 1,
                    endRow: dataRange.endRow,
                    startColumn: dataRange.endColumn + 1,
                    endColumn: dataRange.endColumn + insertColCount,
                },
                colInfo: new Array(insertColCount).fill(undefined).map(() => ({
                    w: width,
                    hd: BooleanNumber.FALSE,
                })),
            };

            redoMutations.push({
                id: InsertColMutation.id,
                params: insertColParams,
            });

            const undoColInsertionParams: IRemoveColMutationParams = InsertColMutationUndoFactory(
                accessor,
                insertColParams
            );

            undoMutations.push({ id: RemoveColMutation.id, params: undoColInsertionParams });
        }

        // to keep style.
        const cellValue: IObjectMatrixPrimitiveType<ICellData> = {};
        Range.foreach(range, (row, col) => {
            const cell = worksheet.getCell(row, col);
            if (!cell || !cell.s) {
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
            shiftDimension: Dimension.COLUMNS,
            cellValue,
        };

        const { redo: insertRangeRedo, undo: insertRangeUndo } = getInsertRangeMutations(
            accessor,
            insertRangeMutationParams
        );

        redoMutations.push(...insertRangeRedo);

        undoMutations.push(...insertRangeUndo);

        const sheetInterceptor = sheetInterceptorService.onCommandExecute({
            id: InsertRangeMoveRightCommand.id,
            params: { range } as InsertRangeMoveRightCommandParams,
        });
        redoMutations.push(...sheetInterceptor.redos);
        redoMutations.push(followSelectionOperation(range, workbook, worksheet));
        undoMutations.push(...sheetInterceptor.undos);
        // execute do mutations and add undo mutations to undo stack if completed
        const result = sequenceExecute(redoMutations, commandService);
        if (result.result) {
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
