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

import type { IRange, ISelectionCell, Workbook, Worksheet } from '@univerjs/core';
import { RANGE_TYPE, Rectangle, selectionToArray } from '@univerjs/core';

import { NORMAL_SELECTION_PLUGIN_NAME } from '../../../services/selection-manager.service';
import type { ISetSelectionsOperationParams } from '../../operations/selection.operation';
import { SetSelectionsOperation } from '../../operations/selection.operation';

export interface IExpandParams {
    left?: boolean;
    right?: boolean;
    up?: boolean;
    down?: boolean;
}

/**
 * Adjust the range to align merged cell's borders.
 */
export function alignToMergedCellsBorders(startRange: IRange, worksheet: Worksheet, shouldRecursive = true) {
    const coveredMergedCells = worksheet.getMatrixWithMergedCells(...selectionToArray(startRange));
    const exceededMergedCells: IRange[] = [];

    coveredMergedCells.forValue((row, col, value) => {
        if (value.colSpan !== undefined && value.rowSpan !== undefined) {
            const mergedCellRange = {
                startRow: row,
                startColumn: col,
                endRow: row + value.rowSpan! - 1,
                endColumn: col + value.colSpan! - 1,
            };

            if (!Rectangle.contains(startRange, mergedCellRange)) {
                exceededMergedCells.push(mergedCellRange);
            }
        }
    });

    if (exceededMergedCells.length === 0) {
        return startRange;
    }

    const union = Rectangle.union(startRange, ...exceededMergedCells);
    if (shouldRecursive) {
        return alignToMergedCellsBorders(union, worksheet, shouldRecursive);
    }
    return union;
}

export function getCellAtRowCol(row: number, col: number, worksheet: Worksheet): ISelectionCell {
    let destRange: ISelectionCell | null = null;

    const matrix = worksheet.getMatrixWithMergedCells(row, col, row, col);
    matrix.forValue((row, col, value) => {
        destRange = {
            actualRow: row,
            actualColumn: col,
            startRow: row,
            startColumn: col,
            isMerged: value.rowSpan !== undefined || value.colSpan !== undefined,
            isMergedMainCell: value.rowSpan !== undefined && value.colSpan !== undefined,
            endRow: row + (value.rowSpan !== undefined ? value.rowSpan - 1 : 0),
            endColumn: col + (value.colSpan !== undefined ? value.colSpan - 1 : 0),
            rangeType: RANGE_TYPE.NORMAL,
        };

        return false;
    });

    if (!destRange) {
        return {
            actualColumn: col,
            actualRow: row,
            startRow: row,
            startColumn: col,
            endRow: row,
            endColumn: col,
            isMerged: false,
            isMergedMainCell: false,
            rangeType: RANGE_TYPE.NORMAL,
        };
    }

    return destRange;
}

export function setEndForRange(range: IRange, rowCount: number, columnCount: number) {
    const { startRow, startColumn, endRow, endColumn } = range;

    if (Number.isNaN(startRow)) {
        range.startRow = 0;
    }

    if (Number.isNaN(endRow)) {
        range.endRow = rowCount;
    }

    if (Number.isNaN(startColumn)) {
        range.startColumn = 0;
    }

    if (Number.isNaN(endColumn)) {
        range.endColumn = columnCount;
    }

    return range;
}

/**
 * Get the default primary cell (the most top-left cell) of a range.
 * @param range
 * @param worksheet
 */
export function getPrimaryForRange(range: IRange, worksheet: Worksheet): ISelectionCell {
    const startRow = Number.isNaN(range.startRow) ? 0 : range.startRow;
    const startColumn = Number.isNaN(range.startColumn) ? 0 : range.startColumn;
    const mergedRange = worksheet.getMergedCell(startRow, startColumn);
    if (!mergedRange) {
        return {
            startRow,
            startColumn,
            endRow: range.startRow,
            endColumn: range.startColumn,
            actualRow: startRow,
            actualColumn: startColumn,
            rangeType: RANGE_TYPE.NORMAL,
            isMerged: false,
            isMergedMainCell: false,
        };
    }

    return {
        ...mergedRange,
        actualRow: startRow,
        actualColumn: startColumn,
        rangeType: RANGE_TYPE.NORMAL,
        isMerged: true,
        isMergedMainCell: true,
    };
}

export interface IInterval {
    [index: string]: [start: number, end: number];
}

/**
 * Calculate the real length of the intervals
 * @param intervalsObject
 * @returns
 */
export function calculateTotalLength(intervalsObject: IInterval): number {
    const points: number[] = [];

    // Put the start and end points of the interval into the points array

    Object.keys(intervalsObject).forEach((key: string) => {
        const [start, end] = intervalsObject[key];
        points.push(start, end);
    });

    // Sort the points array
    points.sort((a, b) => a - b);

    let totalLength = 0;
    for (let i = 0; i < points.length - 1; i++) {
        const start = points[i];
        const end = points[i + 1];
        const length = end - start;
        totalLength += length;
    }

    return totalLength + 1;
}

export const followSelectionOperation = (range: IRange, workbook: Workbook, worksheet: Worksheet) => ({
    id: SetSelectionsOperation.id,
    params: {
        unitId: workbook.getUnitId(),
        subUnitId: worksheet.getSheetId(),
        pluginName: NORMAL_SELECTION_PLUGIN_NAME,
        selections: [{ range, primary: getPrimaryForRange(range, worksheet) }],
    } as ISetSelectionsOperationParams,
});
