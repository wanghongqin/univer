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

import type { IScale, ITextDecoration } from '@univerjs/core';
import { BooleanNumber, getColorStyle, TextDecoration } from '@univerjs/core';

import { COLOR_BLACK_RGB, DEFAULT_OFFSET_SPACING, FIX_ONE_PIXEL_BLUR_OFFSET } from '../../../basics/const';
import { calculateRectRotate } from '../../../basics/draw';
import type { IDocumentSkeletonGlyph } from '../../../basics/i-document-skeleton-cached';
import { degToRad, getScale } from '../../../basics/tools';
import { Vector2 } from '../../../basics/vector2';
import type { UniverRenderingContext } from '../../../context';
import { DocumentsSpanAndLineExtensionRegistry } from '../../extension';
import { docExtension } from '../doc-extension';

const UNIQUE_KEY = 'DefaultDocsLineExtension';

const DOC_EXTENSION_Z_INDEX = 40;

export class Line extends docExtension {
    override uKey = UNIQUE_KEY;

    override Z_INDEX = DOC_EXTENSION_Z_INDEX;

    private _preBackgroundColor = '';

    override draw(ctx: UniverRenderingContext, parentScale: IScale, span: IDocumentSkeletonGlyph) {
        const line = span.parent?.parent;
        if (!line) {
            return;
        }

        const { contentHeight = 0, asc } = line;
        const { ts: textStyle, bBox } = span;
        if (!textStyle) {
            return;
        }

        const { sp: strikeoutPosition, ba } = bBox;

        const scale = getScale(parentScale);

        const DELTA = 0.5;

        const { ul: underline, st: strikethrough, ol: overline } = textStyle;

        if (underline) {
            const startY = contentHeight + DEFAULT_OFFSET_SPACING - 3;

            this._drawLine(ctx, span, underline, startY, scale);
        }

        if (strikethrough) {
            // We use the asc baseline to find the position of the strikethrough,
            // and ba - strikeoutPosition is exactly the offset position of the strikethrough from the baseline
            const startY = asc - (ba - strikeoutPosition) - DELTA;

            this._drawLine(ctx, span, strikethrough, startY, scale);
        }

        if (overline) {
            const startY = -DEFAULT_OFFSET_SPACING - DELTA;

            this._drawLine(ctx, span, overline, startY, scale);
        }
    }

    override clearCache() {
        this._preBackgroundColor = '';
    }

    private _drawLine(
        ctx: UniverRenderingContext,
        span: IDocumentSkeletonGlyph,
        line: ITextDecoration,
        startY: number,
        scale: number
    ) {
        const { s: show, cl: colorStyle, t: lineType, c = BooleanNumber.TRUE } = line;

        if (show === BooleanNumber.TRUE) {
            const {
                originTranslate = Vector2.create(0, 0),
                alignOffset = Vector2.create(0, 0),
                renderConfig = {},
            } = this.extensionOffset;

            const { left, width } = span;

            const { centerAngle: centerAngleDeg = 0, vertexAngle: vertexAngleDeg = 0 } = renderConfig;

            const centerAngle = degToRad(centerAngleDeg);
            const vertexAngle = degToRad(vertexAngleDeg);

            ctx.save();

            ctx.translateWithPrecisionRatio(FIX_ONE_PIXEL_BLUR_OFFSET, FIX_ONE_PIXEL_BLUR_OFFSET);

            ctx.beginPath();
            const color =
                (c === BooleanNumber.TRUE ? getColorStyle(span.ts?.cl) : getColorStyle(colorStyle)) || COLOR_BLACK_RGB;
            ctx.strokeStyle = color;

            this._setLineType(ctx, lineType || TextDecoration.SINGLE);

            const start = calculateRectRotate(
                originTranslate.addByPoint(left, startY),
                Vector2.create(0, 0),
                centerAngle,
                vertexAngle,
                alignOffset
            );
            const end = calculateRectRotate(
                originTranslate.addByPoint(left + width, startY),
                Vector2.create(0, 0),
                centerAngle,
                vertexAngle,
                alignOffset
            );

            ctx.moveToByPrecision(start.x, start.y);
            ctx.lineToByPrecision(end.x, end.y);
            ctx.stroke();

            ctx.restore();
        }
    }

    private _setLineType(ctx: UniverRenderingContext, style: TextDecoration) {
        if (style === TextDecoration.DASH_DOT_DOT_HEAVY || style === TextDecoration.DOT_DOT_DASH) {
            ctx.setLineDash([2, 2, 5, 2, 2]);
        } else if (style === TextDecoration.DASH_DOT_HEAVY || style === TextDecoration.DOT_DASH) {
            ctx.setLineDash([2, 5, 2]);
        } else if (style === TextDecoration.DOTTED || style === TextDecoration.DOTTED_HEAVY) {
            ctx.setLineDash([2]);
        } else if (style === TextDecoration.DASH || style === TextDecoration.DASHED_HEAVY) {
            ctx.setLineDash([3]);
        } else if (style === TextDecoration.DASH_LONG || style === TextDecoration.DASH_LONG_HEAVY) {
            ctx.setLineDash([6]);
        } else {
            ctx.setLineDash([0]);
        }
    }
}

DocumentsSpanAndLineExtensionRegistry.add(new Line());
