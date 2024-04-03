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

import type { ICommand, IRange } from '@univerjs/core';
import {
    BooleanNumber,
    CommandType,
    ICommandService,
    IUndoRedoService,
    IUniverInstanceService,
    RANGE_TYPE,
    Rectangle,
    sequenceExecute,
} from '@univerjs/core';
import type { IAccessor } from '@wendellhu/redi';

import { SelectionManagerService } from '../../services/selection-manager.service';
import { SheetInterceptorService } from '../../services/sheet-interceptor/sheet-interceptor.service';
import type {
    ISetWorksheetRowHeightMutationParams,
    ISetWorksheetRowIsAutoHeightMutationParams,
} from '../mutations/set-worksheet-row-height.mutation';
import {
    SetWorksheetRowHeightMutation,
    SetWorksheetRowHeightMutationFactory,
    SetWorksheetRowIsAutoHeightMutation,
    SetWorksheetRowIsAutoHeightMutationFactory,
} from '../mutations/set-worksheet-row-height.mutation';

export interface IDeltaRowHeightCommand {
    anchorRow: number;
    deltaY: number;
}

export const DeltaRowHeightCommand: ICommand = {
    type: CommandType.COMMAND,
    id: 'sheet.command.delta-row-height',
    handler: async (accessor: IAccessor, params: IDeltaRowHeightCommand) => {
        const selectionManagerService = accessor.get(SelectionManagerService);
        const selections = selectionManagerService.getSelections();
        if (!selections?.length) {
            return false;
        }

        const univerInstanceService = accessor.get(IUniverInstanceService);
        const workbook = univerInstanceService.getCurrentUniverSheetInstance();
        const worksheet = workbook.getActiveSheet();
        const unitId = workbook.getUnitId();
        const subUnitId = worksheet.getSheetId();

        const { anchorRow, deltaY } = params;
        const anchorRowHeight = worksheet.getRowHeight(anchorRow);
        const destRowHeight = anchorRowHeight + deltaY;

        const isAllSheetRange = selections.length === 1 && selections[0].range.rangeType === RANGE_TYPE.ALL;
        const rowSelections = selections.filter((s) => s.range.rangeType === RANGE_TYPE.ROW);
        const rangeType = isAllSheetRange
            ? RANGE_TYPE.ALL
            : rowSelections.some(({ range }) => {
                const { startRow, endRow } = range;
                return startRow <= anchorRow && anchorRow <= endRow;
            })
                ? RANGE_TYPE.ROW
                : RANGE_TYPE.NORMAL;

        let redoMutationParams: ISetWorksheetRowHeightMutationParams;
        if (rangeType === RANGE_TYPE.ALL) {
            const colCount = worksheet.getRowCount();
            const allRowRanges = new Array(worksheet.getColumnCount())
                .fill(undefined)
                .map(
                    (_, index) =>
                        ({ startRow: index, endRow: index, startColumn: 0, endColumn: colCount - 1 }) as IRange
                );

            redoMutationParams = {
                subUnitId,
                unitId,
                rowHeight: destRowHeight,
                ranges: allRowRanges,
            };
        } else if (rangeType === RANGE_TYPE.ROW) {
            redoMutationParams = {
                subUnitId,
                unitId,
                ranges: rowSelections.map((s) => Rectangle.clone(s.range)),
                rowHeight: destRowHeight,
            };
        } else {
            redoMutationParams = {
                subUnitId,
                unitId,
                rowHeight: destRowHeight,
                ranges: [
                    {
                        startRow: anchorRow,
                        endRow: anchorRow,
                        startColumn: 0,
                        endColumn: worksheet.getMaxColumns() - 1,
                    },
                ],
            };
        }

        const undoMutationParams: ISetWorksheetRowHeightMutationParams = SetWorksheetRowHeightMutationFactory(
            accessor,
            redoMutationParams
        );

        const redoSetIsAutoHeightParams: ISetWorksheetRowIsAutoHeightMutationParams = {
            unitId,
            subUnitId,
            ranges: redoMutationParams.ranges,
            autoHeightInfo: BooleanNumber.FALSE,
        };

        const undoSetIsAutoHeightParams: ISetWorksheetRowIsAutoHeightMutationParams =
            SetWorksheetRowIsAutoHeightMutationFactory(accessor, redoSetIsAutoHeightParams);

        const commandService = accessor.get(ICommandService);
        const undoRedoService = accessor.get(IUndoRedoService);

        const result = sequenceExecute(
            [
                {
                    id: SetWorksheetRowHeightMutation.id,
                    params: redoMutationParams,
                },
                {
                    id: SetWorksheetRowIsAutoHeightMutation.id,
                    params: redoSetIsAutoHeightParams,
                },
            ],
            commandService
        );

        if (result.result) {
            undoRedoService.pushUndoRedo({
                unitID: unitId,
                undoMutations: [
                    {
                        id: SetWorksheetRowHeightMutation.id,
                        params: undoMutationParams,
                    },
                    {
                        id: SetWorksheetRowIsAutoHeightMutation.id,
                        params: undoSetIsAutoHeightParams,
                    },
                ],
                redoMutations: [
                    {
                        id: SetWorksheetRowHeightMutation.id,
                        params: redoMutationParams,
                    },
                    {
                        id: SetWorksheetRowIsAutoHeightMutation.id,
                        params: redoSetIsAutoHeightParams,
                    },
                ],
            });
            return true;
        }

        return false;
    },
};

export interface ISetRowHeightCommandParams {
    value: number;
}
export const SetRowHeightCommand: ICommand = {
    type: CommandType.COMMAND,
    id: 'sheet.command.set-row-height',
    handler: (accessor: IAccessor, params: ISetRowHeightCommandParams) => {
        const selectionManagerService = accessor.get(SelectionManagerService);
        const commandService = accessor.get(ICommandService);
        const undoRedoService = accessor.get(IUndoRedoService);
        const univerInstanceService = accessor.get(IUniverInstanceService);

        const selections = selectionManagerService.getSelectionRanges();
        if (!selections?.length) {
            return false;
        }

        const workbook = univerInstanceService.getCurrentUniverSheetInstance();
        const unitId = workbook.getUnitId();
        const subUnitId = workbook.getActiveSheet().getSheetId();

        const redoMutationParams: ISetWorksheetRowHeightMutationParams = {
            subUnitId,
            unitId,
            ranges: selections,
            rowHeight: params.value,
        };

        const undoMutationParams: ISetWorksheetRowHeightMutationParams = SetWorksheetRowHeightMutationFactory(
            accessor,
            redoMutationParams
        );

        const redoSetIsAutoHeightParams: ISetWorksheetRowIsAutoHeightMutationParams = {
            unitId,
            subUnitId,
            ranges: redoMutationParams.ranges,
            autoHeightInfo: BooleanNumber.FALSE,
        };

        const undoSetIsAutoHeightParams: ISetWorksheetRowIsAutoHeightMutationParams =
            SetWorksheetRowIsAutoHeightMutationFactory(accessor, redoSetIsAutoHeightParams);

        const result = sequenceExecute(
            [
                {
                    id: SetWorksheetRowHeightMutation.id,
                    params: redoMutationParams,
                },
                {
                    id: SetWorksheetRowIsAutoHeightMutation.id,
                    params: redoSetIsAutoHeightParams,
                },
            ],
            commandService
        );

        if (result.result) {
            undoRedoService.pushUndoRedo({
                unitID: unitId,
                undoMutations: [
                    {
                        id: SetWorksheetRowHeightMutation.id,
                        params: undoMutationParams,
                    },
                    {
                        id: SetWorksheetRowIsAutoHeightMutation.id,
                        params: undoSetIsAutoHeightParams,
                    },
                ],
                redoMutations: [
                    {
                        id: SetWorksheetRowHeightMutation.id,
                        params: redoMutationParams,
                    },
                    {
                        id: SetWorksheetRowIsAutoHeightMutation.id,
                        params: redoSetIsAutoHeightParams,
                    },
                ],
            });
            return true;
        }

        return false;
    },
};

export interface ISetWorksheetRowIsAutoHeightCommandParams {
    anchorRow?: number;
}

export const SetWorksheetRowIsAutoHeightCommand: ICommand = {
    type: CommandType.COMMAND,
    id: 'sheet.command.set-row-is-auto-height',
    handler: async (accessor: IAccessor, params: ISetWorksheetRowIsAutoHeightCommandParams) => {
        const commandService = accessor.get(ICommandService);
        const undoRedoService = accessor.get(IUndoRedoService);
        const selectionManagerService = accessor.get(SelectionManagerService);
        const univerInstanceService = accessor.get(IUniverInstanceService);
        const unitId = univerInstanceService.getCurrentUniverSheetInstance().getUnitId();
        const workSheet = univerInstanceService.getCurrentUniverSheetInstance().getActiveSheet();
        const subUnitId = workSheet.getSheetId();

        const { anchorRow } = params ?? {};

        const ranges =
            anchorRow != null
                ? [
                    {
                        startRow: anchorRow,
                        endRow: anchorRow,
                        startColumn: 0,
                        endColumn: workSheet.getMaxColumns() - 1,
                    },
                ]
                : selectionManagerService.getSelectionRanges();

        if (!ranges?.length) {
            return false;
        }

        const redoMutationParams: ISetWorksheetRowIsAutoHeightMutationParams = {
            unitId,
            subUnitId,
            ranges,
            autoHeightInfo: BooleanNumber.TRUE, // Hard code first, maybe it will change by the menu item in the future.
        };

        const undoMutationParams: ISetWorksheetRowIsAutoHeightMutationParams =
            SetWorksheetRowIsAutoHeightMutationFactory(accessor, redoMutationParams);

        const setIsAutoHeightResult = commandService.syncExecuteCommand(
            SetWorksheetRowIsAutoHeightMutation.id,
            redoMutationParams
        );

        const { undos, redos } = accessor.get(SheetInterceptorService).onCommandExecute({
            id: SetWorksheetRowIsAutoHeightCommand.id,
            params: redoMutationParams,
        });

        const result = sequenceExecute([...redos], commandService);
        if (setIsAutoHeightResult && result.result) {
            undoRedoService.pushUndoRedo({
                unitID: unitId,
                undoMutations: [{ id: SetWorksheetRowIsAutoHeightMutation.id, params: undoMutationParams }, ...undos],
                redoMutations: [{ id: SetWorksheetRowIsAutoHeightMutation.id, params: redoMutationParams }, ...redos],
            });

            return true;
        }

        return false;
    },
};
