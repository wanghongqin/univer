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

import type { ICommand, IMutationInfo, IRange } from '@univerjs/core';
import {
    CommandType,
    Dimension,
    ICommandService,
    IUndoRedoService,
    IUniverInstanceService,
    sequenceExecute,
} from '@univerjs/core';
import type { IAccessor } from '@wendellhu/redi';

import type { IDeleteRangeMutationParams } from '../../basics/interfaces/mutation-interface';
import { SelectionManagerService } from '../../services/selection-manager.service';
import { SheetInterceptorService } from '../../services/sheet-interceptor/sheet-interceptor.service';
import { getRemoveRangeMutations } from '../utils/handle-range-mutation';
import { followSelectionOperation } from './utils/selection-utils';

export interface IDeleteRangeMoveUpCommandParams {
    range: IRange;
}
export const DeleteRangeMoveUpCommandId = 'sheet.command.delete-range-move-up';
/**
 * The command to delete range.
 */
export const DeleteRangeMoveUpCommand: ICommand = {
    type: CommandType.COMMAND,
    id: DeleteRangeMoveUpCommandId,

    handler: async (accessor: IAccessor, params: IDeleteRangeMoveUpCommandParams) => {
        const commandService = accessor.get(ICommandService);
        const undoRedoService = accessor.get(IUndoRedoService);
        const univerInstanceService = accessor.get(IUniverInstanceService);
        const selectionManagerService = accessor.get(SelectionManagerService);
        const sheetInterceptorService = accessor.get(SheetInterceptorService);

        const unitId = univerInstanceService.getCurrentUniverSheetInstance().getUnitId();
        const subUnitId = univerInstanceService.getCurrentUniverSheetInstance().getActiveSheet().getSheetId();
        let range = params?.range;
        if (!range) {
            range = selectionManagerService.getLast()?.range!;
        }
        if (!range) return false;

        const workbook = univerInstanceService.getUniverSheetInstance(unitId);
        if (!workbook) return false;
        const worksheet = workbook.getSheetBySheetId(subUnitId);
        if (!worksheet) return false;

        const deleteRangeMutationParams: IDeleteRangeMutationParams = {
            range,
            subUnitId,
            unitId,
            shiftDimension: Dimension.ROWS,
        };

        const sheetInterceptor = sheetInterceptorService.onCommandExecute({
            id: DeleteRangeMoveUpCommand.id,
            params: { range } as IDeleteRangeMoveUpCommandParams,
        });

        const { redo: removeRangeRedo, undo: removeRangeUndo } = getRemoveRangeMutations(
            accessor,
            deleteRangeMutationParams
        );
        const redos: IMutationInfo[] = [...removeRangeRedo];
        const undos: IMutationInfo[] = [...removeRangeUndo];
        redos.push(...sheetInterceptor.redos);
        redos.push(followSelectionOperation(range, workbook, worksheet));
        undos.push(...sheetInterceptor.undos);
        const result = await sequenceExecute(redos, commandService).result;

        if (result) {
            undoRedoService.pushUndoRedo({
                unitID: unitId,
                undoMutations: undos.reverse(),
                redoMutations: redos,
            });

            return true;
        }

        return false;
    },
    // all subsequent mutations should succeed inorder to make the whole process succeed
    // Promise.all([]).then(() => true),
};
