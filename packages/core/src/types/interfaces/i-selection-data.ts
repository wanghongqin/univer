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

import type { Nullable } from '../../shared/types';
import type { IRange } from './i-range';

/**
 * Properties of selection data
 */
export interface IPosition {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

export interface ISingleCell {
    actualRow: number;
    actualColumn: number;
    isMerged: boolean;
    isMergedMainCell: boolean;
}

export interface IRangeWithCoord extends IPosition, IRange {}

export interface ISelectionCell extends IRange, ISingleCell {}

export interface ISelectionCellWithCoord extends IPosition, ISingleCell {
    mergeInfo: IRangeWithCoord; // merge cell, start and end is upper left cell
}

export interface ISelection {
    /**
     * Sheet selection range.
     */
    range: IRange;

    /**
     * The highlighted cell in the selection range. If there are several selections, only one selection would have a primary cell.
     */
    primary: Nullable<ISelectionCell>;
}

export interface ISelectionWithCoord {
    rangeWithCoord: IRangeWithCoord;
    primaryWithCoord: Nullable<ISelectionCellWithCoord>;
}

export interface ITextRangeStart {
    startOffset: number;
}

export interface ITextRange extends ITextRangeStart {
    endOffset: number;
    collapsed: boolean;
}

export interface ITextRangeParam extends ITextRange {
    segmentId?: string; //The ID of the header, footer or footnote the location is in. An empty segment ID signifies the document's body.
    isActive?: boolean; // Whether the text range is active or current range.
}
