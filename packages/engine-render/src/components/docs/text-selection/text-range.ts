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

import type { ITextRange, Nullable } from '@univerjs/core';
import { COLORS, Tools } from '@univerjs/core';

import type { INodePosition } from '../../../basics/interfaces';
import type { ISuccinctTextRangeParam, ITextSelectionStyle } from '../../../basics/range';
import { NORMAL_TEXT_SELECTION_PLUGIN_STYLE, RANGE_DIRECTION } from '../../../basics/range';
import { getColor } from '../../../basics/tools';
import type { IPoint } from '../../../basics/vector2';
import type { Scene } from '../../../scene';
import { Rect } from '../../../shape/rect';
import { RegularPolygon } from '../../../shape/regular-polygon';
import type { ThinScene } from '../../../thin-scene';
import type { DocumentSkeleton } from '../layout/doc-skeleton';
import type { Documents } from '../document';
import {
    compareNodePosition,
    compareNodePositionLogic,
    getOneTextSelectionRange,
    NodePositionConvertToCursor,
    NodePositionMap,
} from './convert-cursor';

const TEXT_RANGE_KEY_PREFIX = '__TestSelectionRange__';

const TEXT_ANCHOR_KEY_PREFIX = '__TestSelectionAnchor__';

const ID_LENGTH = 6;

const BLINK_ON = 500;
const BLINK_OFF = 500;

export const TEXT_RANGE_LAYER_INDEX = 1;

export function cursorConvertToTextRange(
    scene: Scene,
    range: ISuccinctTextRangeParam,
    docSkeleton: DocumentSkeleton,
    document: Documents
): Nullable<TextRange> {
    const { startOffset, endOffset, style = NORMAL_TEXT_SELECTION_PLUGIN_STYLE } = range;

    const anchorNodePosition = docSkeleton.findNodePositionByCharIndex(startOffset);
    const focusNodePosition = startOffset !== endOffset ? docSkeleton.findNodePositionByCharIndex(endOffset) : null;

    const textRange = new TextRange(scene, document, docSkeleton, anchorNodePosition, focusNodePosition, style);

    textRange.refresh();

    return textRange;
}

export function getAnchorBounding(pointsGroup: IPoint[][]) {
    const points = pointsGroup[0];
    const startPoint = points[0];
    const endPoint = points[2];

    const { x: startX, y: startY } = startPoint;

    const { x: endX, y: endY } = endPoint;

    return {
        left: startX,
        top: startY,
        width: endX - startX,
        height: endY - startY,
    };
}

export class TextRange {
    // Identifies whether the range is the current one, most of which is the last range.
    private _current = false;
    // The rendered range graphic when collapsed is false
    private _rangeShape: Nullable<RegularPolygon>;
    // The rendered range graphic when collapsed is true
    private _anchorShape: Nullable<Rect>;

    private _cursorList: ITextRange[] = [];

    private _anchorBlinkTimer: Nullable<ReturnType<typeof setInterval>> = null;

    constructor(
        private _scene: ThinScene,
        private _document: Documents,
        private _docSkeleton: DocumentSkeleton,
        public anchorNodePosition?: Nullable<INodePosition>,
        public focusNodePosition?: Nullable<INodePosition>,
        public style: ITextSelectionStyle = NORMAL_TEXT_SELECTION_PLUGIN_STYLE
    ) {
        this._anchorBlink();
    }

    private _anchorBlink() {
        setTimeout(() => {
            if (this._anchorShape) {
                if (this._anchorShape.visible) {
                    this.deactivateStatic();
                }
            }
        }, BLINK_ON);

        this._anchorBlinkTimer = setInterval(() => {
            if (this._anchorShape) {
                if (this._anchorShape.visible) {
                    this.activeStatic();

                    setTimeout(() => {
                        this.deactivateStatic();
                    }, BLINK_ON);
                }
            }
        }, BLINK_OFF + BLINK_ON);
    }

    // The start position of the range
    get startOffset() {
        const { startOffset } = getOneTextSelectionRange(this._cursorList) ?? {};
        const body = this._docSkeleton.getViewModel().getBody();

        if (startOffset == null || body == null) {
            return startOffset;
        }
        // The cursor cannot be placed after the last line break
        const maxLength = body.dataStream.length - 2;

        return Math.min(maxLength, startOffset);
    }

    // The end position of the range
    get endOffset() {
        const { endOffset } = getOneTextSelectionRange(this._cursorList) ?? {};
        const body = this._docSkeleton.getViewModel().getBody();

        if (endOffset == null || body == null) {
            return endOffset;
        }
        // The cursor cannot be placed after the last line break
        const maxLength = body.dataStream.length - 2;

        return Math.min(endOffset, maxLength);
    }

    get collapsed() {
        const { startOffset, endOffset } = this;

        return startOffset != null && startOffset === endOffset;
    }

    get startNodePosition() {
        if (this.anchorNodePosition == null) {
            return null;
        }

        if (this.focusNodePosition == null) {
            return this.anchorNodePosition;
        }

        const { start } = compareNodePosition(this.anchorNodePosition, this.focusNodePosition);

        return start;
    }

    get endNodePosition() {
        if (this.anchorNodePosition == null) {
            return this.focusNodePosition;
        }

        if (this.focusNodePosition == null) {
            return null;
        }

        const { end } = compareNodePosition(this.anchorNodePosition, this.focusNodePosition);

        return end;
    }

    get direction() {
        const { collapsed, anchorNodePosition, focusNodePosition } = this;

        if (collapsed || anchorNodePosition == null || focusNodePosition == null) {
            return RANGE_DIRECTION.NONE;
        }

        const compare = compareNodePositionLogic(anchorNodePosition, focusNodePosition);

        return compare ? RANGE_DIRECTION.FORWARD : RANGE_DIRECTION.BACKWARD;
    }

    getAnchor() {
        return this._anchorShape;
    }

    activeStatic() {
        this._anchorShape?.setProps({
            stroke: this.style?.strokeActive || getColor(COLORS.black, 1),
        });
    }

    deactivateStatic() {
        this._anchorShape?.setProps({
            stroke: this.style?.stroke || getColor(COLORS.black, 0),
        });
    }

    isActive() {
        return this._current === true;
    }

    activate() {
        this._current = true;
    }

    deactivate() {
        this._current = false;
    }

    dispose() {
        this._rangeShape?.dispose();
        this._rangeShape = null;
        this._anchorShape?.dispose();
        this._anchorShape = null;

        if (this._anchorBlinkTimer) {
            clearInterval(this._anchorBlinkTimer);
            this._anchorBlinkTimer = null;
        }
    }

    isIntersection(compareRange: TextRange) {
        const { startOffset: activeStart, endOffset: activeEnd } = this;
        const { startOffset: compareStart, endOffset: compareEnd } = compareRange;

        if (activeStart == null || activeEnd == null || compareStart == null || compareEnd == null) {
            return false;
        }

        return activeStart <= compareEnd && activeEnd >= compareStart;
    }

    refresh() {
        const { _document, _docSkeleton } = this;
        const anchor = this.anchorNodePosition;
        const focus = this.focusNodePosition;

        this._anchorShape?.hide();
        this._rangeShape?.hide();

        if (this._isEmpty()) {
            return;
        }

        const documentOffsetConfig = _document.getOffsetConfig();

        const { docsLeft, docsTop } = documentOffsetConfig;

        const convertor = new NodePositionConvertToCursor(documentOffsetConfig, _docSkeleton);

        if (this._isCollapsed()) {
            const { contentBoxPointGroup, cursorList } = convertor.getRangePointData(anchor, anchor);

            this._setCursorList(cursorList);
            contentBoxPointGroup.length > 0 && this._createOrUpdateAnchor(contentBoxPointGroup, docsLeft, docsTop);

            return;
        }

        const { borderBoxPointGroup, cursorList } = convertor.getRangePointData(anchor, focus);

        this._setCursorList(cursorList);

        borderBoxPointGroup.length > 0 && this._createOrUpdateRange(borderBoxPointGroup, docsLeft, docsTop);
    }

    private _isEmpty() {
        return this.anchorNodePosition == null && this.focusNodePosition == null;
    }

    private _isCollapsed() {
        const anchor = this.anchorNodePosition;
        const focus = this.focusNodePosition;

        if (anchor != null && focus == null) {
            return true;
        }

        if (anchor == null || focus == null) {
            return false;
        }

        const keys = Object.keys(NodePositionMap);

        for (const key of keys) {
            const startNodeValue = anchor[key as keyof INodePosition] as number;
            const endNodeValue = focus[key as keyof INodePosition] as number;

            if (startNodeValue !== endNodeValue) {
                return false;
            }
        }

        if (anchor.isBack !== focus.isBack) {
            return false;
        }

        return true;
    }

    private _createOrUpdateRange(pointsGroup: IPoint[][], left: number, top: number) {
        if (this._rangeShape) {
            this._rangeShape.translate(left, top);
            this._rangeShape.updatePointGroup(pointsGroup);
            this._rangeShape.show();

            return;
        }

        const OPACITY = 0.2;
        const polygon = new RegularPolygon(TEXT_RANGE_KEY_PREFIX + Tools.generateRandomId(ID_LENGTH), {
            pointsGroup,
            fill: this.style?.fill || getColor(COLORS.black, OPACITY),
            left,
            top,
            evented: false,
            debounceParentDirty: false,
        });

        this._rangeShape = polygon;

        this._scene.addObject(polygon, TEXT_RANGE_LAYER_INDEX);
    }

    private _createOrUpdateAnchor(pointsGroup: IPoint[][], docsLeft: number, docsTop: number) {
        const bounding = getAnchorBounding(pointsGroup);
        const { left, top, height } = bounding;

        if (this._anchorShape) {
            this._anchorShape.transformByState({ left: left + docsLeft, top: top + docsTop, height });
            this._anchorShape.show();

            return;
        }

        const anchor = new Rect(TEXT_ANCHOR_KEY_PREFIX + Tools.generateRandomId(ID_LENGTH), {
            left: left + docsLeft,
            top: top + docsTop,
            height,
            strokeWidth: this.style?.strokeWidth || 1,
            stroke: this.style?.strokeActive || getColor(COLORS.black, 1),
            evented: false,
        });

        this._anchorShape = anchor;

        this._scene.addObject(anchor, TEXT_RANGE_LAYER_INDEX);
    }

    private _setCursorList(cursorList: ITextRange[]) {
        if (cursorList.length === 0) {
            return;
        }

        this._cursorList = cursorList;
    }
}
