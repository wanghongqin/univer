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

import { type IRange, Rectangle } from '@univerjs/core';

import { getCellByIndex } from '../../../basics/tools';
import { ComponentExtension } from '../../extension';
import type { SpreadsheetSkeleton } from '../sheet-skeleton';

export enum SHEET_EXTENSION_TYPE {
    GRID,
}

export class SheetExtension extends ComponentExtension<SpreadsheetSkeleton, SHEET_EXTENSION_TYPE, IRange[]> {
    override type = SHEET_EXTENSION_TYPE.GRID;

    getCellIndex(
        rowIndex: number,
        columnIndex: number,
        rowHeightAccumulation: number[],
        columnWidthAccumulation: number[],
        dataMergeCache: IRange[]
    ) {
        return getCellByIndex(rowIndex, columnIndex, rowHeightAccumulation, columnWidthAccumulation, dataMergeCache);
    }

    isRenderDiffRangesByCell(range: IRange, diffRanges?: IRange[]) {
        if (diffRanges == null || diffRanges.length === 0) {
            return true;
        }

        for (const range of diffRanges) {
            const { startRow, startColumn, endRow, endColumn } = range;
            const isIntersect = Rectangle.intersects(range, {
                startRow,
                endRow,
                startColumn,
                endColumn,
            });

            if (isIntersect) {
                return true;
            }
        }

        return false;
    }

    // isRenderDiffRangesByColumn(column: number, diffRanges?: IRange[]) {
    //     if (diffRanges == null || diffRanges.length === 0) {
    //         return true;
    //     }

    //     for (const range of diffRanges) {
    //         const { startColumn, endColumn } = range;
    //         if (column >= startColumn && column <= endColumn) {
    //             return true;
    //         }
    //     }

    //     return false;
    // }

    isRenderDiffRangesByColumn(curStartColumn: number, curEndColumn: number, diffRanges?: IRange[]) {
        if (diffRanges == null || diffRanges.length === 0) {
            return true;
        }

        for (const range of diffRanges) {
            const { startColumn, endColumn } = range;
            // if (row >= startRow && row <= endRow) {
            //     return true;
            // }
            const isIntersect = Rectangle.intersects(
                {
                    startRow: 0,
                    endRow: 0,
                    startColumn: curStartColumn,
                    endColumn: curEndColumn,
                },
                {
                    startRow: 0,
                    endRow: 0,
                    startColumn,
                    endColumn,
                }
            );

            if (isIntersect) {
                return true;
            }
        }

        return false;
    }

    isRenderDiffRangesByRow(curStartRow: number, curEndRow: number, diffRanges?: IRange[]) {
        if (diffRanges == null || diffRanges.length === 0) {
            return true;
        }

        for (const range of diffRanges) {
            const { startRow, endRow } = range;
            // if (row >= startRow && row <= endRow) {
            //     return true;
            // }
            const isIntersect = Rectangle.intersects(
                {
                    startRow: curStartRow,
                    endRow: curEndRow,
                    startColumn: 0,
                    endColumn: 0,
                },
                {
                    startRow,
                    endRow,
                    startColumn: 0,
                    endColumn: 0,
                }
            );

            if (isIntersect) {
                return true;
            }
        }

        return false;
    }
}
