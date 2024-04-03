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

import type { ICellData, IMutationInfo, IRange, Nullable, Worksheet } from '@univerjs/core';
import { ObjectMatrix } from '@univerjs/core';
import type { ISetRangeValuesMutationParams } from '@univerjs/sheets';
import { SetRangeValuesMutation, SetRangeValuesUndoMutationFactory } from '@univerjs/sheets';
import type { IAccessor } from '@wendellhu/redi';
import type { IBoundRectNoAngle, Scene, SpreadsheetSkeleton } from '@univerjs/engine-render';
import { VIEWPORT_KEY } from './keys';

export function checkCellContentInRanges(worksheet: Worksheet, ranges: IRange[]): boolean {
    return ranges.some((range) => checkCellContentInRange(worksheet, range));
}

export function checkCellContentInRange(worksheet: Worksheet, range: IRange): boolean {
    const { startRow, startColumn, endColumn, endRow } = range;
    const cellMatrix = worksheet.getMatrixWithMergedCells(startRow, startColumn, endRow, endColumn);

    let someCellGoingToBeRemoved = false;
    cellMatrix.forValue((row, col, cellData) => {
        if (cellData && (row !== startRow || col !== startColumn) && worksheet.cellHasValue(cellData)) {
            someCellGoingToBeRemoved = true;
            return false;
        }
    });
    return someCellGoingToBeRemoved;
}

export function getClearContentMutationParamsForRanges(
    accessor: IAccessor,
    unitId: string,
    worksheet: Worksheet,
    ranges: IRange[]
): { undos: IMutationInfo[]; redos: IMutationInfo[] } {
    const undos: IMutationInfo[] = [];
    const redos: IMutationInfo[] = [];

    const subUnitId = worksheet.getSheetId();

    // Use the following file as a reference.
    // packages/sheets/src/commands/commands/clear-selection-all.command.ts
    // packages/sheets/src/commands/mutations/set-range-values.mutation.ts
    ranges.forEach((range) => {
        const redoMatrix = getClearContentMutationParamForRange(worksheet, range);
        const redoMutationParams: ISetRangeValuesMutationParams = {
            unitId,
            subUnitId,
            cellValue: redoMatrix.getData(),
        };
        const undoMutationParams: ISetRangeValuesMutationParams = SetRangeValuesUndoMutationFactory(
            accessor,
            redoMutationParams
        );

        undos.push({ id: SetRangeValuesMutation.id, params: undoMutationParams });
        redos.push({ id: SetRangeValuesMutation.id, params: redoMutationParams });
    });

    return {
        undos,
        redos,
    };
}

export function getClearContentMutationParamForRange(
    worksheet: Worksheet,
    range: IRange
): ObjectMatrix<Nullable<ICellData>> {
    const { startRow, startColumn, endColumn, endRow } = range;
    const cellMatrix = worksheet.getMatrixWithMergedCells(startRow, startColumn, endRow, endColumn);
    const redoMatrix = new ObjectMatrix<Nullable<ICellData>>();
    cellMatrix.forValue((row, col, cellData) => {
        if (cellData && (row !== startRow || col !== startColumn)) {
            redoMatrix.setValue(row, col, null);
        }
    });

    return redoMatrix;
}

export function getViewportByCell(row: number, column: number, scene: Scene, worksheet: Worksheet) {
    const freeze = worksheet.getFreeze();
    if (!freeze || (freeze.startRow <= 0 && freeze.startColumn <= 0)) {
        return scene.getViewport(VIEWPORT_KEY.VIEW_MAIN);
    }

    if (row > freeze.startRow && column > freeze.startColumn) {
        return scene.getViewport(VIEWPORT_KEY.VIEW_MAIN);
    }

    if (row <= freeze.startRow && column <= freeze.startColumn) {
        return scene.getViewport(VIEWPORT_KEY.VIEW_MAIN_LEFT_TOP);
    }

    if (row <= freeze.startRow && column > freeze.startColumn) {
        return scene.getViewport(VIEWPORT_KEY.VIEW_MAIN_TOP);
    }

    if (row > freeze.startRow && column <= freeze.startColumn) {
        return scene.getViewport(VIEWPORT_KEY.VIEW_MAIN_LEFT);
    }
}

export function transformBound2OffsetBound(originBound: IBoundRectNoAngle, scene: Scene, skeleton: SpreadsheetSkeleton, worksheet: Worksheet): IBoundRectNoAngle {
    const topLeft = transformPosition2Offset(originBound.left, originBound.top, scene, skeleton, worksheet);
    const bottomRight = transformPosition2Offset(originBound.right, originBound.bottom, scene, skeleton, worksheet);

    return {
        left: topLeft.x,
        top: topLeft.y,
        right: bottomRight.x,
        bottom: bottomRight.y,
    };
}

export function transformPosition2Offset(x: number, y: number, scene: Scene, skeleton: SpreadsheetSkeleton, worksheet: Worksheet) {
    const { scaleX, scaleY } = scene.getAncestorScale();
    const viewMain = scene.getViewport(VIEWPORT_KEY.VIEW_MAIN);
    if (!viewMain) {
        return {
            x,
            y,
        };
    }
    const freeze = worksheet.getFreeze();
    const { startColumn, startRow, xSplit, ySplit } = freeze;
     // freeze start
    const startSheetView = skeleton.getNoMergeCellPositionByIndexWithNoHeader(startRow - ySplit, startColumn - xSplit);
     // freeze end
    const endSheetView = skeleton.getNoMergeCellPositionByIndexWithNoHeader(startRow, startColumn);
    const { rowHeaderWidth, columnHeaderHeight } = skeleton;
    const freezeWidth = endSheetView.startX - startSheetView.startX;
    const freezeHeight = endSheetView.startY - startSheetView.startY;

    const { top, left, actualScrollX, actualScrollY } = viewMain;
    let offsetX: number;
    // viewMain or viewTop
    if (x > left) {
        offsetX = (x - actualScrollX) * scaleX;
    } else {
        offsetX = ((freezeWidth + rowHeaderWidth) - (left - x)) * scaleX;
    }

    let offsetY: number;
    if (y > top) {
        offsetY = (y - actualScrollY) * scaleY;
    } else {
        offsetY = ((freezeHeight + columnHeaderHeight) - (top - y)) * scaleX;
    }

    return {
        x: offsetX,
        y: offsetY,
    };
}
