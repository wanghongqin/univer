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

import type { ICellData, ICommand, IMutationInfo, IRange, Nullable } from '@univerjs/core';
import {
    cellToRange,
    CommandType,
    ErrorService,
    ICommandService,
    IUndoRedoService,
    IUniverInstanceService,
    ObjectMatrix,
    Range,
    Rectangle,
    sequenceExecute,
} from '@univerjs/core';
import type { IAccessor } from '@wendellhu/redi';

import { NORMAL_SELECTION_PLUGIN_NAME } from '../../services/selection-manager.service';
import { SheetInterceptorService } from '../../services/sheet-interceptor/sheet-interceptor.service';
import type { IMoveRangeMutationParams } from '../mutations/move-range.mutation';
import { MoveRangeMutation } from '../mutations/move-range.mutation';
import type { ISetSelectionsOperationParams } from '../operations/selection.operation';
import { SetSelectionsOperation } from '../operations/selection.operation';
import { alignToMergedCellsBorders, getPrimaryForRange } from './utils/selection-utils';

export interface IMoveRangeCommandParams {
    toRange: IRange;
    fromRange: IRange;
}
export const MoveRangeCommandId = 'sheet.command.move-range';
export const MoveRangeCommand: ICommand = {
    type: CommandType.COMMAND,
    id: MoveRangeCommandId,
    handler: (accessor: IAccessor, params: IMoveRangeCommandParams) => {
        const commandService = accessor.get(ICommandService);
        const undoRedoService = accessor.get(IUndoRedoService);
        const univerInstanceService = accessor.get(IUniverInstanceService);
        const errorService = accessor.get(ErrorService);
        const workbook = univerInstanceService.getCurrentUniverSheetInstance();
        const worksheet = workbook.getActiveSheet();
        const unitId = workbook.getUnitId();
        const subUnitId = worksheet.getSheetId();

        const moveRangeMutations = getMoveRangeUndoRedoMutations(
            accessor,
            { unitId, subUnitId, range: params.fromRange },
            { unitId, subUnitId, range: params.toRange }
        );
        if (moveRangeMutations === null) {
            errorService.emit('Across a merged cell.');
            return false;
        }

        const sheetInterceptorService = accessor.get(SheetInterceptorService);
        const interceptorCommands = sheetInterceptorService.onCommandExecute({
            id: MoveRangeCommand.id,
            params: { ...params },
        });

        const redos = [
            ...moveRangeMutations.redos,
            ...interceptorCommands.redos,
            {
                id: SetSelectionsOperation.id,
                params: {
                    unitId,
                    subUnitId,
                    pluginName: NORMAL_SELECTION_PLUGIN_NAME,
                    selections: [{ range: params.toRange, primary: getPrimaryForRange(params.toRange, worksheet) }],
                } as ISetSelectionsOperationParams,
            },
        ];
        const undos = [
            {
                id: SetSelectionsOperation.id,
                params: {
                    unitId,
                    subUnitId,
                    pluginName: NORMAL_SELECTION_PLUGIN_NAME,
                    selections: [{ range: params.fromRange, primary: getPrimaryForRange(params.fromRange, worksheet) }],
                } as ISetSelectionsOperationParams,
            },
            ...moveRangeMutations.undos,
            ...interceptorCommands.undos,
        ];

        const result = sequenceExecute(redos, commandService).result;
        if (result) {
            undoRedoService.pushUndoRedo({
                unitID: unitId,
                undoMutations: undos,
                redoMutations: redos,
            });
            return true;
        }
        return false;
    },
};

export interface IRangeUnit {
    unitId: string;
    subUnitId: string;
    range: IRange;
}

export function getMoveRangeUndoRedoMutations(
    accessor: IAccessor,
    from: IRangeUnit,
    to: IRangeUnit,
    ignoreMerge = false
) {
    const redos: IMutationInfo[] = [];
    const undos: IMutationInfo[] = [];
    const { range: fromRange, subUnitId: fromSubUnitId, unitId } = from;
    const { range: toRange, subUnitId: toSubUnitId } = to;
    const univerInstanceService = accessor.get(IUniverInstanceService);
    const workbook = univerInstanceService.getUniverSheetInstance(unitId);
    const toWorksheet = workbook?.getSheetBySheetId(toSubUnitId);
    const fromWorksheet = workbook?.getSheetBySheetId(fromSubUnitId);
    const toCellMatrix = toWorksheet?.getCellMatrix();
    const fromCellMatrix = fromWorksheet?.getCellMatrix();
    if (toWorksheet && fromWorksheet && toCellMatrix && fromCellMatrix) {
        const alignedRangeWithToRange = alignToMergedCellsBorders(toRange, toWorksheet, false);

        if (!Rectangle.equals(toRange, alignedRangeWithToRange) && !ignoreMerge) {
            return null;
        }

        const fromCellValue = new ObjectMatrix<Nullable<ICellData>>();
        const newFromCellValue = new ObjectMatrix<Nullable<ICellData>>();

        Range.foreach(fromRange, (row, col) => {
            fromCellValue.setValue(row, col, fromCellMatrix.getValue(row, col));
            newFromCellValue.setValue(row, col, null);
        });
        const toCellValue = new ObjectMatrix<Nullable<ICellData>>();

        Range.foreach(toRange, (row, col) => {
            toCellValue.setValue(row, col, toCellMatrix.getValue(row, col));
        });

        const newToCellValue = new ObjectMatrix<Nullable<ICellData>>();

        Range.foreach(fromRange, (row, col) => {
            const cellRange = cellToRange(row, col);
            const relativeRange = Rectangle.getRelativeRange(cellRange, fromRange);
            const range = Rectangle.getPositionRange(relativeRange, toRange);
            newToCellValue.setValue(range.startRow, range.startColumn, fromCellMatrix.getValue(row, col));
        });

        const doMoveRangeMutation: IMoveRangeMutationParams = {
            from: {
                value: newFromCellValue.getMatrix(),
                subUnitId: fromSubUnitId,
            },
            to: {
                value: newToCellValue.getMatrix(),
                subUnitId: toSubUnitId,
            },
            unitId,
        };
        const undoMoveRangeMutation: IMoveRangeMutationParams = {
            from: {
                value: fromCellValue.getMatrix(),
                subUnitId: fromSubUnitId,
            },
            to: {
                value: toCellValue.getMatrix(),
                subUnitId: toSubUnitId,
            },
            unitId,
        };

        redos.push({ id: MoveRangeMutation.id, params: doMoveRangeMutation });
        undos.push({ id: MoveRangeMutation.id, params: undoMoveRangeMutation });
    }

    return {
        redos,
        undos,
    };
}
